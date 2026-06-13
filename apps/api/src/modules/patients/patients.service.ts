import { PrismaClient } from "@prisma/client";
import { ListPatientsQuery, CreatePatientBody } from "./patients.schema.js";
import bcrypt from "bcryptjs";
import { CacheService, CacheKeys, CacheTTL } from "../../lib/cache.js";


export class PatientService {
  private cache: CacheService;

  constructor(private prisma: PrismaClient | any, redis: import("ioredis").default | null = null) {
    this.cache = new CacheService(redis);
  }


  async list(tenantId: string, query: ListPatientsQuery) {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

    // Cache hit — only cache non-search queries (searches are dynamic)
    const cacheKey = CacheKeys.patientList(tenantId, page, limit, search ?? "");
    const cached = await this.cache.get<{ data: any[]; pagination: any }>(cacheKey);
    if (cached) return cached;

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    // Join search on profile fields
    if (search) {
      where.OR = [
        { uhid: { contains: search, mode: "insensitive" } },
        { profile: { fullName: { contains: search, mode: "insensitive" } } },
        { profile: { mobileNumber: { contains: search } } },
      ];
    }

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        include: {
          profile: {
            select: {
              fullName: true,
              dateOfBirth: true,
              gender: true,
              bloodGroup: true,
              mobileNumber: true,
              email: true,
              city: true,
              state: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.patient.count({ where }),
    ]);

    const result = {
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cache.set(cacheKey, result, CacheTTL.patientList);
    return result;
  }


  async getById(tenantId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId, deletedAt: null },
      include: {
        profile: true,
        encounters: {
          where: { deletedAt: null },
          include: {
            doctor: {
              include: { user: { select: { email: true } } },
            },
            diagnoses: { where: { deletedAt: null } },
            prescriptions: {
              include: { items: { include: { medication: true } } },
            },
            labOrders: {
              include: { results: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        vitals: {
          orderBy: { recordedAt: "desc" },
          take: 20,
        },
        appointments: {
          where: { deletedAt: null },
          orderBy: { scheduledAt: "desc" },
          take: 10,
        },
      },
    });

    return patient;
  }

  async getDashboardData(tenantId: string, userId: string) {
    // Check cache first — collapses 7 sequential DB queries into 0 on hit
    const cacheKey = CacheKeys.patientDashboard(userId);
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const patient = await this.prisma.patient.findFirst({
      where: { userId, tenantId, deletedAt: null },
      include: {
        profile: true,
      },
    });

    if (!patient) return null;

    // Run independent queries in parallel for maximum speed
    const [nextAppointment, latestVitals, activeConsentsCount, invoices, encounters, doctors, departments, facilities] =
      await Promise.all([
        // Get next scheduled appointment
        this.prisma.appointment.findFirst({
          where: {
            patientId: patient.id,
            tenantId,
            status: "scheduled",
            scheduledAt: { gt: new Date() },
            deletedAt: null,
          },
          include: {
            doctor: {
              include: {
                user: { select: { email: true } },
              },
            },
            department: { select: { name: true, code: true } },
            facility: { select: { name: true } },
          },
          orderBy: { scheduledAt: "asc" },
        }),

        // Get recent vitals
        this.prisma.vital.findFirst({
          where: { patientId: patient.id, tenantId },
          orderBy: { recordedAt: "desc" },
        }),

        // Count active consents
        this.prisma.consent.count({
          where: {
            patientId: patient.id,
            tenantId,
            status: "granted",
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        }),

        // Outstanding invoices
        this.prisma.invoice.findMany({
          where: {
            patientId: patient.id,
            tenantId,
            status: { in: ["issued", "partially_paid"] },
          },
          select: { totalAmount: true, paidAmount: true },
        }),

        // Recent encounters
        this.prisma.encounter.findMany({
          where: {
            patientId: patient.id,
            tenantId,
            status: { in: ["finalized", "in_progress", "draft"] },
            deletedAt: null,
          },
          include: {
            doctor: {
              include: { user: { select: { email: true } } },
            },
            diagnoses: { where: { deletedAt: null } },
            prescriptions: {
              include: { items: { include: { medication: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),

        // Metadata lookups
        this.prisma.doctor.findMany({
          where: { tenantId, isActive: true, deletedAt: null },
          include: { user: { select: { email: true } } },
        }),

        this.prisma.department.findMany({
          where: { tenantId, isActive: true, deletedAt: null },
        }),

        this.prisma.facility.findMany({
          where: { tenantId, isActive: true, deletedAt: null },
        }),
      ]);

    const outstandingBalance = invoices.reduce(
      (sum: number, inv: any) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)),
      0
    );

    const result = {
      patient,
      stats: { nextAppointment, latestVitals, activeConsentsCount, outstandingBalance },
      recentEncounters: encounters,
      metadata: { doctors, departments, facilities },
    };

    // Cache the aggregated result
    await this.cache.set(cacheKey, result, CacheTTL.patientDashboard);
    return result;
  }


  async create(tenantId: string, userId: string, body: CreatePatientBody) {
    // Generate UHID
    const count = await this.prisma.patient.count({ where: { tenantId } });
    const uhid = `PAT-${String(count + 1).padStart(6, "0")}`;

    const patient = await this.prisma.patient.create({
      data: {
        tenantId,
        uhid,
        status: "active",
        registrationType: body.registrationType,
        registrationDate: new Date(),
        createdBy: userId,
        profile: {
          create: {
            tenantId,
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
            updatedBy: userId,
          },
        },
      },
      include: { profile: true },
    });

    return patient;
  }

  async getProfileAndUserSettings(tenantId: string, userId: string) {
    // Check cache first
    const cacheKey = CacheKeys.patientProfile(userId);
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const patient = await this.prisma.patient.findFirst({
      where: { userId, tenantId, deletedAt: null },
      include: {
        profile: true,
      },
    });

    if (!patient) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        timezone: true,
        language: true,
        mfaEnabled: true,
        mfaMethod: true,
        totpSecret: true,
      },
    });

    const result = { patient, user };
    await this.cache.set(cacheKey, result, CacheTTL.patientProfile);
    return result;
  }


  async updateProfile(tenantId: string, userId: string, body: any) {
    const patient = await this.prisma.patient.findFirst({
      where: { userId, tenantId, deletedAt: null },
      include: { profile: true },
    });

    if (!patient || !patient.profile) {
      throw new Error("Patient profile not found");
    }

    // Optimistic locking check
    if (patient.profile.version !== body.version) {
      throw new Error("Version mismatch (optimistic locking failed). Please reload the page and try again.");
    }

    const { version, email, mobileNumber, dateOfBirth, insuranceValidity, ...profileData } = body;

    // If email is changing, ensure it's not already in use by another user in this tenant
    if (email && email.toLowerCase() !== patient.profile.email?.toLowerCase()) {
      const emailInUse = await this.prisma.user.findFirst({
        where: {
          tenantId,
          email: email.toLowerCase(),
          id: { not: userId },
          deletedAt: null,
        },
      });
      if (emailInUse) {
        throw new Error("The email address is already in use by another account.");
      }
    }

    const updatedProfile = await this.prisma.$transaction(async (tx: any) => {
      // Update User email/phone if changed
      const userUpdates: any = {};
      if (email !== undefined) userUpdates.email = email ? email.toLowerCase() : null;
      if (mobileNumber !== undefined) userUpdates.phone = mobileNumber;

      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdates,
        });
      }

      // Build profile update data with proper type conversions
      const profileUpdateData: any = {
        ...profileData,
        version: { increment: 1 },
        updatedBy: userId,
      };

      // Handle email — preserve null to allow clearing
      if (email !== undefined) {
        profileUpdateData.email = email ? email.toLowerCase() : null;
      }

      // Handle mobileNumber — preserve null to allow clearing
      if (mobileNumber !== undefined) {
        profileUpdateData.mobileNumber = mobileNumber;
      }

      // Convert date strings to Date objects for Prisma DateTime fields
      if (dateOfBirth !== undefined) {
        profileUpdateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
      }
      if (insuranceValidity !== undefined) {
        profileUpdateData.insuranceValidity = insuranceValidity ? new Date(insuranceValidity) : null;
      }

      // Update PatientProfile
      const result = await tx.patientProfile.update({
        where: { id: patient.profile.id },
        data: profileUpdateData,
      });

      return result;
    });

    // Invalidate stale caches
    await Promise.all([
      this.cache.del(CacheKeys.patientProfile(userId)),
      this.cache.del(CacheKeys.patientDashboard(userId)),
    ]);

    return updatedProfile;
  }



  async updateSecuritySettings(tenantId: string, userId: string, body: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.tenantId !== tenantId) {
      throw new Error("User account not found");
    }

    const dataToUpdate: any = {};

    if (body.timezone !== undefined) {
      dataToUpdate.timezone = body.timezone;
    }

    if (body.language !== undefined) {
      dataToUpdate.language = body.language;
    }

    // Handle password change
    if (body.newPassword) {
      if (!body.currentPassword) {
        throw new Error("Current password is required to change password");
      }

      const isPasswordValid = await bcrypt.compare(body.currentPassword, user.passwordHash || "");
      if (!isPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;
      dataToUpdate.passwordHash = await bcrypt.hash(body.newPassword, rounds);
      dataToUpdate.passwordChangedAt = new Date();
    }

    // Handle MFA
    let newTotpSecret: string | null = null;
    if (body.mfaEnabled !== undefined) {
      dataToUpdate.mfaEnabled = body.mfaEnabled;
      if (body.mfaEnabled) {
        dataToUpdate.mfaMethod = "totp";
        if (!user.totpSecret) {
          // Generate a base32-like key for simulation (e.g. 16 characters A-Z, 2-7)
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
          let secret = "";
          for (let i = 0; i < 16; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          dataToUpdate.totpSecret = secret;
          newTotpSecret = secret;
        } else {
          newTotpSecret = user.totpSecret;
        }
      } else {
        dataToUpdate.mfaMethod = null;
        dataToUpdate.totpSecret = null;
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        phone: true,
        timezone: true,
        language: true,
        mfaEnabled: true,
        mfaMethod: true,
        totpSecret: true,
      },
    });

    // Invalidate profile cache so next read reflects new security settings
    await this.cache.del(CacheKeys.patientProfile(userId));

    return { user: updatedUser, totpSecret: newTotpSecret };
  }
}

