import { AuditAction, AuditOutcome } from "@prisma/client";
import { writeAuditLog } from "../../lib/audit.js";

function getRelativeTimeString(dateStr: Date | string): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 min ago";
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs === 1) return "1 hour ago";
  if (diffHrs < 24) return `${diffHrs} hours ago`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function getAuditDetailString(log: any): string {
  const metadata = (log.metadata as Record<string, any>) || {};
  switch (log.actionType) {
    case "USER_LOGIN":
      return `Session started from ${log.ipAddress}`;
    case "USER_REGISTERED":
      return `Created new staff account`;
    case "PATIENT_RECORD_ACCESSED":
      return `Accessed record (UHID: ${metadata.uhid || "unknown"})`;
    case "MEDICATION_ADMINISTERED":
      return `Logged ${metadata.drug || "medication"} ${metadata.dose || ""} (IV/Oral)`;
    case "VITALS_RECORDED":
      return `Recorded vitals (Critical: ${metadata.isCritical ? "Yes" : "No"})`;
    case "CRITICAL_VITAL_FLAGGED":
      return `Critical parameters flagged: ${(metadata.criticalParams || []).join(", ")}`;
    case "HANDOFF_SUBMITTED":
      return `Submitted SBAR handover for Ward ${metadata.wardId || ""}`;
    default:
      return `Logged action ${log.actionType} on resource ${log.resourceType}`;
  }
}

export class AdminService {
  constructor(private prisma: any) {}

