"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  BarChart3,
  AlertCircle,
  RefreshCw,
  Users,
  BedDouble,
  CreditCard,
  ShieldAlert,
  TrendingUp,
  PieChart,
  Activity,
} from "lucide-react";

export default function AdminReportsPage() {
  const { data: dashData, isLoading, isError, refetch, isRefetching } = useQuery<{ data: any }>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiClient.get<{ data: any }>("/admin/dashboard"),
  });

  const stats = dashData?.data?.stats;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
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
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Reports</h3>
          <p className="text-sm text-text-secondary mt-1">Please try refreshing the page.</p>
        </div>
      </Card>
    );
  }

  const reportCards = [
    {
      title: "Total Tenant Staff",
      value: stats?.totalStaff || "0",
      icon: <Users className="w-5 h-5" />,
      color: "text-role-admin",
      bg: "bg-role-admin/10",
      border: "border-l-role-admin",
    },
    {
      title: "Bed Occupancy",
      value: stats?.bedOccupancy || "0%",
      icon: <BedDouble className="w-5 h-5" />,
      color: "text-clinical",
      bg: "bg-clinical/10",
      border: "border-l-clinical",
    },
    {
      title: "Revenue Today",
      value: stats?.billingRevenue || "₹ 0.00",
      icon: <CreditCard className="w-5 h-5" />,
      color: "text-warning",
      bg: "bg-warning/10",
      border: "border-l-warning",
    },
    {
      title: "Active Incidents",
      value: stats?.activeIncidents || "0",
      icon: <ShieldAlert className="w-5 h-5" />,
      color: "text-critical",
      bg: "bg-critical/10",
      border: "border-l-critical",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-role-admin" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Facility performance metrics, occupancy analytics, and revenue summaries.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2 rounded-lg bg-bg-muted hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border transition-all"
          title="Refresh reports"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((rc) => (
          <Card key={rc.title} className={`p-4 flex items-center gap-3 shadow-sm border-l-4 ${rc.border}`}>
            <div className={`p-2 rounded-lg ${rc.bg} ${rc.color}`}>
              {rc.icon}
            </div>
            <div>
              <p className="text-xs text-text-secondary font-medium">{rc.title}</p>
              <p className="text-sm font-bold text-text-primary font-data mt-0.5">{rc.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Report Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
            <TrendingUp className="w-5 h-5 text-success" />
            <h2 className="text-base font-bold text-text-primary">Revenue Trends</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-bg-subtle mb-4">
              <TrendingUp className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary font-medium">Revenue trend charts</p>
            <p className="text-xs text-text-tertiary mt-1">
              Detailed revenue analytics with daily, weekly, and monthly breakdowns are coming soon.
            </p>
          </div>
        </Card>

        <Card className="p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
            <PieChart className="w-5 h-5 text-clinical" />
            <h2 className="text-base font-bold text-text-primary">Occupancy Distribution</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-bg-subtle mb-4">
              <PieChart className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary font-medium">Ward-wise occupancy charts</p>
            <p className="text-xs text-text-tertiary mt-1">
              Visual breakdowns of bed utilization by ward, department, and time period are coming soon.
            </p>
          </div>
        </Card>

        <Card className="p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
            <Activity className="w-5 h-5 text-role-nurse" />
            <h2 className="text-base font-bold text-text-primary">Patient Flow</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-bg-subtle mb-4">
              <Activity className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary font-medium">Admission & discharge metrics</p>
            <p className="text-xs text-text-tertiary mt-1">
              Track patient admissions, discharges, transfers, and average length of stay.
            </p>
          </div>
        </Card>

        <Card className="p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
            <Users className="w-5 h-5 text-role-doctor" />
            <h2 className="text-base font-bold text-text-primary">Staff Performance</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-bg-subtle mb-4">
              <Users className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary font-medium">Clinician workload reports</p>
            <p className="text-xs text-text-tertiary mt-1">
              Doctor consultation counts, nurse task completion rates, and shift coverage analytics.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
