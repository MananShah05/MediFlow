export class SuperAdminService {
  constructor(private prisma: any) {}

  async getDashboardData() {
    const totalTenants = await this.prisma.tenant.count({
      where: { deletedAt: null },
    });

    const activeTenants = await this.prisma.tenant.count({
      where: { status: "active", deletedAt: null },
    });

    const provisioningTenants = await this.prisma.tenant.count({
      where: { status: "provisioning", deletedAt: null },
    });

    const criticalIncidents = await this.prisma.incidentReport.count({
      where: {
        severity: "critical",
        status: { in: ["reported", "investigating", "contained"] },
      },
    });

    const totalDoctors = await this.prisma.doctor.count({
      where: { tenant: { deletedAt: null } },
    });

    return {
      totalTenants,
      activeTenants,
      provisioningTenants,
      criticalIncidents,
      totalDoctors,
    };
  }

  async listTenants() {
    const tenants = await this.prisma.tenant.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        tier: true,
        region: true,
        complianceProfile: true,
        contactEmail: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return tenants;
  }
}
