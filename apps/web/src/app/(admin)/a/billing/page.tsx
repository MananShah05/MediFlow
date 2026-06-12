"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  CreditCard,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  IndianRupee,
  Receipt,
  ArrowUpRight,
} from "lucide-react";

export default function AdminBillingPage() {
  const { data: dashData, isLoading, isError, refetch, isRefetching } = useQuery<{ data: any }>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiClient.get<{ data: any }>("/admin/dashboard"),
  });

  const stats = dashData?.data?.stats;

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
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Billing data</h3>
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
            <CreditCard className="w-6 h-6 text-role-admin" />
            Billing & Revenue
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Monitor billing activity, invoice cycles, and revenue collection.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2 rounded-lg bg-bg-muted hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border transition-all"
          title="Refresh billing data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Revenue Card */}
      <Card className="p-6 shadow-sm border-l-4 border-l-warning bg-bg-elevated relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-warning/5 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-4 rounded-xl bg-warning/10 text-warning">
            <IndianRupee className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Today&apos;s Revenue</p>
            <p className="text-3xl font-bold text-text-primary font-data mt-1">
              {stats?.billingRevenue || "₹ 0.00"}
            </p>
            <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-success" />
              Revenue collected today from completed payments
            </p>
          </div>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-clinical/10 text-clinical">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Invoice Management</h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            View and manage patient invoices, track payment statuses, generate billing statements, and handle insurance claims. Invoice details are available through the patient records.
          </p>
          <div className="mt-2 pt-3 border-t border-border-subtle">
            <p className="text-[10px] text-text-tertiary">
              Invoice generation and detailed payment tracking features are coming in a future update.
            </p>
          </div>
        </Card>

        <Card className="p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Payment Collection</h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Track real-time payment collections, outstanding balances, and revenue trends. All payment transactions are logged in the audit trail for regulatory compliance.
          </p>
          <div className="mt-2 pt-3 border-t border-border-subtle">
            <p className="text-[10px] text-text-tertiary">
              Detailed analytics and export features are under development.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
