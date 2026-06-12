"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export default function RecordsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["patient", "dashboard"],
    queryFn: () => apiClient.get("/patients/me/dashboard"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 border border-dashed rounded-xl bg-critical-muted text-center">
        <h3 className="font-semibold">Unable to load records</h3>
        <p className="text-sm text-text-secondary">{(error as any)?.message || "Error"}</p>
      </div>
    );
  }

  const recentEncounters = (data as any)?.data?.recentEncounters || [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">My Records</h1>
      <div className="grid grid-cols-1 gap-4">
        {recentEncounters.length === 0 ? (
          <Card className="p-6">No recent encounters found.</Card>
        ) : (
          recentEncounters.map((e: any) => (
            <Card key={e.id} className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{e.chiefComplaint || "Encounter"}</p>
                  <p className="text-sm text-text-secondary">{new Date(e.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{e.status}</p>
                  <p className="text-sm text-text-secondary">{e.doctor?.user?.email || e.doctor?.id}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
