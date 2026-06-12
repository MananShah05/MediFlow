import { CreatePrescriptionBody } from "./prescriptions.schema.js";

export class PrescriptionService {
  constructor(private prisma: any) {}

  async list(tenantId: string, query: any) {
    const { encounterId, patientId, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (encounterId) where.encounterId = encounterId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include: {
          items: { include: { medication: true } },
          patient: { include: { profile: { select: { fullName: true } } } },
          prescribedByDoc: { include: { user: { select: { email: true } } } },
          encounter: { select: { id: true, encounterType: true, chiefComplaint: true } },
        },
        orderBy: { prescribedAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return { data: prescriptions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(tenantId: string, doctorId: string, body: CreatePrescriptionBody) {
    return this.prisma.prescription.create({
      data: {
        tenantId,
        patientId: body.patientId,
        encounterId: body.encounterId,
        prescribedBy: doctorId,
        status: "active",
        prescribedAt: new Date(),
        notes: body.notes,
        items: {
          create: body.items.map((item) => ({
            tenantId,
            medicationId: item.medicationId,
            dose: item.dose,
            doseUnit: item.doseUnit,
            route: item.route,
            frequency: item.frequency,
            frequencyDetails: item.frequencyDetails,
            durationDays: item.durationDays,
            instructions: item.instructions,
            startDate: new Date(),
            endDate: item.durationDays
              ? new Date(Date.now() + item.durationDays * 24 * 60 * 60 * 1000)
              : undefined,
          })),
        },
      },
      include: {
        items: { include: { medication: true } },
        patient: { include: { profile: { select: { fullName: true } } } },
      },
    });
  }

  async getById(tenantId: string, id: string) {
    return this.prisma.prescription.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { medication: true } },
        patient: { include: { profile: true } },
        prescribedByDoc: { include: { user: { select: { email: true } } } },
        encounter: true,
      },
    });
  }

  async countForDoctor(tenantId: string, doctorId: string) {
    return this.prisma.prescription.count({
      where: { tenantId, prescribedBy: doctorId, status: "active" },
    });
  }
}
