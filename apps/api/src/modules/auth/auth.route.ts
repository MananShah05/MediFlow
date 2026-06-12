import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import type { CookieSerializeOptions } from "@fastify/cookie";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { env } from "../../config/env.js";

const refreshCookieName = "careos_refresh";
const roleCookieName = "careos_role";
const sessionMaxAgeSeconds = 7 * 24 * 60 * 60;

const registerPatientSchema = z
  .object({
    fullName: z.string().trim().min(2).max(200),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    mobileNumber: z.string().trim().min(10).max(15).optional(),
    bloodGroup: z
      .enum([
        "A_positive",
        "A_negative",
        "B_positive",
        "B_negative",
        "AB_positive",
        "AB_negative",
        "O_positive",
        "O_negative",
      ])
      .optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    pincode: z.string().trim().optional(),
    emergencyContactName: z.string().trim().optional(),
    emergencyContactRelation: z.string().trim().optional(),
    emergencyContactPhone: z.string().trim().optional(),
    tenantSlug: z.string().trim().min(1).default("cityhospital"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function getCookieOptions(httpOnly: boolean): CookieSerializeOptions {
  const sameSite =
    env.COOKIE_SAME_SITE ?? (env.NODE_ENV === "production" ? "none" : "lax");
  const secure = env.NODE_ENV === "production" || sameSite === "none";

  return {
    path: "/",
    httpOnly,
    secure,
    sameSite,
    domain: env.COOKIE_DOMAIN,
    maxAge: sessionMaxAgeSeconds,
  };
}

function clearAuthCookies(reply: any) {
  const clearOptions = {
    path: "/",
    domain: env.COOKIE_DOMAIN,
  };

  reply.clearCookie(refreshCookieName, clearOptions);
  reply.clearCookie(roleCookieName, clearOptions);
}

async function issueSession(fastify: FastifyInstance, reply: any, request: any, user: any, roleName: string) {
  const session = await fastify.prisma.session.create({
    data: {
      userId: user.id,
      tenantId: user.tenantId,
      role: roleName,
      ipAddress: request.ip === "::1" ? "127.0.0.1" : request.ip,
      userAgent: request.headers["user-agent"] || "unknown",
      expiresAt: new Date(Date.now() + sessionMaxAgeSeconds * 1000),
    },
  });

  const accessToken = fastify.jwt.sign({
    userId: user.id,
    tenantId: user.tenantId,
    role: roleName,
    sessionId: session.id,
  });

  reply.setCookie(refreshCookieName, session.id, getCookieOptions(true));
  reply.setCookie(roleCookieName, roleName, getCookieOptions(false));

  return { accessToken, session };
}

function getStaffNames(email: string, role: string) {
  const emailLower = email.toLowerCase();
  if (emailLower === "nurse@careos.com") return { firstName: "Clara", lastName: "Barton" };
  if (emailLower === "doctor@careos.com") return { firstName: "Jane", lastName: "Foster" };
  if (emailLower === "admin@careos.com") return { firstName: "Nick", lastName: "Fury" };
  if (emailLower === "superadmin@careos.com") return { firstName: "Tony", lastName: "Stark" };

  const emailParts = emailLower.split("@");
  const namePart = emailParts[0] || "staff";
  const parts = namePart.split(".");
  const p0 = parts[0];
  const p1 = parts[1];
  if (parts.length >= 2 && p0 && p1) {
    return {
      firstName: p0.charAt(0).toUpperCase() + p0.slice(1),
      lastName: p1.charAt(0).toUpperCase() + p1.slice(1),
    };
  }
  return {
    firstName: namePart.charAt(0).toUpperCase() + namePart.slice(1),
    lastName: role.charAt(0).toUpperCase() + role.slice(1),
  };
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/auth/register-patient",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 15 * 60 * 1000,
        },
      },
    },
    async (request, reply) => {
    const body = registerPatientSchema.parse(request.body);

    const tenant = await fastify.prisma.tenant.findFirst({
      where: { slug: body.tenantSlug, status: "active", deletedAt: null },
    });

    if (!tenant) {
      return reply.status(400).send({
        message: "Hospital tenant not found or inactive.",
      });
    }

    const existingUser = await fastify.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: body.email,
        deletedAt: null,
      },
    });

    if (existingUser) {
      return reply.status(409).send({
        message: "An account already exists for this email.",
      });
    }

    const patientRole = await fastify.prisma.role.findFirst({
      where: {
        name: "patient",
        OR: [{ tenantId: tenant.id }, { tenantId: null }],
      },
      orderBy: { tenantId: "desc" },
    });

    if (!patientRole) {
      return reply.status(500).send({
        message: "Patient role is not configured for this tenant.",
      });
    }

    const passwordHash = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS);
    const patientCount = await fastify.prisma.patient.count({
      where: { tenantId: tenant.id },
    });
    const uhid = `PAT-${String(patientCount + 1).padStart(6, "0")}`;

    const result = await fastify.prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: body.email,
          phone: body.mobileNumber,
          passwordHash,
          status: "active",
          emailVerified: false,
          phoneVerified: false,
        },
      });

      await tx.userRoleAssignment.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          roleId: patientRole.id,
          isPrimary: true,
        },
      });

      const patient = await tx.patient.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          uhid,
          status: "active",
          registrationType: "self",
          registrationDate: new Date(),
          createdBy: user.id,
          profile: {
            create: {
              tenantId: tenant.id,
              fullName: body.fullName,
              dateOfBirth: new Date(body.dateOfBirth),
              gender: body.gender,
              bloodGroup: body.bloodGroup,
              mobileNumber: body.mobileNumber,
              email: body.email,
              city: body.city,
              state: body.state,
              pincode: body.pincode,
              emergencyContactName: body.emergencyContactName,
              emergencyContactRelation: body.emergencyContactRelation,
              emergencyContactPhone: body.emergencyContactPhone,
              updatedBy: user.id,
            },
          },
        },
        include: { profile: true },
      });

      return { user, patient };
    });

    const { accessToken } = await issueSession(
      fastify,
      reply,
      request,
      result.user,
      "patient"
    );

    await writeAuditLog(fastify.prisma as any, {
      tenantId: tenant.id,
      userId: result.user.id,
      userRole: "patient",
      patientId: result.patient.id,
      actionType: "USER_REGISTERED",
      resourceType: "Patient",
      resourceId: result.patient.id,
      ipAddress: request.ip === "::1" ? "127.0.0.1" : request.ip,
      userAgent: request.headers["user-agent"] || "unknown",
      outcome: "success",
    }).catch((err) => {
      fastify.log.error(err, "Failed to write audit log for patient registration");
    });

    return reply.status(201).send({
      accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.patient.profile?.fullName.split(" ")[0] || "Patient",
        lastName:
          result.patient.profile?.fullName.split(" ").slice(1).join(" ") ||
          "Patient",
        role: "patient",
        tenantId: tenant.id,
      },
      patient: {
        id: result.patient.id,
        uhid: result.patient.uhid,
      },
    });
  });

  fastify.post(
    "/auth/login",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 15 * 60 * 1000,
        },
      },
    },
    async (request, reply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.status(400).send({
        message: "Email and password are required.",
      });
    }

    const user = await fastify.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user || !user.passwordHash) {
      return reply.status(401).send({
        message: "Invalid email or password. Please try again.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Log login failure
      const primaryAssignment = user.userRoles.find((r: any) => r.isPrimary) || user.userRoles[0];
      const roleName = primaryAssignment?.role?.name || "patient";

      await writeAuditLog(fastify.prisma as any, {
        tenantId: user.tenantId,
        userId: user.id,
        userRole: roleName,
        actionType: "USER_LOGIN",
        resourceType: "User",
        resourceId: user.id,
        ipAddress: request.ip === "::1" ? "127.0.0.1" : request.ip,
        userAgent: request.headers["user-agent"] || "unknown",
        outcome: "failure",
        failureReason: "INVALID_PASSWORD",
      }).catch(err => {
        fastify.log.error(err, "Failed to write audit log for failed login");
      });

      return reply.status(401).send({
        message: "Invalid email or password. Please try again.",
      });
    }

    // Get user's primary role
    const primaryAssignment = user.userRoles.find((r: any) => r.isPrimary) || user.userRoles[0];
    const roleName = primaryAssignment?.role?.name || "patient";

    // Determine user name
    let firstName = "User";
    let lastName = "Name";
    if (roleName === "patient") {
      const patient = await fastify.prisma.patient.findFirst({
        where: { userId: user.id },
        include: { profile: true },
      });
      if (patient?.profile) {
        const parts = patient.profile.fullName.split(" ");
        firstName = parts[0] || "Patient";
        lastName = parts.slice(1).join(" ") || "Patient";
      }
    } else {
      const staffNames = getStaffNames(user.email, roleName);
      firstName = staffNames.firstName;
      lastName = staffNames.lastName;
    }

    const { accessToken } = await issueSession(
      fastify,
      reply,
      request,
      user,
      roleName
    );

    // Log successful login
    await writeAuditLog(fastify.prisma as any, {
      tenantId: user.tenantId,
      userId: user.id,
      userRole: roleName,
      actionType: "USER_LOGIN",
      resourceType: "User",
      resourceId: user.id,
      ipAddress: request.ip === "::1" ? "127.0.0.1" : request.ip,
      userAgent: request.headers["user-agent"] || "unknown",
      outcome: "success",
    }).catch(err => {
      fastify.log.error(err, "Failed to write audit log for successful login");
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName,
        lastName,
        role: roleName,
        tenantId: user.tenantId,
      },
    };
  });

  fastify.post("/auth/refresh", async (request, reply) => {
    const refreshCookie = request.cookies[refreshCookieName];

    if (!refreshCookie) {
      clearAuthCookies(reply);
      return reply.status(401).send({ message: "No refresh token" });
    }

    const session = await fastify.prisma.session.findFirst({
      where: {
        id: refreshCookie,
        expiresAt: { gt: new Date() },
        invalidatedAt: null,
      },
      include: {
        user: true,
      },
    });

    if (!session || !session.user || session.user.deletedAt) {
      clearAuthCookies(reply);
      return reply.status(401).send({ message: "Invalid or expired session" });
    }

    // Update session last active time
    await fastify.prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    const roleName = session.role;

    // Determine user name
    let firstName = "User";
    let lastName = "Name";
    if (roleName === "patient") {
      const patient = await fastify.prisma.patient.findFirst({
        where: { userId: session.userId },
        include: { profile: true },
      });
      if (patient?.profile) {
        const parts = patient.profile.fullName.split(" ");
        firstName = parts[0] || "Patient";
        lastName = parts.slice(1).join(" ") || "Patient";
      }
    } else {
      const staffNames = getStaffNames(session.user.email, roleName);
      firstName = staffNames.firstName;
      lastName = staffNames.lastName;
    }

    const accessToken = fastify.jwt.sign({
      userId: session.userId,
      tenantId: session.tenantId,
      role: roleName,
      sessionId: session.id,
    });

    reply.setCookie(refreshCookieName, session.id, getCookieOptions(true));
    reply.setCookie(roleCookieName, roleName, getCookieOptions(false));

    return {
      accessToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName,
        lastName,
        role: roleName,
        tenantId: session.tenantId,
      },
    };
  });

  fastify.post("/auth/logout", async (request, reply) => {
    const refreshCookie = request.cookies[refreshCookieName];

    if (refreshCookie) {
      // Invalidate session in DB
      await fastify.prisma.session.updateMany({
        where: { id: refreshCookie },
        data: {
          invalidatedAt: new Date(),
          invalidationReason: "USER_LOGOUT",
        },
      }).catch(err => {
        fastify.log.error(err, "Failed to invalidate session in DB during logout");
      });
    }

    clearAuthCookies(reply);
    return { success: true };
  });
}
