"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Building2, Activity, ShieldAlert, Cpu, Plus, Eye, Settings, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { careosToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  tier: string;
  region: string;
  complianceProfile: string;
  contactEmail: string;
  createdAt: string;
}

interface SuperAdminDashboardData {
  totalTenants: number;
  activeTenants: number;
  provisioningTenants: number;
  criticalIncidents: number;
  totalDoctors: number;
}

export default function SuperAdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const [isProvisionTenantOpen, setIsProvisionTenantOpen] = useState(false);
  const [isViewTopologyOpen, setIsViewTopologyOpen] = useState(false);

  const { data: dashRes, isLoading: isDashLoading, isError: isDashError, refetch: refetchDash } = useQuery<{ data: SuperAdminDashboardData }>({
    queryKey: ["super-admin", "dashboard"],
    queryFn: () => apiClient.get<{ data: SuperAdminDashboardData }>("/super-admin/dashboard"),
  });

  const { data: tenantsRes, isLoading: isTenantsLoading, isError: isTenantsError, refetch: refetchTenants } = useQuery<{ data: Tenant[] }>({
    queryKey: ["super-admin", "tenants"],
    queryFn: () => apiClient.get<{ data: Tenant[] }>("/super-admin/tenants"),
  });

  const { data: healthRes } = useQuery<{ status: string; services: { database: string; redis: string } }>({
    queryKey: ["health"],
    queryFn: () => apiClient.get<{ status: string; services: { database: string; redis: string } }>("/health"),
  });

  const dashData = dashRes?.data;
  const tenants = tenantsRes?.data;
  const healthServices = healthRes?.services;

  const handleProvisionTenant = () => {
    careosToast.info("Tenant provisioning interface will open in a new dashboard view.");
    setIsProvisionTenantOpen(true);
  };

  const handleViewTopology = () => {
    setIsViewTopologyOpen(true);
  };

  const handleSystemConfig = () => {
    careosToast.info("System configuration panel is under development.");
  };

  const isLoading = isDashLoading || isTenantsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isDashError && isTenantsError) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 border-dashed border-2">
        <div className="p-3 bg-destructive/10 rounded-full text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Super Admin Dashboard</h3>
          <p className="text-sm text-text-secondary mt-1">Please try refreshing the page or check your connection.</p>
        </div>
      </Card>
    );
  }

  const allServicesHealthy = healthServices?.database === "healthy";

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="bg-bg-elevated border border-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-role-superadmin/10 blur-3xl pointer-events-none" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              System Control Centre, {user?.firstName || "Operator"}
            </h2>
            <p className="text-text-secondary mt-1">
              Super Admin Console · Platform-wide tenant orchestration, resource sizing, and security alerting.
            </p>
          </div>
          <button
            onClick={() => { refetchDash(); refetchTenants(); }}
            className="p-2 rounded-lg bg-bg-muted hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border transition-all flex items-center justify-center"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-role-superadmin">
          <div className="p-2 rounded-lg bg-role-superadmin/10 text-role-superadmin">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Provisioned Tenants</p>
            <p className="text-sm font-semibold text-text-primary mt-1 font-data">
              {dashData ? `${dashData.activeTenants} Active` : "—"}
              {dashData && dashData.provisioningTenants > 0 && (
                <span className="text-text-tertiary text-xs ml-1">· {dashData.provisioningTenants} provisioning</span>
              )}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-clinical">
          <div className="p-2 rounded-lg bg-clinical/10 text-clinical">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Platform Health Status</p>
            <p className="text-sm font-semibold text-text-primary mt-1 flex items-center gap-2">
              {healthServices ? (
                <>
                  <span className={`w-2.5 h-2.5 rounded-full ${allServicesHealthy ? "bg-success" : "bg-critical"} animate-pulse`} />
                  {allServicesHealthy ? "All Systems Operational" : "Service Degradation"}
                </>
              ) : (
                "—"
              )}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-warning">
          <div className="p-2 rounded-lg bg-warning/10 text-warning">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Total Registered Doctors</p>
            <p className="text-sm font-semibold text-text-primary mt-1 font-data">
              {dashData ? `${dashData.totalDoctors} Providers` : "—"}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-critical">
          <div className="p-2 rounded-lg bg-critical/10 text-critical">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Critical Security Incidents</p>
            <p className="text-sm font-semibold text-text-primary mt-1 font-data">
              {dashData ? `${dashData.criticalIncidents} Flagged` : "—"}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Content Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-text-primary">Global Tenant Provisioning List</h3>
            {dashData && dashData.provisioningTenants > 0 && (
              <Badge variant="info">{dashData.provisioningTenants} provisioning</Badge>
            )}
          </div>
          <div className="flex flex-col gap-3 font-data text-xs text-text-secondary max-h-[500px] overflow-y-auto pr-1">
            {!tenants || tenants.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">
                No tenants found.
              </div>
            ) : (
              tenants.map((tenant) => (
                <div key={tenant.id} className="p-3 rounded-lg bg-bg-muted border border-border-subtle flex justify-between items-center hover:bg-bg-subtle transition-all">
                  <div>
                    <span className="font-bold text-text-primary">{tenant.name}</span>
                    <p className="text-text-tertiary mt-[2px]">
                      {tenant.type.replace(/_/g, " ")} · {tenant.slug}.careos.app
                      {tenant.tier && <span className="ml-1">· {tenant.tier}</span>}
                    </p>
                    <p className="text-text-tertiary mt-[2px] text-[10px]">
                      {tenant.region} · {tenant.complianceProfile.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        tenant.status === "active" ? "success" :
                        tenant.status === "provisioning" ? "pending" :
                        tenant.status === "suspended" ? "warning" : "critical"
                      }
                    >
                      {tenant.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-text-primary">SaaS Orchestration</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleProvisionTenant}
              className="w-full h-10 px-4 rounded-md bg-role-superadmin text-text-inverse hover:bg-role-superadmin/95 transition-colors text-sm font-medium flex items-center justify-between"
            >
              <span>Provision New SaaS Tenant</span>
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleViewTopology}
              className="w-full h-10 px-4 rounded-md bg-bg-muted border border-border text-text-primary hover:bg-bg-subtle transition-colors text-sm font-medium flex items-center justify-between"
            >
              <span>View Node Cluster Topology</span>
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={handleSystemConfig}
              className="w-full h-10 px-4 rounded-md bg-bg-muted border border-border text-text-primary hover:bg-bg-subtle transition-colors text-sm font-medium flex items-center justify-between"
            >
              <span>System Configuration Settings</span>
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="border-t border-border pt-4 mt-2 text-xs text-text-tertiary">
            <p>Database: {healthServices?.database || "—"}</p>
            <p>Redis: {healthServices?.redis || "—"}</p>
            <p>Total Tenants: {dashData?.totalTenants || "—"}</p>
          </div>
        </Card>
      </div>

      {/* MODAL: Provision New Tenant */}
      <Modal isOpen={isProvisionTenantOpen} onClose={() => setIsProvisionTenantOpen(false)} title="Provision New SaaS Tenant">
        <div className="flex flex-col gap-4 text-sm text-text-secondary">
          <p>
            Tenant provisioning is a multi-step process that creates a new isolated instance
            with dedicated database schema, storage bucket, and DNS configuration.
          </p>
          <div className="bg-bg-muted border border-border rounded-lg p-4 text-xs">
            <p className="font-semibold text-text-primary mb-2">Required Information:</p>
            <ul className="list-disc list-inside space-y-1 text-text-tertiary">
              <li>Tenant Name &amp; Slug (subdomain)</li>
              <li>Facility Type &amp; Region</li>
              <li>Compliance Profile (HIPAA / DPDP / GDPR)</li>
              <li>Subscription Tier</li>
              <li>Admin Contact &amp; Billing Details</li>
            </ul>
          </div>
          <p className="text-xs text-text-tertiary">
            Full provisioning UI is available in the dedicated Tenant Management module.
          </p>
        </div>
      </Modal>

      {/* MODAL: Node Cluster Topology */}
      <Modal isOpen={isViewTopologyOpen} onClose={() => setIsViewTopologyOpen(false)} title="Node Cluster Topology">
        <div className="flex flex-col gap-4 text-sm text-text-secondary">
          <p>
            Cluster topology information is available through the infrastructure monitoring dashboard.
          </p>
          <div className="bg-bg-muted border border-border rounded-lg p-4 text-xs">
            <p className="font-semibold text-text-primary mb-2">Current Cluster Overview:</p>
            <ul className="space-y-1 text-text-tertiary">
              <li><span className="text-text-secondary">API Nodes:</span> 2 replicas (container orchestration)</li>
              <li><span className="text-text-secondary">Database:</span> PostgreSQL 16 (managed)</li>
              <li><span className="text-text-secondary">Cache:</span> Redis 7 (in-memory)</li>
              <li><span className="text-text-secondary">Storage:</span> S3-compatible object storage</li>
              <li><span className="text-text-secondary">Region:</span> Local development cluster</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}
