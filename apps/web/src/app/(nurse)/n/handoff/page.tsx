"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRightLeft, BookOpen, AlertCircle, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { mediflowToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Nurse {
  id: string;
  shiftType: string;
  shiftRange: string;
  department: string;
}

interface Stats {
  shiftTimeRemaining: string;
  marDueCount: number;
  pendingTasksCount: number;
  pendingHandoffsCount: number;
}

interface WardInfo {
  id: string;
  name: string;
  code: string;
}

interface OtherNurse {
  id: string;
  email: string;
  name: string;
}

interface NursingDashboardData {
  nurse: Nurse;
  stats: Stats;
  wards: WardInfo[];
  otherNurses: OtherNurse[];
}

export default function HandoffPage() {
  const queryClient = useQueryClient();

  // Form State
  const [selectedWardId, setSelectedWardId] = useState("");
  const [handoffDate, setHandoffDate] = useState(new Date().toISOString().split("T")[0]);
  const [outgoingShift, setOutgoingShift] = useState("day");
  const [incomingNurseId, setIncomingNurseId] = useState("");
  const [handoffNotes, setHandoffNotes] = useState("");

  // Fetch Nurse Dashboard Data
  const { data: responseData, isLoading, isError, refetch } = useQuery<{ data: NursingDashboardData }>({
    queryKey: ["nurse", "dashboard"],
    queryFn: () => apiClient.get<{ data: NursingDashboardData }>("/nursing/dashboard"),
  });

  const data = responseData?.data;

  // Set default values when data loads
  React.useEffect(() => {
    if (data) {
      if (data.wards.length > 0 && !selectedWardId) {
        setSelectedWardId(data.wards[0]?.id || "");
      }
      if (data.nurse && !outgoingShift) {
        setOutgoingShift(data.nurse.shiftType);
      }
      if (data.otherNurses.length > 0 && !incomingNurseId) {
        setIncomingNurseId(data.otherNurses[0]?.id || "");
      }
    }
  }, [data, selectedWardId, outgoingShift, incomingNurseId]);

  // Shift Handoff Mutation
  const handoffMutation = useMutation({
    mutationFn: (body: any) => apiClient.post("/nursing/handoffs", body),
    onSuccess: () => {
      mediflowToast.success("Shift handoff SBAR report submitted successfully.");
      queryClient.invalidateQueries({ queryKey: ["nurse", "dashboard"] });
      setHandoffNotes("");
    },
    onError: (err: any) => {
      mediflowToast.error(err.response?.data?.error?.message || "Failed to submit shift handoff.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWardId) {
      mediflowToast.error("Please select a ward.");
      return;
    }

    const body = {
      wardId: selectedWardId,
      shiftDate: handoffDate,
      outgoingShift,
      incomingNurseId: incomingNurseId || undefined,
      summaryNotes: handoffNotes,
    };

    handoffMutation.mutate(body);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-1/3 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 border-dashed border-2">
        <div className="p-3 bg-destructive/10 rounded-full text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Handoff Data</h3>
          <p className="text-sm text-text-secondary mt-1">Please try refreshing the page.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-sm bg-role-nurse text-text-inverse rounded-md font-semibold"
        >
          Retry
        </button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Shift Handover (SBAR)</h1>
        <p className="text-sm text-text-secondary mt-1">
          Perform digital sign-outs, transition patient care parameters, and record clinical handovers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Handover Form */}
        <Card className="lg:col-span-3 p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
            <ArrowRightLeft className="w-5 h-5 text-role-nurse" />
            <h2 className="text-base font-bold text-text-primary">New Handover Report</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Ward Location</label>
              <select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-role-nurse"
                required
              >
                {data.wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Shift Date</label>
                <input
                  type="date"
                  value={handoffDate}
                  onChange={(e) => setHandoffDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-role-nurse"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Outgoing Shift</label>
                <select
                  value={outgoingShift}
                  onChange={(e) => setOutgoingShift(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-role-nurse"
                >
                  <option value="day">Day Shift</option>
                  <option value="evening">Evening Shift</option>
                  <option value="night">Night Shift</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Incoming Nurse (Care Handover)</label>
              <select
                value={incomingNurseId}
                onChange={(e) => setIncomingNurseId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-role-nurse"
                required
              >
                {data.otherNurses.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">SBAR Summary Notes</label>
              <textarea
                value={handoffNotes}
                onChange={(e) => setHandoffNotes(e.target.value)}
                placeholder="Include Situation (e.g. ward status, high-acuity), Background (diagnoses, recent meds), Assessment (vitals flags, key checks), and Recommendation (pending tasks, doctor visits)."
                className="flex min-h-[140px] w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
                required
              />
            </div>

            <button
              type="submit"
              disabled={handoffMutation.isPending}
              className="h-10 mt-2 rounded-md bg-role-nurse text-text-inverse hover:bg-role-nurse/90 transition-all font-semibold text-sm flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              {handoffMutation.isPending ? "Submitting Handoff..." : "Submit Shift Handover"}
            </button>
          </form>
        </Card>

        {/* Right Column: Reference Guide */}
        <Card className="lg:col-span-2 p-6 shadow-sm border border-border flex flex-col gap-4 bg-bg-elevated">
          <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
            <BookOpen className="w-5 h-5 text-clinical" />
            <h2 className="text-base font-bold text-text-primary">SBAR Handover Guide</h2>
          </div>

          <div className="flex flex-col gap-4 text-xs text-text-secondary">
            <p>
              The <strong>SBAR</strong> framework is a structured communication method that helps nurses hand over clinical care safely and accurately.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0 font-bold text-xs">
                  S
                </div>
                <div>
                  <h4 className="font-bold text-text-primary text-xs mb-0.5">Situation</h4>
                  <p>State the reason for patient warding, their current status, and any active alerts or clinical indicators.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-warning/10 text-warning flex items-center justify-center shrink-0 font-bold text-xs">
                  B
                </div>
                <div>
                  <h4 className="font-bold text-text-primary text-xs mb-0.5">Background</h4>
                  <p>Provide their medical history, principal diagnoses, current therapies, and key test results.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-clinical/10 text-clinical flex items-center justify-center shrink-0 font-bold text-xs">
                  A
                </div>
                <div>
                  <h4 className="font-bold text-text-primary text-xs mb-0.5">Assessment</h4>
                  <p>Outline current vital signs, fluid balance, pain score, recently administered meds, and alert classifications.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-success/10 text-success flex items-center justify-center shrink-0 font-bold text-xs">
                  R
                </div>
                <div>
                  <h4 className="font-bold text-text-primary text-xs mb-0.5">Recommendation</h4>
                  <p>Outline what needs to be done on the next shift: pending labs, medication times, or clinical observations.</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-bg-muted rounded-lg border border-border flex items-start gap-2.5 mt-2">
              <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Attention:</strong> If any patient has a critical vital sign flag, verify that the attending doctor has been notified and that this has been explicitly added to the Recommendation (R) section before sign-out.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
