"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, Column } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  Users,
  AlertCircle,
  RefreshCw,
  Search,
  UserCheck,
  Activity,
} from "lucide-react";

interface Patient {
  id: string;
  uhid: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: string;
}

interface PatientListResponse {
  data: Patient[];
  total: number;
  limit: number;
  offset: number;
}

export default function AdminPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: response, isLoading, isError, refetch, isRefetching } = useQuery<PatientListResponse>({
    queryKey: ["admin", "patients", searchQuery, page],
    queryFn: () =>
      apiClient.get<PatientListResponse>(
        `/patients?limit=${limit}&offset=${page * limit}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`
      ),
  });

  const patients = response?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const columns: Column<Patient>[] = [
    {
      header: "UHID",
      accessor: (row) => (
        <span className="font-data text-xs font-semibold text-clinical">{row.uhid}</span>
      ),
    },
    {
      header: "Patient Name",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-text-primary text-sm">
            {row.firstName} {row.lastName}
          </span>
          <span className="text-[11px] text-text-tertiary">{row.email || "—"}</span>
        </div>
      ),
    },
    {
      header: "Gender",
      accessor: (row) => (
        <span className="text-xs text-text-secondary capitalize">{row.gender}</span>
      ),
    },
    {
      header: "Date of Birth",
      accessor: (row) => (
        <span className="text-xs text-text-secondary font-data">
          {new Date(row.dateOfBirth).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Blood Group",
      accessor: (row) => (
        <Badge variant="neutral" className="text-[10px]">
          {row.bloodGroup || "N/A"}
        </Badge>
      ),
    },
    {
      header: "Phone",
      accessor: (row) => (
        <span className="text-xs text-text-secondary font-data">{row.phone || "—"}</span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge
          variant={row.status === "active" ? "success" : "neutral"}
          className="text-[10px] capitalize"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Registered",
      accessor: (row) => (
        <span className="text-[11px] text-text-tertiary font-data">
          {new Date(row.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
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
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Patients</h3>
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
            <Users className="w-6 h-6 text-role-admin" />
            Patient Registry
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            View and search all registered patients across the facility.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2 rounded-lg bg-bg-muted hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border transition-all"
          title="Refresh patient data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3 shadow-sm border-l-4 border-l-role-admin">
          <div className="p-2 rounded-lg bg-role-admin/10 text-role-admin">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Total Patients</p>
            <p className="text-lg font-bold text-text-primary font-data">{total}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 shadow-sm border-l-4 border-l-success">
          <div className="p-2 rounded-lg bg-success/10 text-success">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Active</p>
            <p className="text-lg font-bold text-text-primary font-data">
              {patients.filter((p) => p.status === "active").length}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 shadow-sm border-l-4 border-l-warning">
          <div className="p-2 rounded-lg bg-warning/10 text-warning">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Current Page</p>
            <p className="text-lg font-bold text-text-primary font-data">
              {patients.length} of {total}
            </p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search by UHID, name, email, or phone..."
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-muted text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-admin"
        />
      </div>

      {/* Patient Table */}
      <DataTable
        columns={columns}
        data={patients}
        emptyMessage="No patients found matching your criteria."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-text-tertiary">
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total} patients
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
