"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, Column } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  Calendar,
  AlertCircle,
  RefreshCw,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason: string | null;
  notes: string | null;
  patient: {
    firstName: string;
    lastName: string;
    uhid: string;
  };
  doctor: {
    user: {
      email: string;
    };
    specialization: string;
  };
}

interface AppointmentListResponse {
  data: Appointment[];
  total: number;
  limit: number;
  offset: number;
}

const STATUS_BADGE: Record<string, "success" | "warning" | "critical" | "neutral"> = {
  scheduled: "neutral",
  confirmed: "success",
  completed: "success",
  cancelled: "critical",
  no_show: "warning",
  in_progress: "warning",
};

export default function AdminAppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const queryParams = new URLSearchParams({
    limit: String(limit),
    offset: String(page * limit),
    ...(statusFilter && { status: statusFilter }),
    ...(searchQuery && { search: searchQuery }),
  });

  const { data: response, isLoading, isError, refetch, isRefetching } = useQuery<AppointmentListResponse>({
    queryKey: ["admin", "appointments", searchQuery, statusFilter, page],
    queryFn: () =>
      apiClient.get<AppointmentListResponse>(`/appointments?${queryParams.toString()}`),
  });

  const appointments = response?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const columns: Column<Appointment>[] = [
    {
      header: "Date & Time",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-text-primary font-data">
            {new Date(row.appointmentDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-[11px] text-text-tertiary font-data">
            {row.startTime} – {row.endTime}
          </span>
        </div>
      ),
    },
    {
      header: "Patient",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-text-primary">
            {row.patient?.firstName} {row.patient?.lastName}
          </span>
          <span className="text-[11px] text-clinical font-data font-semibold">
            {row.patient?.uhid}
          </span>
        </div>
      ),
    },
    {
      header: "Doctor",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="text-xs text-text-primary">
            {row.doctor?.user?.email?.split("@")[0]?.split(".")?.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") || "—"}
          </span>
          <span className="text-[11px] text-text-tertiary">{row.doctor?.specialization || "—"}</span>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: (row) => (
        <Badge variant="neutral" className="text-[10px] capitalize">
          {row.type?.replace(/_/g, " ") || "Consultation"}
        </Badge>
      ),
    },
    {
      header: "Reason",
      accessor: (row) => (
        <span className="text-xs text-text-secondary max-w-[200px] truncate block">
          {row.reason || "—"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge
          variant={STATUS_BADGE[row.status] || "neutral"}
          className="text-[10px] capitalize"
        >
          {row.status?.replace(/_/g, " ")}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-xl" />
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
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Appointments</h3>
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
            <Calendar className="w-6 h-6 text-role-admin" />
            Appointment Management
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            View, search, and manage all scheduled appointments across the facility.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2 rounded-lg bg-bg-muted hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border transition-all"
          title="Refresh appointments"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3 shadow-sm border-l-4 border-l-role-admin">
          <div className="p-2 rounded-lg bg-role-admin/10 text-role-admin">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Total</p>
            <p className="text-lg font-bold text-text-primary font-data">{total}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 shadow-sm border-l-4 border-l-clinical">
          <div className="p-2 rounded-lg bg-clinical/10 text-clinical">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Scheduled</p>
            <p className="text-lg font-bold text-text-primary font-data">
              {appointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 shadow-sm border-l-4 border-l-success">
          <div className="p-2 rounded-lg bg-success/10 text-success">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Completed</p>
            <p className="text-lg font-bold text-text-primary font-data">
              {appointments.filter((a) => a.status === "completed").length}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 shadow-sm border-l-4 border-l-critical">
          <div className="p-2 rounded-lg bg-critical/10 text-critical">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Cancelled</p>
            <p className="text-lg font-bold text-text-primary font-data">
              {appointments.filter((a) => a.status === "cancelled").length}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search by patient name, UHID, or doctor..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-muted text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-admin"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="h-10 pl-9 pr-4 rounded-lg border border-border bg-bg-muted text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-role-admin appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={appointments}
        emptyMessage="No appointments found matching your criteria."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-text-tertiary">
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-bg-muted hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-all text-text-primary"
            >
              Previous
            </button>
            <span className="text-xs text-text-secondary font-data">
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-bg-muted hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-all text-text-primary"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
