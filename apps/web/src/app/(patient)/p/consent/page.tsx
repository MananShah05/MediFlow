"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export default function ConsentPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["patient", "dashboard"],
    queryFn: () => apiClient.get("/patients/me/dashboard"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 border border-dashed rounded-xl bg-critical-muted text-center">
        <h3 className="font-semibold">Unable to load consents</h3>
        <p className="text-sm text-text-secondary">{(error as any)?.message || "Error"}</p>
      </div>
    );
  }

  const consentsCount = (data as any)?.data?.stats?.activeConsentsCount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Consent Management</h1>
      <Card className="p-6">
        <p className="text-lg font-semibold">{consentsCount} Active Grants</p>
        <p className="text-sm text-text-secondary mt-2">View and manage the data sharing consents you have provided to your care providers (TBD).</p>
      </Card>
    </div>
  );
}
