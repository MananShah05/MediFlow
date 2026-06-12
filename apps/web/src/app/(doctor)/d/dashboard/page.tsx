"use client";

import React from "react";
import { useAuthStore } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Calendar, FileText, FlaskConical, Users, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export default function DoctorDashboard() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split("T")[0] || "";

  // 1. Fetch consultations stats
  const { data: apptStats, isLoading: isApptStatsLoading } = useQuery({
    queryKey: ["appointments", "stats", "today"],
    queryFn: () => apiClient.get<{ total: number; completed: number; scheduled: number }>("/appointments/today/stats"),
  });

  // 2. Fetch encounters stats
  const { data: encStats, isLoading: isEncStatsLoading } = useQuery({
    queryKey: ["encounters", "stats"],
    queryFn: () => apiClient.get<{ draft: number; inProgress: number; finalized: number; total: number }>("/encounters/stats"),
  });

  // 3. Fetch lab stats
  const { data: labStats, isLoading: isLabStatsLoading } = useQuery({
    queryKey: ["lab-orders", "stats"],
    queryFn: () => apiClient.get<{ pending: number; unreviewed: number }>("/lab-orders/stats"),
  });

  // 4. Fetch today's schedule
  const { data: scheduleData, isLoading: isScheduleLoading } = useQuery({
    queryKey: ["appointments", { date: todayStr }],
    queryFn: () => apiClient.get<{ data: Appointment[] }>(`/appointments?date=${todayStr}&limit=5`),
  });

  // 5. Create Encounter mutation
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
      careosToast.success("Encounter created successfully.");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
      router.push(`/d/encounters/${res.data.id}`);
    },
    onError: (err: any) => {
      careosToast.error("Failed to create encounter", err.message);
    },
  });

  const handleStartOrResume = (appt: Appointment) => {
    if (appt.encounterId) {
      router.push(`/d/encounters/${appt.encounterId}`);
    } else {
      createEncounter.mutate(appt);
    }
  };

  const activeInpatientsCount = 0; // Inpatients not part of Phase 1 core care loop

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="bg-bg-elevated border border-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-clinical/10 blur-3xl pointer-events-none" />
        <h2 className="text-2xl font-bold text-text-primary">
          Welcome, Dr. {user?.lastName || "Practitioner"}
        </h2>
        <p className="text-text-secondary mt-1">
          Review your consultations, finalize draft SOAP encounter notes, and coordinate active cases.
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-clinical bg-bg-surface border-border">
          <div className="p-2 rounded-lg bg-clinical/10 text-clinical">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Consultations Today</p>
            {isApptStatsLoading ? (
              <Skeleton className="h-5 w-24 mt-1" />
            ) : (
              <p className="text-sm font-semibold text-text-primary mt-1">
                {apptStats?.total || 0} Appointments
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-warning bg-bg-surface border-border">
          <div className="p-2 rounded-lg bg-warning/10 text-warning">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Draft/In-Progress SOAP</p>
            {isEncStatsLoading ? (
              <Skeleton className="h-5 w-24 mt-1" />
            ) : (
              <p className="text-sm font-semibold text-text-primary mt-1">
                {(encStats?.draft || 0) + (encStats?.inProgress || 0)} Notes
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-role-patient bg-bg-surface border-border">
          <div className="p-2 rounded-lg bg-role-patient/10 text-role-patient">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Active Inpatients</p>
            <p className="text-sm font-semibold text-text-primary mt-1">
              {activeInpatientsCount} Under Care
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-role-superadmin bg-bg-surface border-border">
          <div className="p-2 rounded-lg bg-role-superadmin/10 text-role-superadmin">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Pending Labs</p>
            {isLabStatsLoading ? (
              <Skeleton className="h-5 w-24 mt-1" />
            ) : (
              <p className="text-sm font-semibold text-text-primary mt-1">
                {labStats?.pending || 0} Unreviewed
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Main Content Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 flex flex-col gap-4 bg-bg-surface border-border">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-text-primary">Today&apos;s Schedule</h3>
            {!isApptStatsLoading && apptStats && apptStats.scheduled > 0 && (
              <Badge variant="info">Next Scheduled Appts: {apptStats.scheduled}</Badge>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {isScheduleLoading ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : !scheduleData?.data || scheduleData.data.length === 0 ? (
              <div className="text-center py-6 text-text-secondary text-sm">
                No appointments scheduled for today.
              </div>
            ) : (
              scheduleData.data.map((appt) => {
                const timeStr = new Date(appt.scheduledAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={appt.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-bg-subtle/30 border border-border hover:border-border-strong transition-colors"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">
                        {appt.patient.profile?.fullName || "Unknown Patient"}
                      </h4>
                      <p className="text-xs text-text-secondary mt-[2px]">
                        {appt.patient.profile?.gender || "Gender N/A"} · {appt.visitReason || "General Consultation"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-text-secondary">{timeStr}</span>
                      <button
                        onClick={() => handleStartOrResume(appt)}
                        disabled={createEncounter.isPending}
                        className="h-8 px-3 rounded-md bg-clinical text-text-inverse hover:bg-clinical-hover disabled:opacity-50 transition-colors text-xs font-semibold"
                      >
                        {appt.encounterId ? "Resume SOAP" : "Start SOAP"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-4 bg-bg-surface border-border">
          <h3 className="text-base font-semibold text-text-primary">Clinical Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/d/encounters")}
              className="w-full h-10 px-4 rounded-md bg-clinical text-text-inverse hover:bg-clinical-hover transition-colors text-sm font-medium flex items-center justify-between"
            >
              <span>Manage Encounters</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push("/d/lab-orders")}
              className="w-full h-10 px-4 rounded-md bg-bg-subtle border border-border text-text-primary hover:bg-bg-subtle/75 transition-colors text-sm font-medium flex items-center justify-between"
            >
              <span>Order Laboratory Tests</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push("/d/patients")}
              className="w-full h-10 px-4 rounded-md bg-bg-subtle border border-border text-text-primary hover:bg-bg-subtle/75 transition-colors text-sm font-medium flex items-center justify-between"
            >
              <span>Search Patient Records</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
