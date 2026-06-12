"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Activity, Clock, ListTodo, Pill, Heart, Award, CheckCircle2, ChevronRight, User, BedDouble, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { careosToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
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

interface MARItem {
  id: string;
  patientName: string;
  bedNumber: string;
  drug: string;
  dose: string;
  route: string;
  due: string;
  rawDueTime: string;
  status: string;
}

interface NursingTask {
  id: string;
  title: string;
  description: string | null;
  patientName: string;
  priority: string;
  status: string;
  dueAt: string | null;
}

interface ActiveAdmission {
  id: string;
  patientId: string;
  uhid: string;
  patientName: string;
  bedNumber: string;
  wardName: string;
}

interface BedInfo {
  id: string;
  bedNumber: string;
  status: string;
  bedType: string;
  patientName: string | null;
}

interface RoomInfo {
  id: string;
  roomNumber: string;
  roomType: string;
  beds: BedInfo[];
}

interface WardInfo {
  id: string;
  name: string;
  code: string;
  capacity: number;
  rooms: RoomInfo[];
}

interface OtherNurse {
  id: string;
  email: string;
  name: string;
}

interface NursingDashboardData {
  nurse: Nurse;
  stats: Stats;
  marList: MARItem[];
  tasksList: NursingTask[];
  activeAdmissions: ActiveAdmission[];
  wards: WardInfo[];
  otherNurses: OtherNurse[];
}

