"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { careosToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Appointment {
  id: string;
  patientId: string;
  facilityId: string;
  departmentId: string | null;
  scheduledAt: string;
  durationMinutes: number;
  visitReason: string | null;
  status: string;
  encounterId: string | null;
  patient: {
    profile: {
      fullName: string;
      gender: string;
      dateOfBirth: string;
    } | null;
  };
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const router = useRouter();
  const queryClient = useQueryClient();

  const dateStr = currentDate.toISOString().split("T")[0] || "";

  // 1. Fetch appointments for selected date
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ["appointments", { date: dateStr }],
    queryFn: () => apiClient.get<{ data: Appointment[] }>(`/appointments?date=${dateStr}&limit=100`),
  });

  // 2. Check-in mutation
  const checkinMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      apiClient.patch<{ data: Appointment }>(`/appointments/${appointmentId}/status`, {
        status: "checked_in",
      }),
    onSuccess: () => {
      careosToast.success("Patient checked in.");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err: any) => {
      careosToast.error("Check-in failed", err.message);
    },
  });

  // 3. Create Encounter mutation
  const createEncounter = useMutation({
    mutationFn: (appt: Appointment) =>
      apiClient.post<{ data: { id: string } }>("/encounters", {
        patientId: appt.patientId,
        appointmentId: appt.id,
        facilityId: appt.facilityId,
        departmentId: appt.departmentId || undefined,
        encounterType: "outpatient",
        chiefComplaint: appt.visitReason || "Outpatient Consultation",
      }),
    onSuccess: (res) => {
      careosToast.success("Encounter created.");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
      router.push(`/d/encounters/${res.data.id}`);
    },
    onError: (err: any) => {
      careosToast.error("Failed to start encounter", err.message);
    },
  });

  const handleStartOrResume = (appt: Appointment) => {
    if (appt.encounterId) {
      router.push(`/d/encounters/${appt.encounterId}`);
    } else {
      createEncounter.mutate(appt);
    }
  };

  const changeDate = (days: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + days);
    setCurrentDate(nextDate);
  };

  // Stats derived from data
  const appointments = scheduleData?.data || [];
  const totalBookings = appointments.length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const pendingCount = totalBookings - completedCount;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-bg-elevated border border-border rounded-xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Clinical Schedule</h2>
          <p className="text-text-secondary mt-1">Manage slots, check-ins, and scheduled consultations.</p>
        </div>
        <div className="flex items-center gap-3 bg-bg-subtle p-2 rounded-lg border border-border">
          <button
            onClick={() => changeDate(-1)}
            className="p-1.5 rounded-md hover:bg-bg-elevated text-text-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-text-primary">
            {currentDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
          <button
            onClick={() => changeDate(1)}
            className="p-1.5 rounded-md hover:bg-bg-elevated text-text-secondary transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slot List */}
        <Card className="lg:col-span-2 p-6 flex flex-col gap-4 bg-bg-surface border-border">
          <h3 className="text-base font-semibold text-text-primary">Today&apos;s Appointments</h3>
          <div className="flex flex-col gap-3">
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 text-text-secondary text-sm">
                No appointments scheduled for this date.
              </div>
            ) : (
              appointments.map((slot) => {
                const timeStr = new Date(slot.scheduledAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-bg-subtle/30 border border-border hover:border-border-strong transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-clinical/10 text-clinical">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">
                          {slot.patient.profile?.fullName || "Unknown Patient"}
                        </h4>
                        <p className="text-xs text-text-secondary mt-[2px]">
                          {slot.visitReason || "General Consultation"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-text-secondary">{timeStr}</span>
                      <Badge
                        variant={
                          slot.status === "completed"
                            ? "success"
                            : slot.status === "in_consultation" || slot.status === "checked_in"
                            ? "info"
                            : slot.status === "cancelled"
                            ? "critical"
                            : "warning"
                        }
                      >
                        {slot.status.replace("_", " ")}
                      </Badge>
                      {slot.status === "scheduled" && (
                        <button
                          onClick={() => checkinMutation.mutate(slot.id)}
                          disabled={checkinMutation.isPending}
                          className="h-8 px-3 rounded-md bg-bg-elevated border border-border text-text-primary hover:bg-bg-subtle transition-colors text-xs font-semibold"
                        >
                          Check In
                        </button>
                      )}
                      {(slot.status === "checked_in" || slot.status === "in_consultation") && (
                        <button
                          onClick={() => handleStartOrResume(slot)}
                          disabled={createEncounter.isPending}
                          className="h-8 px-3 rounded-md bg-clinical text-text-inverse hover:bg-clinical-hover transition-colors text-xs font-semibold"
                        >
                          {slot.encounterId ? "Resume SOAP" : "Start SOAP"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Mini Calendar/Details Sidebar */}
        <Card className="p-6 flex flex-col gap-4 bg-bg-surface border-border">
          <h3 className="text-base font-semibold text-text-primary">Overview</h3>
          <div className="flex flex-col gap-3 text-sm text-text-secondary">
            <div className="flex justify-between py-2 border-b border-border">
              <span>Total Bookings</span>
              <span className="font-semibold text-text-primary">{totalBookings}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span>Completed Today</span>
              <span className="font-semibold text-text-primary">{completedCount}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span>Remaining Slots</span>
              <span className="font-semibold text-text-primary">{pendingCount}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
