import { ListAppointmentsQuery, CreateAppointmentBody, UpdateAppointmentStatusBody } from "./appointments.schema.js";

export class AppointmentService {
  constructor(private prisma: any) {}

  async list(tenantId: string, query: ListAppointmentsQuery) {
    const { doctorId, patientId, date, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      where.scheduledAt = { gte: dayStart, lte: dayEnd };
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          patient: {
            include: {
              profile: {
                select: { fullName: true, mobileNumber: true, gender: true, dateOfBirth: true },
              },
            },
          },
          doctor: {
            include: { user: { select: { email: true } } },
          },
          department: { select: { name: true, code: true } },
        },
        orderBy: { scheduledAt: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(tenantId: string, id: string) {
    return this.prisma.appointment.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        patient: { include: { profile: true } },
        doctor: { include: { user: { select: { email: true } } } },
        department: true,
      },
    });
  }

  async create(tenantId: string, userId: string, body: CreateAppointmentBody) {
    return this.prisma.appointment.create({
      data: {
        tenantId,
        patientId: body.patientId,
        doctorId: body.doctorId,
        facilityId: body.facilityId,
        departmentId: body.departmentId,
        appointmentType: body.appointmentType,
        scheduledAt: new Date(body.scheduledAt),
        durationMinutes: body.durationMinutes,
        visitReason: body.visitReason,
        bookingChannel: body.bookingChannel,
        status: "scheduled",
        createdBy: userId,
      },
      include: {
        patient: { include: { profile: { select: { fullName: true } } } },
        doctor: { include: { user: { select: { email: true } } } },
      },
    });
  }

  async updateStatus(tenantId: string, id: string, userId: string, body: UpdateAppointmentStatusBody) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!appointment) return null;

    const updateData: any = { status: body.status };

    if (body.status === "cancelled") {
      updateData.cancellationReason = body.cancellationReason;
      updateData.cancelledBy = userId;
    }

    if (body.status === "checked_in") {
      updateData.checkinTime = new Date();
      updateData.checkinBy = userId;
    }

    return this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { include: { profile: { select: { fullName: true } } } },
      },
    });
  }

  /** Count appointments for a doctor on a given date */
  async countForDoctor(tenantId: string, doctorId: string, date: string) {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const [total, completed, scheduled] = await Promise.all([
      this.prisma.appointment.count({
        where: { tenantId, doctorId, scheduledAt: { gte: dayStart, lte: dayEnd }, deletedAt: null },
      }),
      this.prisma.appointment.count({
        where: { tenantId, doctorId, scheduledAt: { gte: dayStart, lte: dayEnd }, status: "completed", deletedAt: null },
      }),
      this.prisma.appointment.count({
        where: { tenantId, doctorId, scheduledAt: { gte: dayStart, lte: dayEnd }, status: { in: ["scheduled", "confirmed"] }, deletedAt: null },
      }),
    ]);

    return { total, completed, scheduled };
  }
}
