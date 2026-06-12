import { PrismaClient } from "@prisma/client";
import { ListPatientsQuery, CreatePatientBody } from "./patients.schema.js";

export class PatientService {
  constructor(private prisma: PrismaClient | any) {}

  async list(tenantId: string, query: ListPatientsQuery) {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

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

    return {
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
    const patient = await this.prisma.patient.findFirst({
      where: { userId, tenantId, deletedAt: null },
      include: {
        profile: true,
      },
    });

    if (!patient) return null;

    // Get next scheduled appointment
    const nextAppointment = await this.prisma.appointment.findFirst({
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
    });

    // Get recent vitals
    const latestVitals = await this.prisma.vital.findFirst({
      where: {
        patientId: patient.id,
        tenantId,
      },
      orderBy: { recordedAt: "desc" },
    });

    // Count active consents
    const activeConsentsCount = await this.prisma.consent.count({
      where: {
        patientId: patient.id,
        tenantId,
        status: "granted",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    // Calculate outstanding balance
    const invoices = await this.prisma.invoice.findMany({
      where: {
        patientId: patient.id,
        tenantId,
        status: { in: ["issued", "partially_paid"] },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
      },
    });
    const outstandingBalance = invoices.reduce(
      (sum: number, inv: any) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)),
      0
    );

    // Get recent encounters
    const encounters = await this.prisma.encounter.findMany({
      where: {
        patientId: patient.id,
        tenantId,
        status: { in: ["finalized", "in_progress", "draft"] },
        deletedAt: null,
      },
      include: {
        doctor: {
          include: {
            user: { select: { email: true } },
          },
        },
        diagnoses: { where: { deletedAt: null } },
        prescriptions: {
          include: {
            items: { include: { medication: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Metadata for dropdowns
    const doctors = await this.prisma.doctor.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      include: {
        user: { select: { email: true } },
      },
    });

    const departments = await this.prisma.department.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
    });

    const facilities = await this.prisma.facility.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
    });

    return {
      patient,
      stats: {
        nextAppointment,
        latestVitals,
        activeConsentsCount,
        outstandingBalance,
      },
      recentEncounters: encounters,
      metadata: {
        doctors,
        departments,
        facilities,
      },
    };
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
}
