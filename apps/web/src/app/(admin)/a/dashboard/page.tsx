"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { BedDouble, CreditCard, ShieldAlert, Users, Shield, Plus, Key, Mail, Lock, User, Settings, AlertCircle, RefreshCw, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { mediflowToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface AuditEvent {
  id: string;
  action: string;
  user: string;
  time: string;
  detail: string;
}

interface AdminDashboardData {
  stats: {
    totalStaff: string;
    bedOccupancy: string;
    billingRevenue: string;
    activeIncidents: string;
  };
  recentEvents: AuditEvent[];
}

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Modals visibility
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [isWardsOpen, setIsWardsOpen] = useState(false);

  // Form states - Provision Staff
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"doctor" | "nurse" | "admin">("nurse");
  const [specialization, setSpecialization] = useState("");
  const [regNumber, setRegNumber] = useState("");

  // Fetch Admin Dashboard Data
  const { data: responseData, isLoading, isError, refetch, isRefetching } = useQuery<{ data: AdminDashboardData }>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiClient.get<{ data: AdminDashboardData }>("/admin/dashboard"),
  });

  const data = responseData?.data;

  // Provision Staff Mutation
  const provisionMutation = useMutation({
    mutationFn: (body: any) => apiClient.post("/admin/staff", body),
    onSuccess: () => {
      mediflowToast.success("New staff member provisioned successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setIsProvisionOpen(false);
      resetProvisionForm();
    },
    onError: (err: any) => {
      mediflowToast.error(err.response?.data?.error?.message || "Failed to provision new staff member.");
    },
  });

  const resetProvisionForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setRole("nurse");
    setSpecialization("");
    setRegNumber("");
  };

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      mediflowToast.error("Please fill in all required fields.");
      return;
    }

    const body: any = {
      email,
      password,
      firstName,
      lastName,
      role,
      specialization: role === "doctor" ? specialization : undefined,
      registrationNumber: (role === "doctor" || role === "nurse") ? regNumber : undefined,
    };

    provisionMutation.mutate(body);
  };

  // Fetch Ward Layout Data
  const { data: wardData, isLoading: isWardsLoading, refetch: refetchWards } = useQuery<{ data: any[] }>({
    queryKey: ["admin", "wards"],
    queryFn: () => apiClient.get<{ data: any[] }>("/admin/wards"),
    enabled: false,
  });

  const handleConfigureWards = () => {
    setIsWardsOpen(true);
    refetchWards();
  };

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

  if (isError || !data) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 border-dashed border-2">
        <div className="p-3 bg-destructive/10 rounded-full text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Admin Dashboard</h3>
          <p className="text-sm text-text-secondary mt-1">Please try refreshing the page or check your connection.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="bg-bg-elevated border border-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-role-admin/10 blur-3xl pointer-events-none" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Shield className="w-6 h-6 text-role-admin" />
              Welcome back, {user?.firstName || "Admin"}
            </h2>
            <p className="text-text-secondary mt-1">
              Monitor bed occupancy, review invoice cycles, and manage tenant staff credentials.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-lg bg-bg-muted hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border transition-all flex items-center justify-center"
            title="Refresh Live Audit feed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-role-admin shadow-sm">
          <div className="p-2 rounded-lg bg-role-admin/10 text-role-admin">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Total Tenant Staff</p>
            <p className="text-sm font-semibold text-text-primary mt-1 font-data">{data.stats.totalStaff}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-clinical shadow-sm">
          <div className="p-2 rounded-lg bg-clinical/10 text-clinical">
            <BedDouble className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Bed Occupancy</p>
            <p className="text-sm font-semibold text-text-primary mt-1 font-data">{data.stats.bedOccupancy}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-warning shadow-sm">
          <div className="p-2 rounded-lg bg-warning/10 text-warning">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Billing Revenue Today</p>
            <p className="text-sm font-semibold text-text-primary mt-1 font-data">{data.stats.billingRevenue}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-role-superadmin shadow-sm">
          <div className="p-2 rounded-lg bg-role-superadmin/10 text-role-superadmin">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Active Incidents</p>
            <p className="text-sm font-semibold text-text-primary mt-1 font-data">{data.stats.activeIncidents}</p>
          </div>
        </Card>
      </div>

      {/* Main Content Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-text-primary">Recent Audit Events</h3>
            <Badge variant="neutral" className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Live Secured Log
            </Badge>
          </div>
          <div className="flex flex-col gap-3 font-data text-xs text-text-secondary max-h-[400px] overflow-y-auto pr-1">
            {data.recentEvents.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">
                No recent audit log entries available.
              </div>
            ) : (
              data.recentEvents.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-bg-muted border border-border-subtle flex justify-between items-center hover:bg-bg-subtle transition-all">
                  <div className="flex flex-col gap-1">
                    <div>
                      <Badge variant="neutral" className="font-bold text-[9px] uppercase tracking-wider px-1.5 py-[1px] mr-1 bg-clinical/10 text-clinical border-0">
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-text-tertiary">by</span>{" "}
                      <span className="text-text-primary font-semibold">{log.user}</span>
                    </div>
                    <p className="text-text-secondary mt-[2px]">{log.detail}</p>
                  </div>
                  <span className="text-text-tertiary shrink-0 font-medium text-[10px]">{log.time}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-4 shadow-sm justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-text-primary">Tenant Controls</h3>
            <p className="text-xs text-text-secondary">
              Provision clinician credentials, configure ward inpatient beds, and export regulatory-compliant HIPAA / DPDP logs.
            </p>
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                onClick={() => setIsProvisionOpen(true)}
                className="w-full h-10 px-4 rounded-md bg-role-admin text-text-inverse hover:bg-role-admin/90 transition-all text-sm font-semibold flex items-center justify-between shadow-sm"
              >
                <span>Provision Staff Member</span>
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={handleConfigureWards}
                className="w-full h-10 px-4 rounded-md bg-bg-muted border border-border text-text-primary hover:bg-bg-subtle transition-all text-sm font-semibold flex items-center justify-between"
              >
                <span>Configure Ward Layouts</span>
                <Settings className="w-4 h-4" />
              </button>
              <Link
                href="/a/audit"
                className="w-full h-10 px-4 rounded-md bg-bg-muted border border-border text-text-primary hover:bg-bg-subtle transition-all text-sm font-semibold flex items-center justify-between"
              >
                <span>View & Export Audit Logs</span>
                <ScrollText className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-4 text-xs text-text-tertiary">
            MediFLOW Administrative Console · Tenant ID: {user?.tenantId}
          </div>
        </Card>
      </div>

      {/* MODAL: Ward Layout Configuration */}
      <Modal isOpen={isWardsOpen} onClose={() => setIsWardsOpen(false)} title="Ward Layout Configuration" description="View bed occupancy and room layout across wards">
        {isWardsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-role-admin border-t-transparent" />
          </div>
        ) : !wardData?.data || wardData.data.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary text-sm">
            No ward data available for this tenant.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {wardData.data.map((ward: any) => (
              <div key={ward.id} className="border border-border rounded-lg p-4 bg-bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">{ward.name}</h4>
                    <p className="text-[10px] text-text-tertiary">
                      {ward.code} · {ward.type} · {ward.departmentName || "No Department"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-text-primary font-data">
                      {ward.occupiedBeds}/{ward.totalBeds} Occupied
                    </p>
                    <p className="text-[10px] text-text-tertiary">Capacity: {ward.capacity}</p>
                  </div>
                </div>
                <div className="w-full bg-bg-surface rounded-full h-1.5 mb-2">
                  <div
                    className="bg-role-admin h-1.5 rounded-full transition-all"
                    style={{ width: `${ward.totalBeds > 0 ? (ward.occupiedBeds / ward.totalBeds) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ward.rooms?.map((room: any) => (
                    <div key={room.id} className="bg-bg-surface border border-border rounded-md px-2 py-1 text-[10px]">
                      <span className="text-text-secondary font-medium">{room.roomNumber}</span>
                      <span className="text-text-tertiary ml-1">({room.beds?.filter((b: any) => b.status === "occupied").length || 0}/{room.beds?.length || 0})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* MODAL: Provision Staff Member */}
      <Modal isOpen={isProvisionOpen} onClose={() => setIsProvisionOpen(false)} title="Provision Tenant Staff">
        <form onSubmit={handleProvisionSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. John"
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-admin"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Doe"
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-admin"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Staff Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john.doe@mediflow.com"
              className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-admin"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Initial Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-admin"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
              <Key className="w-3.5 h-3.5" /> Staff Portal Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "doctor" | "nurse" | "admin")}
              className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-role-admin"
              required
            >
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {role === "doctor" && (
            <div className="flex flex-col gap-1.5 animate-fadeIn">
              <label className="text-xs font-semibold text-text-secondary">Medical Specialization</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Pediatrics, Cardiology"
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-admin"
                required
              />
            </div>
          )}

          {(role === "doctor" || role === "nurse") && (
            <div className="flex flex-col gap-1.5 animate-fadeIn">
              <label className="text-xs font-semibold text-text-secondary">Professional Registration Number</label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. KMC-12345 or KNC-98765"
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-admin"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={provisionMutation.isPending}
            className="h-10 mt-2 rounded-md bg-role-admin text-text-inverse hover:bg-role-admin/90 transition-all font-semibold text-sm flex items-center justify-center shadow-sm"
          >
            {provisionMutation.isPending ? "Provisioning Staff Account..." : "Provision Staff Member"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
