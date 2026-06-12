import { ListEncountersQuery, CreateEncounterBody, UpdateEncounterBody, AddDiagnosisBody } from "./encounters.schema.js";

export class EncounterService {
  constructor(private prisma: any) {}

  async list(tenantId: string, query: ListEncountersQuery) {
    const { doctorId, patientId, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, deletedAt: null };
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const [encounters, total] = await Promise.all([
      this.prisma.encounter.findMany({
        where,
        include: {
          patient: {
            include: { profile: { select: { fullName: true } } },
          },
          doctor: { include: { user: { select: { email: true } } } },
          diagnoses: { where: { deletedAt: null }, select: { icdCode: true, icdDescription: true, diagnosisType: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.encounter.count({ where }),
    ]);

    return {
      data: encounters,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(tenantId: string, id: string) {
    return this.prisma.encounter.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        patient: { include: { profile: true } },
        doctor: { include: { user: { select: { email: true } } } },
        diagnoses: { where: { deletedAt: null } },
        prescriptions: {
          include: {
            items: { include: { medication: true } },
          },
        },
        labOrders: {
          include: { results: true },
        },
        notes: { orderBy: { authoredAt: "desc" } },
        department: { select: { name: true, code: true } },
      },
    });
  }

  async create(tenantId: string, userId: string, doctorId: string, body: CreateEncounterBody) {
    const encounter = await this.prisma.encounter.create({
      data: {
        tenantId,
        patientId: body.patientId,
        doctorId,
        appointmentId: body.appointmentId,
        facilityId: body.facilityId,
        departmentId: body.departmentId,
        encounterType: body.encounterType,
        status: "in_progress",
        chiefComplaint: body.chiefComplaint,
        startedAt: new Date(),
        createdBy: userId,
      },
      include: {
        patient: { include: { profile: { select: { fullName: true } } } },
      },
    });

    // If linked to an appointment, update its status
    if (body.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: body.appointmentId },
        data: { status: "in_consultation", encounterId: encounter.id },
      });
    }

    return encounter;
  }

  async update(tenantId: string, id: string, userId: string, body: UpdateEncounterBody) {
    const encounter = await this.prisma.encounter.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!encounter) return null;
    if (encounter.status === "finalized") {
      throw new Error("Cannot edit a finalized encounter");
    }

    return this.prisma.encounter.update({
      where: { id },
      data: {
        ...body,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : undefined,
        updatedBy: userId,
        version: { increment: 1 },
      },
      include: {
        patient: { include: { profile: { select: { fullName: true } } } },
        diagnoses: { where: { deletedAt: null } },
        prescriptions: { include: { items: { include: { medication: true } } } },
        labOrders: { include: { results: true } },
      },
    });
  }

  async finalize(tenantId: string, id: string, userId: string) {
    const encounter = await this.prisma.encounter.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!encounter) return null;
    if (encounter.status === "finalized") {
      throw new Error("Encounter is already finalized");
    }
    if (encounter.createdBy !== userId) {
      throw new Error("Only the creating doctor can finalize this encounter");
    }

    const result = await this.prisma.encounter.update({
      where: { id },
      data: {
        status: "finalized",
        finalizedAt: new Date(),
        updatedBy: userId,
        version: { increment: 1 },
      },
      include: {
        patient: { include: { profile: { select: { fullName: true } } } },
        diagnoses: { where: { deletedAt: null } },
      },
    });

    // Complete the linked appointment if exists
    if (encounter.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: encounter.appointmentId },
        data: { status: "completed" },
      });
    }

    return result;
  }

  async addDiagnosis(tenantId: string, encounterId: string, userId: string, body: AddDiagnosisBody) {
    const encounter = await this.prisma.encounter.findFirst({
      where: { id: encounterId, tenantId, deletedAt: null },
    });

    if (!encounter) return null;

    return this.prisma.diagnosis.create({
      data: {
        tenantId,
        encounterId,
        patientId: encounter.patientId,
        icdCode: body.icdCode,
        icdDescription: body.icdDescription,
        diagnosisType: body.diagnosisType,
        status: body.status,
        onsetDate: body.onsetDate ? new Date(body.onsetDate) : undefined,
        notes: body.notes,
        createdBy: userId,
      },
    });
  }

  async removeDiagnosis(tenantId: string, diagnosisId: string) {
    return this.prisma.diagnosis.update({
      where: { id: diagnosisId, tenantId },
      data: { deletedAt: new Date() },
    });
  }

  /** Count encounters by status for a doctor */
  async countByStatus(tenantId: string, doctorId: string) {
    const [draft, inProgress, finalized] = await Promise.all([
      this.prisma.encounter.count({ where: { tenantId, doctorId, status: "draft", deletedAt: null } }),
      this.prisma.encounter.count({ where: { tenantId, doctorId, status: "in_progress", deletedAt: null } }),
      this.prisma.encounter.count({ where: { tenantId, doctorId, status: "finalized", deletedAt: null } }),
    ]);
    return { draft, inProgress, finalized, total: draft + inProgress + finalized };
  }
}
