import { AuditAction, AuditOutcome, MedicationAdminStatus, HandoffStatus, NursingTaskStatus, TemperatureUnit } from "@prisma/client";
import { writeAuditLog } from "../../lib/audit.js";

export class NursingService {
  constructor(private prisma: any) {}

  async getDashboardData(tenantId: string, userId: string) {
    // 1. Fetch Nurse Profile
    const nurse = await this.prisma.nurse.findFirst({
      where: { userId, tenantId, deletedAt: null },
      include: {
        user: true,
        department: true,
      },
    });

    if (!nurse) return null;

    // 2. Calculate shift details and shift time remaining
    const now = new Date();
    const hours = now.getHours();
    let shiftTimeRemaining = "3h 45m"; // Default fallback
    let shiftRange = "Day Shift (07:00 - 15:00)";

    if (nurse.shiftType === "day") {
      shiftRange = "Day Shift (07:00 - 15:00)";
      if (hours >= 7 && hours < 15) {
        const diffMins = (15 * 60) - (hours * 60 + now.getMinutes());
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        shiftTimeRemaining = `${h}h ${m}m`;
      } else {
        shiftTimeRemaining = "End of Shift";
      }
    } else if (nurse.shiftType === "evening") {
      shiftRange = "Evening Shift (15:00 - 23:00)";
      if (hours >= 15 && hours < 23) {
        const diffMins = (23 * 60) - (hours * 60 + now.getMinutes());
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        shiftTimeRemaining = `${h}h ${m}m`;
      } else {
        shiftTimeRemaining = "End of Shift";
      }
    } else if (nurse.shiftType === "night") {
      shiftRange = "Night Shift (23:00 - 07:00)";
      if (hours >= 23 || hours < 7) {
        const targetMin = hours >= 23 ? (31 * 60) : (7 * 60);
        const currentMin = hours * 60 + now.getMinutes();
        const diffMins = targetMin - currentMin;
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        shiftTimeRemaining = `${h}h ${m}m`;
      } else {
        shiftTimeRemaining = "End of Shift";
      }
    }

    // 3. Define time filter for today's administrations (scheduled today)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 4. Gather Counts (Stats)
    const marDueCount = await this.prisma.medicationAdministration.count({
      where: {
        tenantId,
        status: MedicationAdminStatus.pending,
        scheduledTime: { gte: startOfDay, lte: endOfDay },
      },
    });

    const pendingTasksCount = await this.prisma.nursingTask.count({
      where: {
        tenantId,
        assignedTo: nurse.id,
        status: {
          in: [
            NursingTaskStatus.created,
            NursingTaskStatus.assigned,
            NursingTaskStatus.acknowledged,
            NursingTaskStatus.in_progress,
          ],
        },
      },
    });

    const pendingHandoffsCount = await this.prisma.nursingHandoff.count({
      where: {
        tenantId,
        outgoingNurseId: nurse.id,
        status: HandoffStatus.pending,
      },
    });

    // 5. MAR Administrations list for today
    const marList = await this.prisma.medicationAdministration.findMany({
      where: {
        tenantId,
        scheduledTime: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        patient: {
          include: {
            profile: true,
          },
        },
        prescriptionItem: {
          include: {
            medication: true,
          },
        },
        admission: {
          include: {
            bed: true,
          },
        },
      },
      orderBy: { scheduledTime: "asc" },
    });

    // 6. Active Tasks list
    const tasksList = await this.prisma.nursingTask.findMany({
      where: {
        tenantId,
        assignedTo: nurse.id,
        status: {
          in: [
            NursingTaskStatus.created,
            NursingTaskStatus.assigned,
            NursingTaskStatus.acknowledged,
            NursingTaskStatus.in_progress,
          ],
        },
      },
      include: {
        patient: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { dueAt: "asc" },
    });

    // 7. Active Admissions (to log vitals)
    const activeAdmissions = await this.prisma.admission.findMany({
      where: {
        tenantId,
        status: "admitted",
      },
      include: {
        patient: {
          include: {
            profile: true,
          },
        },
        bed: true,
        ward: true,
      },
    });

    // 8. Ward Grid Bed Occupancy
    const wards = await this.prisma.ward.findMany({
      where: { tenantId, isActive: true },
      include: {
        rooms: {
          include: {
            beds: {
              include: {
                currentAdmission: {
                  include: {
                    patient: {
                      include: {
                        profile: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 9. Other Nurses (for handoff selection)
    const otherNurses = await this.prisma.nurse.findMany({
      where: {
        tenantId,
        isActive: true,
        id: { not: nurse.id },
      },
      include: {
        user: true,
      },
    });

    return {
      nurse: {
        id: nurse.id,
        shiftType: nurse.shiftType,
        shiftRange,
        department: nurse.department?.name || "General Medicine",
      },
      stats: {
        shiftTimeRemaining,
        marDueCount,
        pendingTasksCount,
        pendingHandoffsCount,
      },
      marList: marList.map((m: any) => ({
        id: m.id,
        patientName: m.patient.profile?.fullName || "Unknown",
        bedNumber: m.admission?.bed?.bedNumber || "Unassigned",
        drug: m.prescriptionItem.medication.genericName,
        dose: `${m.prescriptionItem.dose} ${m.prescriptionItem.doseUnit}`,
        route: m.prescriptionItem.route.toUpperCase(),
        due: new Date(m.scheduledTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        rawDueTime: m.scheduledTime.toISOString(),
        status: m.status,
      })),
      tasksList: tasksList.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        patientName: t.patient.profile?.fullName || "Unknown",
        priority: t.priority,
        status: t.status,
        dueAt: t.dueAt?.toISOString(),
      })),
      activeAdmissions: activeAdmissions.map((a: any) => ({
        id: a.id,
        patientId: a.patientId,
        uhid: a.patient.uhid,
        patientName: a.patient.profile?.fullName || "Steve Rogers",
        bedNumber: a.bed?.bedNumber || "Unassigned",
        wardName: a.ward.name,
      })),
      wards: wards.map((w: any) => ({
        id: w.id,
        name: w.name,
        code: w.code,
        capacity: w.capacity,
        rooms: w.rooms.map((r: any) => ({
          id: r.id,
          roomNumber: r.roomNumber,
          roomType: r.roomType,
          beds: r.beds.map((b: any) => ({
            id: b.id,
            bedNumber: b.bedNumber,
            status: b.status,
            bedType: b.bedType,
            patientName: b.currentAdmission?.patient.profile?.fullName || null,
          })),
        })),
      })),
      otherNurses: otherNurses.map((n: any) => {
        const localPart = n.user.email.split("@")[0] || "nurse";
        const name = localPart.split(".").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
        return {
          id: n.id,
          email: n.user.email,
          name: n.user.email === "nurse@mediflow.com" ? "Clara Barton" : name,
        };
      }),
    };
  }

  async administerMedication(
    tenantId: string,
    userId: string,
    nurseId: string,
    administrationId: string,
    ipAddress: string,
    userAgent?: string
  ) {
    const adminRecord = await this.prisma.medicationAdministration.findFirst({
      where: { id: administrationId, tenantId },
      include: {
        prescriptionItem: {
          include: {
            medication: true,
          },
        },
      },
    });

    if (!adminRecord) return null;

    const updated = await this.prisma.medicationAdministration.update({
      where: { id: administrationId },
      data: {
        status: MedicationAdminStatus.administered,
        administeredTime: new Date(),
        administeredBy: nurseId,
        actualDose: adminRecord.prescriptionItem.dose,
        actualRoute: adminRecord.prescriptionItem.route,
      },
    });

    // Audit Log
    await writeAuditLog(this.prisma, {
      tenantId,
      userId,
      userRole: "nurse",
      patientId: adminRecord.patientId,
      actionType: AuditAction.MEDICATION_ADMINISTERED,
      resourceType: "MedicationAdministration",
      resourceId: administrationId,
      ipAddress,
      userAgent,
      outcome: AuditOutcome.success,
      metadata: {
        drug: adminRecord.prescriptionItem.medication.genericName,
        dose: adminRecord.prescriptionItem.dose.toString(),
        unit: adminRecord.prescriptionItem.doseUnit,
      },
    });

    return updated;
  }

  async recordVitals(
    tenantId: string,
    userId: string,
    ipAddress: string,
    userAgent: string | undefined,
    body: {
      patientId: string;
      admissionId?: string;
      systolicBp?: number;
      diastolicBp?: number;
      pulse?: number;
      temperature?: number;
      temperatureUnit?: TemperatureUnit;
      spo2?: number;
      respiratoryRate?: number;
      weightKg?: number;
      heightCm?: number;
      painScore?: number;
      notes?: string;
    }
  ) {
    // Calculate critical status
    const criticalParams: string[] = [];
    
    if (body.systolicBp !== undefined && (body.systolicBp > 140 || body.systolicBp < 90)) {
      criticalParams.push("systolicBp");
    }
    if (body.diastolicBp !== undefined && (body.diastolicBp > 90 || body.diastolicBp < 60)) {
      criticalParams.push("diastolicBp");
    }
    if (body.pulse !== undefined && (body.pulse > 100 || body.pulse < 50)) {
      criticalParams.push("pulse");
    }
    if (body.spo2 !== undefined && body.spo2 < 95) {
      criticalParams.push("spo2");
    }
    if (body.temperature !== undefined) {
      const tempF = body.temperatureUnit === TemperatureUnit.C 
        ? (body.temperature * 9) / 5 + 32 
        : body.temperature;
      if (tempF > 100.4 || tempF < 95) {
        criticalParams.push("temperature");
      }
    }

    const isCritical = criticalParams.length > 0;

    const vital = await this.prisma.vital.create({
      data: {
        tenantId,
        patientId: body.patientId,
        admissionId: body.admissionId || null,
        recordedBy: userId,
        systolicBp: body.systolicBp,
        diastolicBp: body.diastolicBp,
        pulse: body.pulse,
        temperature: body.temperature,
        temperatureUnit: body.temperatureUnit || TemperatureUnit.C,
        spo2: body.spo2,
        respiratoryRate: body.respiratoryRate,
        weightKg: body.weightKg,
        heightCm: body.heightCm,
        painScore: body.painScore,
        isCritical,
        criticalParams,
        notes: body.notes,
      },
    });

    // Write audit log
    await writeAuditLog(this.prisma, {
      tenantId,
      userId,
      userRole: "nurse",
      patientId: body.patientId,
      actionType: AuditAction.VITALS_RECORDED,
      resourceType: "Vital",
      resourceId: vital.id,
      ipAddress,
      userAgent,
      outcome: AuditOutcome.success,
      metadata: { isCritical, criticalParams },
    });

    if (isCritical) {
      await writeAuditLog(this.prisma, {
        tenantId,
        userId,
        userRole: "nurse",
        patientId: body.patientId,
        actionType: AuditAction.CRITICAL_VITAL_FLAGGED,
        resourceType: "Vital",
        resourceId: vital.id,
        ipAddress,
        userAgent,
        outcome: AuditOutcome.success,
        metadata: { criticalParams },
      });
    }

    return vital;
  }

  async submitHandoff(
    tenantId: string,
    userId: string,
    nurseId: string,
    ipAddress: string,
    userAgent: string | undefined,
    body: {
      wardId: string;
      shiftDate: string;
      outgoingShift: string;
      incomingNurseId?: string;
      summaryNotes?: string;
    }
  ) {
    const handoff = await this.prisma.nursingHandoff.create({
      data: {
        tenantId,
        wardId: body.wardId,
        shiftDate: new Date(body.shiftDate),
        outgoingShift: body.outgoingShift as any,
        outgoingNurseId: nurseId,
        incomingNurseId: body.incomingNurseId || null,
        status: HandoffStatus.submitted,
        summaryNotes: body.summaryNotes,
        submittedAt: new Date(),
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      userId,
      userRole: "nurse",
      actionType: AuditAction.HANDOFF_SUBMITTED,
      resourceType: "NursingHandoff",
      resourceId: handoff.id,
      ipAddress,
      userAgent,
      outcome: AuditOutcome.success,
      metadata: { wardId: body.wardId, shift: body.outgoingShift },
    });

    return handoff;
  }
}
