"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";
import {
  ScrollText,
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  action: string;
  userEmail: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  outcome: string;
  ipAddress: string;
  metadata: Record<string, any>;
  timestamp: string;
}

interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

const OUTCOME_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  success: { color: "bg-success/15 text-success border-success/30", icon: <CheckCircle2 className="w-3 h-3" />, label: "Success" },
  failure: { color: "bg-critical/15 text-critical border-critical/30", icon: <XCircle className="w-3 h-3" />, label: "Failure" },
  partial: { color: "bg-warning/15 text-warning border-warning/30", icon: <AlertTriangle className="w-3 h-3" />, label: "Partial" },
};

export default function AdminAuditPage() {
  const user = useAuthStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<{ data: AuditLogsResponse }>({
    queryKey: ["admin", "audit-logs", page],
    queryFn: () => apiClient.get<{ data: AuditLogsResponse }>(`/admin/audit-logs?limit=${pageSize}&offset=${page * pageSize}`),
  });

  const logs = data?.data?.logs || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.resourceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.outcome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const token = useAuthStore.getState().accessToken;
    const url = `${API_BASE_URL}/admin/audit-logs/export.csv`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("Authorization", `Bearer ${token}`);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Export failed");
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const dl = document.createElement("a");
        dl.href = blobUrl;
        dl.setAttribute("download", `careos-audit-log-${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(dl);
        dl.click();
        document.body.removeChild(dl);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {
        window.open(url, "_blank");
      });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
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
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Audit Logs</h3>
          <p className="text-sm text-text-secondary mt-1">Please try refreshing the page or check your connection.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-role-admin" />
            Audit Logs
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Comprehensive security audit trail across all tenant operations. Total: {total} entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="h-9 px-4 rounded-lg bg-role-admin text-text-inverse hover:bg-role-admin/90 transition-all text-sm font-semibold flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-lg bg-bg-muted hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search logs by action, user, resource type, or outcome..."
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-muted text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-admin"
        />
      </div>

      {filteredLogs.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <p className="text-text-secondary text-sm">No audit logs match your search criteria.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-muted border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Resource</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Outcome</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">IP Address</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => {
                const cfg = OUTCOME_CONFIG[log.outcome] || OUTCOME_CONFIG.success;
                return (
                  <tr key={log.id} className="hover:bg-bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant="neutral" className="font-bold text-[10px] uppercase tracking-wider px-1.5 py-[1px] bg-clinical/10 text-clinical border-0">
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-text-primary font-medium text-xs">{log.userEmail}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-secondary">{log.resourceType}</span>
                      {log.resourceId && (
                        <span className="text-[10px] text-text-tertiary ml-1">({log.resourceId.slice(0, 8)}...)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[11px] text-text-tertiary font-mono">{log.ipAddress}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-secondary">{new Date(log.timestamp).toLocaleString()}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary text-xs">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-md border border-border bg-bg-muted text-text-primary text-xs font-medium hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-md border border-border bg-bg-muted text-text-primary text-xs font-medium hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
