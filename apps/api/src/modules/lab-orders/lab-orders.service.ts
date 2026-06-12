import { CreateLabOrderBody } from "./lab-orders.schema.js";

export class LabOrderService {
  constructor(private prisma: any) {}

  async list(tenantId: string, query: any) {
    const { encounterId, patientId, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (encounterId) where.encounterId = encounterId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.labOrder.findMany({
        where,
        include: {
          patient: { include: { profile: { select: { fullName: true } } } },
          orderedByDoc: { include: { user: { select: { email: true } } } },
          results: true,
          encounter: { select: { id: true, chiefComplaint: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.labOrder.count({ where }),
    ]);

    return { data: orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(tenantId: string, doctorId: string, body: CreateLabOrderBody) {
    return this.prisma.labOrder.create({
      data: {
        tenantId,
        patientId: body.patientId,
        encounterId: body.encounterId,
        orderedBy: doctorId,
        status: "ordered",
        priority: body.priority,
        clinicalNotes: body.clinicalNotes,
        results: {
          create: body.items.map((item) => ({
            tenantId,
            testName: item.testName,
            testCode: item.testCode || null,
          })),
        },
      },
      include: {
        results: true,
        patient: { include: { profile: { select: { fullName: true } } } },
      },
    });
  }

  async countPendingForDoctor(tenantId: string, doctorId: string) {
    return this.prisma.labOrder.count({
      where: {
        tenantId,
        orderedBy: doctorId,
        status: { in: ["ordered", "specimen_collected", "processing", "resulted"] },
      },
    });
  }

  async countUnreviewedForDoctor(tenantId: string, doctorId: string) {
    return this.prisma.labOrder.count({
      where: {
        tenantId,
        orderedBy: doctorId,
        status: "resulted",
        reviewedBy: null,
      },
    });
  }
}

