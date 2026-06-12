"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

function getDoctorName(email?: string) {
  if (!email) return "Practitioner";
  if (email.toLowerCase().startsWith("doctor@")) return "Dr. Jane Foster";
  const prefix = email.split("@")[0] || "";
  return `Dr. ${prefix
    .split('.')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')}`;
}

export default function AppointmentsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["patient", "appointments"],
    queryFn: () => apiClient.get<{ data: any[] }>("/appointments?limit=100"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 border border-dashed rounded-xl bg-critical-muted text-center">
        <h3 className="font-semibold">Unable to load appointments</h3>
        <p className="text-sm text-text-secondary">{(error as any)?.message || "Error"}</p>
      </div>
    );
  }

  const appointments = (data as any)?.data?.data || data?.data || [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">My Appointments</h1>
      <div className="grid grid-cols-1 gap-4">
        {appointments.length === 0 ? (
          <Card className="p-6">No appointments found.</Card>
        ) : (
          appointments.map((a: any) => (
            <Card key={a.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{new Date(a.scheduledAt).toLocaleDateString()} at {new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-sm text-text-secondary">{a.visitReason || "Consultation"}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{getDoctorName(a?.doctor?.user?.email)}</p>
                  <p className="text-sm text-text-secondary">{a.status}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
