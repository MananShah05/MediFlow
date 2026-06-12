"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { careosToast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/auth";
import {
  UserCog,
  AlertCircle,
  RefreshCw,
  Search,
  Plus,
  Shield,
  Stethoscope,
  Activity,
  User,
  Mail,
  Lock,
  Key,
} from "lucide-react";

interface StaffMember {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  roles: { name: string; isPrimary: boolean }[];
  firstName?: string;
  lastName?: string;
}

export default function AdminStaffPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);

  // Provision form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"doctor" | "nurse" | "admin">("nurse");
  const [specialization, setSpecialization] = useState("");
  const [regNumber, setRegNumber] = useState("");

  // Fetch dashboard data for staff count
  const { data: dashData, isLoading, isError, refetch, isRefetching } = useQuery<{ data: any }>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiClient.get<{ data: any }>("/admin/dashboard"),
  });

  const provisionMutation = useMutation({
    mutationFn: (body: any) => apiClient.post("/admin/staff", body),
    onSuccess: () => {
      careosToast.success("New staff member provisioned successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setIsProvisionOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      careosToast.error(err.response?.data?.error?.message || "Failed to provision staff.");
    },
  });

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setRole("nurse");
    setSpecialization("");
    setRegNumber("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      careosToast.error("Please fill in all required fields.");
      return;
    }
    provisionMutation.mutate({
      email,
      password,
      firstName,
      lastName,
      role,
      specialization: role === "doctor" ? specialization : undefined,
      registrationNumber: role === "doctor" || role === "nurse" ? regNumber : undefined,
    });
  };

  const ROLE_CARDS = [
    {
      role: "Doctors",
      icon: <Stethoscope className="w-5 h-5" />,
      color: "text-role-doctor",
      bg: "bg-role-doctor/10",
      border: "border-l-role-doctor",
      description: "Physicians, specialists, and consultants",
    },
    {
      role: "Nurses",
      icon: <Activity className="w-5 h-5" />,
      color: "text-role-nurse",
      bg: "bg-role-nurse/10",
      border: "border-l-role-nurse",
      description: "Registered nurses and ward staff",
    },
    {
      role: "Administrators",
      icon: <Shield className="w-5 h-5" />,
      color: "text-role-admin",
      bg: "bg-role-admin/10",
      border: "border-l-role-admin",
      description: "Tenant administrators and managers",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 border-dashed border-2">
        <div className="p-3 bg-destructive/10 rounded-full text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Staff data</h3>
          <p className="text-sm text-text-secondary mt-1">Please try refreshing the page.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <UserCog className="w-6 h-6 text-role-admin" />
            Staff Management
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Provision and manage clinical and administrative staff credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-lg bg-bg-muted hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsProvisionOpen(true)}
            className="h-10 px-4 rounded-lg bg-role-admin text-text-inverse hover:bg-role-admin/90 transition-all text-sm font-semibold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Provision Staff
          </button>
        </div>
      </div>

      {/* Summary Stat */}
      <Card className="p-5 flex items-center gap-4 shadow-sm border-l-4 border-l-role-admin bg-bg-elevated">
        <div className="p-3 rounded-xl bg-role-admin/10 text-role-admin">
          <UserCog className="w-7 h-7" />
        </div>
        <div>
          <p className="text-xs text-text-secondary font-medium">Total Tenant Staff</p>
          <p className="text-2xl font-bold text-text-primary font-data">
            {dashData?.data?.stats?.totalStaff || "0 Registered"}
          </p>
        </div>
      </Card>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLE_CARDS.map((rc) => (
          <Card key={rc.role} className={`p-5 shadow-sm border-l-4 ${rc.border} flex flex-col gap-2`}>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${rc.bg} ${rc.color}`}>
                {rc.icon}
              </div>
              <h3 className="text-sm font-bold text-text-primary">{rc.role}</h3>
            </div>
            <p className="text-xs text-text-secondary">{rc.description}</p>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <Card className="p-5 bg-bg-elevated border-dashed border-2 border-border-subtle shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-clinical/10 text-clinical shrink-0 mt-0.5">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Staff Provisioning</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Use the <strong>&ldquo;Provision Staff&rdquo;</strong> button to create new staff accounts. Each staff member will receive login credentials for their role-specific portal (Doctor, Nurse, or Admin). Credentials are scoped to your tenant and comply with HIPAA/DPDP audit requirements.
            </p>
          </div>
        </div>
      </Card>

      {/* Provision Modal */}
      <Modal isOpen={isProvisionOpen} onClose={() => setIsProvisionOpen(false)} title="Provision Tenant Staff">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              placeholder="e.g. john.doe@careos.com"
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