export default function NurseDashboard() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Modal Visibility
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [isHandoffOpen, setIsHandoffOpen] = useState(false);
  const [isBedGridOpen, setIsBedGridOpen] = useState(false);

  // Active Ward Tab in Bed Grid
  const [activeWardId, setActiveWardId] = useState<string>("");

  // Log Vitals Form state
  const [selectedAdmissionId, setSelectedAdmissionId] = useState("");
  const [systolicBp, setSystolicBp] = useState<number | "">("");
  const [diastolicBp, setDiastolicBp] = useState<number | "">("");
  const [pulse, setPulse] = useState<number | "">("");
  const [temperature, setTemperature] = useState<number | "">("");
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");
  const [spo2, setSpo2] = useState<number | "">("");
  const [respiratoryRate, setRespiratoryRate] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [painScore, setPainScore] = useState<number | "">("");
  const [vitalNotes, setVitalNotes] = useState("");

  // Shift Handoff Form state
  const [selectedWardId, setSelectedWardId] = useState("");
  const [handoffDate, setHandoffDate] = useState(new Date().toISOString().split("T")[0]);
  const [outgoingShift, setOutgoingShift] = useState("day");
  const [incomingNurseId, setIncomingNurseId] = useState("");
  const [handoffNotes, setHandoffNotes] = useState("");

  // Fetch Nurse Dashboard Data
  const { data: responseData, isLoading, isError } = useQuery<{ data: NursingDashboardData }>({
    queryKey: ["nurse", "dashboard"],
    queryFn: () => apiClient.get<{ data: NursingDashboardData }>("/nursing/dashboard"),
  });

  const data = responseData?.data;

  // Set default values when data loads
  React.useEffect(() => {
    if (data) {
      if (data.activeAdmissions.length > 0 && !selectedAdmissionId) {
        setSelectedAdmissionId(data.activeAdmissions[0]?.id || "");
      }
      if (data.wards.length > 0) {
        if (!activeWardId) setActiveWardId(data.wards[0]?.id || "");
        if (!selectedWardId) setSelectedWardId(data.wards[0]?.id || "");
      }
      if (data.nurse) {
        setOutgoingShift(data.nurse.shiftType);
      }
      if (data.otherNurses.length > 0 && !incomingNurseId) {
        setIncomingNurseId(data.otherNurses[0]?.id || "");
      }
    }
  }, [data]);

  // Medication Administration Mutation
  const administerMedicationMutation = useMutation({
    mutationFn: (marId: string) => apiClient.post(`/nursing/mar/${marId}/administer`, {}),
    onSuccess: () => {
      careosToast.success("Medication administration recorded successfully.");
      queryClient.invalidateQueries({ queryKey: ["nurse", "dashboard"] });
    },
    onError: (err: any) => {
      careosToast.error(err.response?.data?.error?.message || "Failed to record medication administration.");
    },
  });

  // Log Vitals Mutation
  const logVitalsMutation = useMutation({
    mutationFn: (body: any) => apiClient.post("/nursing/vitals", body),
    onSuccess: () => {
      careosToast.success("Patient vitals logged successfully.");
      queryClient.invalidateQueries({ queryKey: ["nurse", "dashboard"] });
      setIsVitalsOpen(false);
      resetVitalsForm();
    },
    onError: (err: any) => {
      careosToast.error(err.response?.data?.error?.message || "Failed to log patient vitals.");
    },
  });

  // Shift Handoff Mutation
  const handoffMutation = useMutation({
    mutationFn: (body: any) => apiClient.post("/nursing/handoffs", body),
    onSuccess: () => {
      careosToast.success("Shift handoff SBAR submitted successfully.");
      queryClient.invalidateQueries({ queryKey: ["nurse", "dashboard"] });
      setIsHandoffOpen(false);
      resetHandoffForm();
    },
    onError: (err: any) => {
      careosToast.error(err.response?.data?.error?.message || "Failed to submit shift handoff.");
    },
  });

  const resetVitalsForm = () => {
    setSystolicBp("");
    setDiastolicBp("");
    setPulse("");
    setTemperature("");
    setSpo2("");
    setRespiratoryRate("");
    setWeightKg("");
    setHeightCm("");
    setPainScore("");
    setVitalNotes("");
  };

  const resetHandoffForm = () => {
    setHandoffNotes("");
  };

  const handleAdminister = (marId: string) => {
    administerMedicationMutation.mutate(marId);
  };

  const handleVitalsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionId) {
      careosToast.error("Please select a patient.");
      return;
    }

    const admission = data?.activeAdmissions.find((a) => a.id === selectedAdmissionId);
    if (!admission) return;

    const body: any = {
      patientId: admission.patientId,
      admissionId: admission.id,
      temperatureUnit: tempUnit,
      notes: vitalNotes,
    };

    if (systolicBp !== "") body.systolicBp = Number(systolicBp);
    if (diastolicBp !== "") body.diastolicBp = Number(diastolicBp);
    if (pulse !== "") body.pulse = Number(pulse);
    if (temperature !== "") body.temperature = Number(temperature);
    if (spo2 !== "") body.spo2 = Number(spo2);
    if (respiratoryRate !== "") body.respiratoryRate = Number(respiratoryRate);
    if (weightKg !== "") body.weightKg = Number(weightKg);
    if (heightCm !== "") body.heightCm = Number(heightCm);
    if (painScore !== "") body.painScore = Number(painScore);

    logVitalsMutation.mutate(body);
  };

  const handleHandoffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWardId) {
      careosToast.error("Please select a ward.");
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
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
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
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Dashboard</h3>
          <p className="text-sm text-text-secondary mt-1">Please try refreshing the page or check your connection.</p>
        </div>
      </Card>
    );
  }

  // Count overdue administrations in frontend (scheduledTime in the past and status is pending)
  const overdueCount = data.marList.filter(m => m.status === "pending" && new Date(m.rawDueTime) < new Date()).length;

  // Selected ward in Bed grid
  const selectedWard = data.wards.find(w => w.id === activeWardId) || data.wards[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="bg-bg-elevated border border-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-role-nurse/10 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-role-nurse" />
          <h2 className="text-2xl font-bold text-text-primary">
            Welcome back, {user?.firstName || "Nurse Clara"}
          </h2>
        </div>
        <p className="text-text-secondary mt-1 ml-9">
          Active Shift: <span className="font-semibold text-text-primary">{data.nurse.shiftRange}</span> · Assigned Ward: <span className="font-semibold text-text-primary">{data.nurse.department}</span>
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-role-nurse shadow-sm">
          <div className="p-2 rounded-lg bg-role-nurse/10 text-role-nurse">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Shift Time Remaining</p>
            <p className="text-sm font-semibold text-text-primary mt-1 font-data">{data.stats.shiftTimeRemaining}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-warning shadow-sm">
          <div className="p-2 rounded-lg bg-warning/10 text-warning">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">MAR Administrations Due</p>
            <p className="text-sm font-semibold text-text-primary mt-1">{data.stats.marDueCount} Meds Pending</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-clinical shadow-sm">
          <div className="p-2 rounded-lg bg-clinical/10 text-clinical">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Pending Tasks</p>
            <p className="text-sm font-semibold text-text-primary mt-1">{data.stats.pendingTasksCount} Assigned Tasks</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-role-superadmin shadow-sm">
          <div className="p-2 rounded-lg bg-role-superadmin/10 text-role-superadmin">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Shift Handoffs</p>
            <p className="text-sm font-semibold text-text-primary mt-1">{data.stats.pendingHandoffsCount} Awaiting Handover</p>
          </div>
        </Card>
      </div>

      {/* Main Content Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-text-primary">Medication Administrations (MAR)</h3>
            {overdueCount > 0 && (
              <Badge variant="warning" className="animate-pulse">⚠️ {overdueCount} Overdue</Badge>
            )}
          </div>
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
            {data.marList.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary text-sm">
                No medications scheduled for administration today.
              </div>
            ) : (
              data.marList.map((med) => {
                const isOverdue = med.status === "pending" && new Date(med.rawDueTime) < new Date();
                return (
                  <div key={med.id} className={`flex justify-between items-center p-3 rounded-lg border transition-all ${isOverdue ? 'bg-warning/5 border-warning/20' : 'bg-bg-muted border-border-subtle'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text-primary">{med.patientName}</h4>
                        <Badge variant="neutral" className="text-[10px] py-[1px] px-1.5">{med.bedNumber}</Badge>
                      </div>
                      <p className="text-xs text-text-tertiary mt-[2px]">
                        <span className="font-medium text-text-secondary">{med.drug}</span> ({med.dose}) · {med.route} · Due {med.due}
                      </p>
                    </div>
                    <div>
                      {med.status === "administered" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Administered
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAdminister(med.id)}
                          disabled={administerMedicationMutation.isPending}
                          className="h-8 px-3 rounded-md bg-role-nurse text-text-inverse hover:bg-role-nurse/90 disabled:opacity-50 transition-colors text-xs font-semibold flex items-center gap-1"
                        >
                          {administerMedicationMutation.isPending ? "Logging..." : "Administer"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-4 shadow-sm justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-text-primary">Nursing Worklist</h3>
            <p className="text-xs text-text-secondary">
              Record patient status updates, manage warded bed configurations, and transition patient care during shift changes.
            </p>
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                onClick={() => setIsVitalsOpen(true)}
                className="w-full h-10 px-4 rounded-md bg-role-nurse text-text-inverse hover:bg-role-nurse/90 transition-all text-sm font-semibold flex items-center justify-between"
              >
                <span>Log Patient Vitals</span>
                <Heart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsHandoffOpen(true)}
                className="w-full h-10 px-4 rounded-md bg-bg-muted border border-border text-text-primary hover:bg-bg-subtle transition-all text-sm font-semibold flex items-center justify-between"
              >
                <span>Submit Shift Handoff (SBAR)</span>
                <Activity className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsBedGridOpen(true)}
                className="w-full h-10 px-4 rounded-md bg-bg-muted border border-border text-text-primary hover:bg-bg-subtle transition-all text-sm font-semibold flex items-center justify-between"
              >
                <span>View Bed Occupancy Grid</span>
                <BedDouble className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-role-nurse animate-ping" />
              <span className="text-xs text-text-secondary font-medium">Logged in as {user?.email}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* MODAL: Log Patient Vitals */}
      <Modal isOpen={isVitalsOpen} onClose={() => setIsVitalsOpen(false)} title="Log Patient Vitals">
        <form onSubmit={handleVitalsSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Select Inpatient Admission</label>
            <select
              value={selectedAdmissionId}
              onChange={(e) => setSelectedAdmissionId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-role-nurse"
              required
            >
              {data.activeAdmissions.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.patientName} (Bed: {adm.bedNumber} · {adm.wardName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Systolic BP (mmHg)</label>
              <input
                type="number"
                value={systolicBp}
                onChange={(e) => setSystolicBp(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 120"
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Diastolic BP (mmHg)</label>
              <input
                type="number"
                value={diastolicBp}
                onChange={(e) => setDiastolicBp(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 80"
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Pulse (bpm)</label>
              <input
                type="number"
                value={pulse}
                onChange={(e) => setPulse(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 72"
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">SpO2 (%)</label>
              <input
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 98"
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Temperature</label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 98.6"
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Unit</label>
              <select
                value={tempUnit}
                onChange={(e) => setTempUnit(e.target.value as "C" | "F")}
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-role-nurse"
              >
                <option value="C">°C</option>
                <option value="F">°F</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Resp. Rate</label>
              <input
                type="number"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 16"
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Pain (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={painScore}
                onChange={(e) => setPainScore(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0-10"
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="cm"
                className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Clinical Notes</label>
            <textarea
              value={vitalNotes}
              onChange={(e) => setVitalNotes(e.target.value)}
              placeholder="Enter patient status, alert states or physical signs..."
              className="flex min-h-[60px] w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
            />
          </div>

          <button
            type="submit"
            disabled={logVitalsMutation.isPending}
            className="h-10 mt-2 rounded-md bg-role-nurse text-text-inverse hover:bg-role-nurse/90 transition-all font-semibold text-sm flex items-center justify-center"
          >
            {logVitalsMutation.isPending ? "Submitting..." : "Save Vitals Entry"}
          </button>
        </form>
      </Modal>

      {/* MODAL: Submit Shift Handoff (SBAR) */}
      <Modal isOpen={isHandoffOpen} onClose={() => setIsHandoffOpen(false)} title="Shift Handover (SBAR)">
        <form onSubmit={handleHandoffSubmit} className="flex flex-col gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
              placeholder="Situation, Background, Assessment, Recommendation details..."
              className="flex min-h-[100px] w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
              required
            />
          </div>

          <button
            type="submit"
            disabled={handoffMutation.isPending}
            className="h-10 mt-2 rounded-md bg-role-nurse text-text-inverse hover:bg-role-nurse/90 transition-all font-semibold text-sm flex items-center justify-center"
          >
            {handoffMutation.isPending ? "Submitting..." : "Submit SBAR Handoff"}
          </button>
        </form>
      </Modal>

      {/* MODAL: View Bed Occupancy Grid */}
      <Modal isOpen={isBedGridOpen} onClose={() => setIsBedGridOpen(false)} title="Ward Bed Occupancy Dashboard">
        <div className="flex flex-col gap-4 max-w-4xl w-full">
          {/* Ward Tabs */}
          <div className="flex border-b border-border">
            {data.wards.map((w) => (
              <button
                key={w.id}
                onClick={() => setActiveWardId(w.id)}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeWardId === w.id ? 'border-role-nurse text-role-nurse' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
              >
                {w.name} ({w.code})
              </button>
            ))}
          </div>

          {/* Occupancy Grid grouped by Room */}
          <div className="flex flex-col gap-6 max-h-[500px] overflow-y-auto pr-1">
            {selectedWard?.rooms.map((room) => (
              <div key={room.id} className="border border-border rounded-lg p-4 bg-bg-muted/30">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-text-primary">{room.roomNumber}</h4>
                  <Badge variant="neutral" className="text-xs">{room.roomType.toUpperCase()}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {room.beds.map((bed) => {
                    const isOccupied = bed.status === "occupied";
                    const isMaint = bed.status === "maintenance";
                    return (
                      <div
                        key={bed.id}
                        className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${isOccupied ? 'bg-clinical/5 border-clinical/20' : isMaint ? 'bg-warning/5 border-warning/20' : 'bg-bg-muted border-border-subtle'}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold font-data text-text-primary">Bed {bed.bedNumber}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isOccupied ? 'bg-clinical/10 text-clinical' : isMaint ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                            {bed.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-1">
                          {isOccupied ? (
                            <span className="font-semibold text-text-primary flex items-center gap-1">
                              <User className="w-3 h-3 text-clinical" />
                              {bed.patientName || "Steve Rogers"}
                            </span>
                          ) : isMaint ? (
                            "Offline (Cleaning/Repair)"
                          ) : (
                            "Empty & Available"
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
