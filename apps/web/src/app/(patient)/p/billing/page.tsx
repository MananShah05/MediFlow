"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export default function BillingPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["patient", "dashboard", "billing"],
    queryFn: () => apiClient.get("/patients/me/dashboard"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-64" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 border border-dashed rounded-xl bg-critical-muted text-center">
        <h3 className="font-semibold">Unable to load billing</h3>
        <p className="text-sm text-text-secondary">{(error as any)?.message || "Error"}</p>
      </div>
    );
  }

  const balance = (data as any)?.data?.stats?.outstandingBalance ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <Card className="p-6">
        <p className="text-sm text-text-secondary">Outstanding Balance</p>
        <p className="text-2xl font-bold mt-2">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(balance)}</p>
        <p className="text-sm text-text-secondary mt-2">View invoices and payment history in Billing details (TBD).</p>
      </Card>
    </div>
  );
}