  async getDashboardData(tenantId: string) {
    // 1. Fetch counts of staff users (roles: doctor, nurse, admin)
    const staffCount = await this.prisma.userRoleAssignment.count({
      where: {
        tenantId,
        role: {
          name: {
            in: ["doctor", "nurse", "admin"],
          },
        },
      },
    });

    // 2. Fetch bed occupancy metrics (synced with getWardLayout counting)
    const occupiedBeds = await this.prisma.admission.count({
      where: {
        tenantId,
        status: { in: ["admitted", "in_care"] },
        bedId: { not: null },
      },
    });

    const totalBeds = await this.prisma.bed.count({
      where: {
        tenantId,
        isActive: true,
      },
    });

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // 3. Compute total revenue today (payments recorded today with completed status)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const paymentsToday = await this.prisma.payment.findMany({
      where: {
        tenantId,
        paymentStatus: "completed",
        paidAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        amount: true,
      },
    });

    const totalRevenue = paymentsToday.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    // 4. Count active incidents (reported, investigating, contained)
    const activeIncidents = await this.prisma.incidentReport.count({
      where: {
        tenantId,
        status: {
          in: ["reported", "investigating", "contained"],
        },
      },
    });

    // 5. Fetch 10 most recent audit logs
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    const userIds = Array.from(new Set(auditLogs.map((l: any) => l.userId)));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });

    const userMap = new Map(users.map((u: any) => [u.id, u.email]));

    const recentEvents = auditLogs.map((l: any) => {
      const email = (userMap.get(l.userId) as string) || "system@careos.com";
      const localPart = email.split("@")[0] || "system";
      let name = localPart.split(".").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
      if (email === "nurse@careos.com") name = "Nurse Clara Barton";
      else if (email === "doctor@careos.com") name = "Dr. Jane Foster";
      else if (email === "admin@careos.com") name = "Admin Nick Fury";
      else if (email === "superadmin@careos.com") name = "Super Admin Tony Stark";

      return {
        id: l.id,
        action: l.actionType,
        user: name,
        time: getRelativeTimeString(l.timestamp),
        detail: getAuditDetailString(l),
      };
    });

    return {
      stats: {
        totalStaff: `${staffCount} Registered`,
        bedOccupancy: `${occupancyRate}% (${occupiedBeds}/${totalBeds} Occupied)`,
        billingRevenue: `₹ ${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        activeIncidents: `${activeIncidents} Open`,
      },
      recentEvents,
    };
  }

  async provisionStaff(
    tenantId: string,
    adminUserId: string,
    ipAddress: string,
    userAgent: string | undefined,
    body: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      role: "doctor" | "nurse" | "admin";
      specialization?: string;
      registrationNumber?: string;
      departmentId?: string;
    }
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: body.email.toLowerCase(), deletedAt: null },
    });

    if (existing) {
      throw new Error("A user account with this email already exists");
    }

    const targetRole = await this.prisma.role.findFirst({
      where: {
        name: body.role,
        OR: [{ tenantId }, { tenantId: null }],
      },
      orderBy: { tenantId: "desc" },
    });

    if (!targetRole) {
      throw new Error(`Role '${body.role}' is not configured for this tenant`);
    }

    const result = await this.prisma.$transaction(async (tx: any) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          tenantId,
          email: body.email.toLowerCase(),
          passwordHash: body.passwordHash,
          status: "active",
        },
      });

      // 2. Assign Role
      await tx.userRoleAssignment.create({
        data: {
          tenantId,
          userId: user.id,
          roleId: targetRole.id,
          isPrimary: true,
        },
      });

      // 3. Create specialised doctor/nurse profile
      if (body.role === "doctor") {
        await tx.doctor.create({
          data: {
            tenantId,
            userId: user.id,
            registrationNumber: body.registrationNumber || "MOCK-DOC-REG",
            registrationBody: "State Medical Council",
            specialization: body.specialization || "General Medicine",
            departmentId: body.departmentId || null,
            qualification: ["MBBS"],
          },
        });
      } else if (body.role === "nurse") {
        await tx.nurse.create({
          data: {
            tenantId,
            userId: user.id,
            registrationNumber: body.registrationNumber || "MOCK-NURSE-REG",
            qualification: ["B.Sc Nursing"],
            departmentId: body.departmentId || null,
          },
        });
      }

      return user;
    });

    // Write audit log
    await writeAuditLog(this.prisma, {
      tenantId,
      userId: adminUserId,
      userRole: "admin",
      actionType: AuditAction.USER_REGISTERED,
      resourceType: "User",
      resourceId: result.id,
      ipAddress,
      userAgent,
      outcome: AuditOutcome.success,
      metadata: { role: body.role, email: body.email },
    });

    return result;
  }

  async getWardLayout(tenantId: string) {
    const wards = await this.prisma.ward.findMany({
      where: { tenantId, isActive: true },
      include: {
        department: { select: { name: true } },
        rooms: {
          where: { isActive: true },
          include: {
            beds: {
              where: { isActive: true },
              select: { id: true, bedNumber: true, status: true, bedType: true },
            },
          },
          orderBy: { roomNumber: "asc" },
        },
        _count: {
          select: {
            beds: true,
            admissions: { where: { status: { in: ["admitted", "in_care"] } } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return wards.map((w: any) => ({
      id: w.id,
      name: w.name,
      code: w.code,
      type: w.type,
      capacity: w.capacity,
      departmentName: w.department?.name || null,
      totalBeds: w._count.beds,
      occupiedBeds: w._count.admissions,
      rooms: w.rooms.map((r: any) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        roomType: r.roomType,
        capacity: r.capacity,
        beds: r.beds,
      })),
    }));
  }

  async exportAuditCsv(tenantId: string): Promise<string> {
    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { timestamp: "desc" },
    });

    const userIds = Array.from(new Set(logs.map((l: any) => l.userId)));
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((u: any) => [u.id, u.email]));

    const escape = (v: any) => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const header = "Action,User Email,User ID,Resource Type,Resource ID,Outcome,IP Address,Metadata,Timestamp";
    const rows = logs.map((l: any) => [
      escape(l.actionType),
      escape(userMap.get(l.userId) || "unknown"),
      escape(l.userId),
      escape(l.resourceType),
      escape(l.resourceId),
      escape(l.outcome),
      escape(l.ipAddress),
      escape(JSON.stringify(l.metadata ?? {})),
      escape(l.timestamp.toISOString()),
    ].join(","));

    return [header, ...rows].join("\n");
  }

  async getAuditLogs(tenantId: string, limit = 50, offset = 0) {
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where: { tenantId } }),
    ]);

    const userIds = Array.from(new Set(logs.map((l: any) => l.userId)));
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true },
        })
      : [];

    const userMap = new Map(users.map((u: any) => [u.id, u.email]));

    return {
      logs: logs.map((l: any) => ({
        id: l.id,
        action: l.actionType,
        userEmail: userMap.get(l.userId) || "unknown",
        userId: l.userId,
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        outcome: l.outcome,
        ipAddress: l.ipAddress,
        metadata: l.metadata,
        timestamp: l.timestamp,
      })),
      total,
      limit,
      offset,
    };
  }
}
