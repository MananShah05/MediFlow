"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { careosToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";

interface Encounter {
  id: string;
  patientId: string;
  doctorId: string;
  status: string;
  chiefComplaint: string | null;
  startedAt: string | null;
  finalizedAt: string | null;
  createdAt: string;
  patient: {
    profile: {
      fullName: string;
    } | null;
  };
  diagnoses: {
    icdCode: string;
    icdDescription: string;
    diagnosisType: string;
  }[];
}

interface Patient {
  id: string;
  uhid: string;
  profile: {
    fullName: string;
    gender: string;
  } | null;
}

export default function EncountersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");

  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Fetch encounters list
  const { data: encountersData, isLoading } = useQuery({
    queryKey: ["encounters"],
    queryFn: () => apiClient.get<{ data: Encounter[] }>("/encounters?limit=50"),
  });

  // 2. Fetch patients for "New Encounter" selector
  const { data: patientsData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => apiClient.get<{ data: Patient[] }>("/patients?limit=100"),
    enabled: isNewModalOpen,
  });

  // 3. Create Encounter mutation
  const createEncounter = useMutation({
    mutationFn: () =>
      apiClient.post<{ data: Encounter }>("/encounters", {
        patientId: selectedPatientId,
        facilityId: "a0f8b1c4-1d2e-3f4a-5b6c-7d8e9f0a1b2c", // Seed facility ID
        encounterType: "outpatient",
        chiefComplaint: chiefComplaint || "Outpatient Consultation",
      }),
    onSuccess: (res) => {
      careosToast.success("Encounter created successfully.");
      setIsNewModalOpen(false);
      setSelectedPatientId("");
      setChiefComplaint("");
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
      router.push(`/d/encounters/${res.data.id}`);
    },
    onError: (err: any) => {
      careosToast.error("Failed to create encounter", err.message);
    },
  });

  const encounters = encountersData?.data || [];
  const patients = patientsData?.data || [];

  const filteredEncounters = encounters.filter((e) =>
    e.patient.profile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-bg-elevated border border-border rounded-xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">SOAP Encounters</h2>
          <p className="text-text-secondary mt-1">Create, review, and finalize patient SOAP encounters.</p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="h-10 px-4 flex items-center gap-2 rounded-md bg-clinical text-text-inverse hover:bg-clinical-hover transition-colors text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Encounter</span>
        </button>
      </div>

      <div className="flex items-center gap-4 bg-bg-elevated p-4 border border-border rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search encounters by patient name..."
            className="w-full h-10 pl-10 pr-4 rounded-md border border-border bg-bg-muted text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-clinical text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-6 bg-bg-surface border-border">
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : filteredEncounters.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-sm">
              No encounters found. Click &quot;New Encounter&quot; to start.
            </div>
          ) : (
            filteredEncounters.map((encounter) => {
              const formattedDate = new Date(encounter.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={encounter.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-bg-subtle/30 border border-border hover:border-border-strong transition-colors gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-clinical/10 text-clinical mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-text-primary">
                          {encounter.patient.profile?.fullName || "Unknown Patient"}
                        </h4>
                        <span className="text-xs text-text-secondary">•</span>
                        <span className="text-xs font-semibold text-text-secondary">{formattedDate}</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        {encounter.chiefComplaint || "No chief complaint entered."}
                      </p>
                      {encounter.diagnoses && encounter.diagnoses.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {encounter.diagnoses.map((diag, index) => (
                            <span
                              key={index}
                              className="text-[10px] px-2 py-0.5 rounded bg-bg-elevated border border-border text-text-secondary"
                            >
                              {diag.icdCode} - {diag.icdDescription}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Badge variant={encounter.status === "finalized" ? "success" : "warning"}>
                      {encounter.status.replace("_", " ")}
                    </Badge>
                    <button
                      onClick={() => router.push(`/d/encounters/${encounter.id}`)}
                      className="h-8 px-3 rounded-md bg-clinical text-text-inverse hover:bg-clinical-hover transition-colors text-xs font-semibold"
                    >
                      {encounter.status === "finalized" ? "View Summary" : "Resume SOAP"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* New Encounter Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Start New SOAP Encounter"
        description="Select a registered patient and describe their chief complaint."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="h-10 px-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical"
            >
              <option value="">-- Select Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.profile?.fullName} ({p.uhid})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Chief Complaint</label>
            <textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Patient presents with persistent chest pain and cough..."
              className="p-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical min-h-[80px]"
            />
          </div>

          <button
            onClick={() => createEncounter.mutate()}
            disabled={createEncounter.isPending || !selectedPatientId}
            className="h-10 w-full rounded-md bg-clinical text-text-inverse hover:bg-clinical-hover disabled:opacity-50 transition-colors text-sm font-semibold mt-2"
          >
            Create SOAP Note
          </button>
        </div>
      </Modal>
    </div>
  );
}
