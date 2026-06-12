"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { BedDouble, Users, UserCheck, AlertCircle, Heart, Search, Filter, RefreshCw, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { careosToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";

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

interface ActiveAdmission {
  id: string;
  patientId: string;
  uhid: string;
  patientName: string;
  bedNumber: string;
  wardName: string;
}

interface OtherNurse {
  id: string;
  email: string;
  name: string;
}

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

interface NursingDashboardData {
  nurse: Nurse;
  stats: Stats;
  activeAdmissions: ActiveAdmission[];
  wards: WardInfo[];
  otherNurses: OtherNurse[];
}

export default function WardPage() {
  const queryClient = useQueryClient();
  const [activeWardId, setActiveWardId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Vitals Log Modal state
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<ActiveAdmission | null>(null);
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

  // Fetch Nurse Dashboard Data (reuses cache)
  const { data: responseData, isLoading, isError, refetch, isRefetching } = useQuery<{ data: NursingDashboardData }>({
    queryKey: ["nurse", "dashboard"],
    queryFn: () => apiClient.get<{ data: NursingDashboardData }>("/nursing/dashboard"),
  });

  const data = responseData?.data;

  // Set default ward when data loads
  React.useEffect(() => {
    if (data && data.wards.length > 0 && !activeWardId) {
      setActiveWardId(data.wards[0]?.id || "");
    }
  }, [data, activeWardId]);

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

  const resetVitalsForm = () => {
    setSelectedAdmission(null);
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

  const handleOpenVitals = (bed: BedInfo, wardName: string) => {
    if (!bed.patientName || !data) return;
    
    // Find matching inpatient admission
    const admission = data.activeAdmissions.find(
      (a) => a.patientName.toLowerCase() === bed.patientName?.toLowerCase()
    );

    if (admission) {
      setSelectedAdmission(admission);
      setIsVitalsOpen(true);
    } else {
      careosToast.error("Active admission not found for this patient.");
    }
  };

  const handleVitalsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    const body: any = {
      patientId: selectedAdmission.patientId,
      admissionId: selectedAdmission.id,
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-1/3 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
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
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Ward Dashboard</h3>
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

  const selectedWard = data.wards.find((w) => w.id === activeWardId) || data.wards[0];

  // Ward statistics calculations
  const totalBeds = selectedWard ? selectedWard.rooms.reduce((acc, r) => acc + r.beds.length, 0) : 0;
  const occupiedBeds = selectedWard ? selectedWard.rooms.reduce((acc, r) => acc + r.beds.filter(b => b.status === "occupied").length, 0) : 0;
  const vacantBeds = selectedWard ? selectedWard.rooms.reduce((acc, r) => acc + r.beds.filter(b => b.status === "available" || b.status === "vacant").length, 0) : 0;
  const maintenanceBeds = selectedWard ? selectedWard.rooms.reduce((acc, r) => acc + r.beds.filter(b => b.status === "maintenance").length, 0) : 0;

  // Filter beds/rooms based on query & status filter
  const filteredRooms = selectedWard
    ? selectedWard.rooms
        .map((room) => {
          const filteredBeds = room.beds.filter((bed) => {
            const matchesStatus =
              statusFilter === "all" ||
              (statusFilter === "occupied" && bed.status === "occupied") ||
              (statusFilter === "available" && (bed.status === "available" || bed.status === "vacant")) ||
              (statusFilter === "maintenance" && bed.status === "maintenance");

            const matchesSearch =
              searchQuery === "" ||
              room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (bed.patientName && bed.patientName.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesStatus && matchesSearch;
          });

          return { ...room, beds: filteredBeds };
        })
        .filter((room) => room.beds.length > 0)
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Ward Bed Management</h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time ward layout, bed statuses, and quick vitals logging.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="self-start sm:self-center h-9 px-3 rounded-md border border-border bg-bg-muted hover:bg-bg-subtle text-text-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Ward Tabs */}
      <div className="flex border-b border-border gap-1 overflow-x-auto shrink-0 pb-px">
        {data.wards.map((w) => (
          <button
            key={w.id}
            onClick={() => {
              setActiveWardId(w.id);
              setStatusFilter("all");
              setSearchQuery("");
            }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
              activeWardId === w.id
                ? "border-role-nurse text-role-nurse bg-role-nurse/5"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {w.name} ({w.code})
          </button>
        ))}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-role-nurse shadow-sm">
          <div className="p-2.5 rounded-lg bg-role-nurse/10 text-role-nurse">
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Total Capacity</p>
            <p className="text-lg font-bold text-text-primary mt-0.5 font-data">{totalBeds} Beds</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-clinical shadow-sm">
          <div className="p-2.5 rounded-lg bg-clinical/10 text-clinical">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Occupied Beds</p>
            <p className="text-lg font-bold text-text-primary mt-0.5 font-data">
              {occupiedBeds} <span className="text-xs font-normal text-text-tertiary">({Math.round((occupiedBeds/totalBeds)*100) || 0}% Occ)</span>
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-success shadow-sm">
          <div className="p-2.5 rounded-lg bg-success/10 text-success">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Available Beds</p>
            <p className="text-lg font-bold text-text-primary mt-0.5 font-data">{vacantBeds} Vacant</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-warning shadow-sm">
          <div className="p-2.5 rounded-lg bg-warning/10 text-warning">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Maintenance / Cleaning</p>
            <p className="text-lg font-bold text-text-primary mt-0.5 font-data">{maintenanceBeds} Offline</p>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search room, patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-md border border-border bg-bg-muted text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto shrink-0 py-1">
          <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 whitespace-nowrap mr-2">
            <Filter className="w-3.5 h-3.5" /> Filter Status:
          </span>
          <div className="flex gap-1.5">
            {[
              { id: "all", label: "All Beds" },
              { id: "occupied", label: "Occupied" },
              { id: "available", label: "Available" },
              { id: "maintenance", label: "Maintenance" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === filter.id
                    ? "bg-role-nurse text-text-inverse shadow-sm"
                    : "bg-bg-muted hover:bg-bg-subtle text-text-secondary border border-border"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Rooms & Beds Grid */}
      <div className="flex flex-col gap-6">
        {filteredRooms.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 text-text-tertiary">
            <BedDouble className="w-12 h-12 mx-auto text-text-tertiary/40 mb-3" />
            <h3 className="font-semibold text-text-secondary text-sm">No beds found</h3>
            <p className="text-xs text-text-tertiary mt-1">Try relaxing your search query or filters.</p>
          </Card>
        ) : (
          filteredRooms.map((room) => (
            <Card key={room.id} className="p-6 shadow-sm border border-border flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b border-border-subtle">
                <div>
                  <h3 className="text-base font-bold text-text-primary">Room {room.roomNumber}</h3>
                  <p className="text-xs text-text-tertiary mt-0.5 uppercase tracking-wide font-medium">
                    {room.roomType} Room
                  </p>
                </div>
                <Badge variant="neutral" className="text-xs font-semibold font-data">
                  {room.beds.length} {room.beds.length === 1 ? "Bed" : "Beds"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {room.beds.map((bed) => {
                  const isOccupied = bed.status === "occupied";
                  const isMaint = bed.status === "maintenance";
                  
                  return (
                    <div
                      key={bed.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between min-h-[120px] transition-all duration-fast ${
                        isOccupied
                          ? "bg-clinical/5 border-clinical/20 hover:border-clinical/40"
                          : isMaint
                          ? "bg-warning/5 border-warning/20 hover:border-warning/40"
                          : "bg-bg-muted border-border-subtle hover:border-border"
                      }`}
                    >
                      {/* Bed info & status badge */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-sm font-bold font-data text-text-primary">Bed {bed.bedNumber}</span>
                          <p className="text-[10px] text-text-tertiary mt-0.5 font-medium">{bed.bedType}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isOccupied
                              ? "bg-clinical/10 text-clinical"
                              : isMaint
                              ? "bg-warning/10 text-warning"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          {bed.status}
                        </span>
                      </div>

                      {/* Patient / Details */}
                      <div className="mt-4 pt-3 border-t border-border-subtle flex justify-between items-center">
                        <div className="truncate pr-2">
                          {isOccupied ? (
                            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5 truncate">
                              <span className="w-2 h-2 rounded-full bg-clinical shrink-0" />
                              {bed.patientName}
                            </span>
                          ) : isMaint ? (
                            <span className="text-xs text-warning font-medium">Offline for Service</span>
                          ) : (
                            <span className="text-xs text-success font-semibold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                              Available
                            </span>
                          )}
                        </div>
                        
                        {isOccupied && (
                          <button
                            onClick={() => handleOpenVitals(bed, selectedWard.name)}
                            className="h-7 px-2.5 rounded-md bg-role-nurse text-text-inverse hover:bg-role-nurse/90 text-[11px] font-bold flex items-center gap-1 transition-colors shadow-sm"
                            title="Log patient vitals"
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                            Vitals
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* MODAL: Log Patient Vitals */}
      <Modal
        isOpen={isVitalsOpen}
        onClose={() => setIsVitalsOpen(false)}
        title={selectedAdmission ? `Log Vitals: ${selectedAdmission.patientName}` : "Log Patient Vitals"}
      >
        {selectedAdmission && (
          <form onSubmit={handleVitalsSubmit} className="flex flex-col gap-4">
            <div className="bg-bg-muted/50 p-3 rounded-lg border border-border text-xs text-text-secondary flex flex-col gap-1">
              <div>
                <strong>Patient UHID:</strong> <span className="font-data font-semibold">{selectedAdmission.uhid}</span>
              </div>
              <div>
                <strong>Bed Assignment:</strong> <span className="font-semibold">{selectedAdmission.bedNumber} · {selectedAdmission.wardName}</span>
              </div>
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
              className="h-10 mt-2 rounded-md bg-role-nurse text-text-inverse hover:bg-role-nurse/90 transition-all font-semibold text-sm flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              {logVitalsMutation.isPending ? "Submitting..." : "Save Vitals Entry"}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
