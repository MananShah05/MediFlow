"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, CheckCircle, Search, Pill, FlaskConical, AlertCircle, Save } from "lucide-react";
import { careosToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { useBreadcrumbOverride } from "@/lib/breadcrumb-context";

interface Diagnosis {
  id: string;
  icdCode: string;
  icdDescription: string;
  diagnosisType: string;
  status: string;
}

interface Medication {
  id: string;
  genericName: string;
  brandNames: string[];
}

interface PrescriptionItem {
  id: string;
  medication: Medication;
  dose: number;
  doseUnit: string;
  route: string;
  frequency: string;
  durationDays: number | null;
  instructions: string | null;
}

interface Prescription {
  id: string;
  status: string;
  notes: string | null;
  items: PrescriptionItem[];
}

interface LabResult {
  id: string;
  testName: string;
  resultValue: string | null;
  resultUnit: string | null;
  referenceRange: string | null;
  flag: string | null;
}

interface LabOrder {
  id: string;
  status: string;
  priority: string;
  clinicalNotes: string | null;
  results: LabResult[];
}

interface Encounter {
  id: string;
  patientId: string;
  doctorId: string;
  facilityId: string;
  departmentId: string | null;
  status: string;
  chiefComplaint: string | null;
  historyOfPresentIllness: string | null;
  examinationFindings: string | null;
  assessmentNotes: string | null;
  planNotes: string | null;
  patientInstructions: string | null;
  finalizedAt: string | null;
  createdAt: string;
  patient: {
    profile: {
      fullName: string;
      gender: string;
      dateOfBirth: string;
      bloodGroup: string | null;
    } | null;
  };
  diagnoses: Diagnosis[];
  prescriptions: Prescription[];
  labOrders: LabOrder[];
}

export default function EncounterDetail() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // SOAP fields state
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState("");
  const [examinationFindings, setExaminationFindings] = useState("");
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [patientInstructions, setPatientInstructions] = useState("");

  // ICD-10 Search & Diagnosis State
  const [icdSearch, setIcdSearch] = useState("");
  const [icdResults, setIcdResults] = useState<{ code: string; description: string }[]>([]);
  const [selectedIcd, setSelectedIcd] = useState<{ code: string; description: string } | null>(null);

  // Prescription Builder State
  const [rxSearch, setRxSearch] = useState("");
  const [rxResults, setRxResults] = useState<Medication[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [dose, setDose] = useState("");
  const [doseUnit, setDoseUnit] = useState("mg");
  const [route, setRoute] = useState("oral");
  const [frequency, setFrequency] = useState("OD");
  const [durationDays, setDurationDays] = useState("");
  const [rxInstructions, setRxInstructions] = useState("");

  // Lab Builder State
  const [labTestName, setLabTestName] = useState("");
  const [labPriority, setLabPriority] = useState("routine");
  const [labNotes, setLabNotes] = useState("");
  const [labOrderItems, setLabOrderItems] = useState<{ testName: string }[]>([]);

  // Modals state
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

  // 1. Fetch Encounter Details
  const { data: encounterData, isLoading, isError } = useQuery({
    queryKey: ["encounters", id],
    queryFn: () => apiClient.get<{ data: Encounter }>(`/encounters/${id}`),
  });

  const encounter = encounterData?.data;
  const isFinalized = encounter?.status === "finalized";

  // Set breadcrumb label to patient name + complaint instead of UUID
  const breadcrumbLabel = encounter
    ? (
        encounter.patient.profile?.fullName
          ? `${encounter.patient.profile.fullName}${encounter.chiefComplaint ? ` — ${encounter.chiefComplaint}` : ""}`
          : encounter.chiefComplaint || undefined
      )
    : undefined;
  useBreadcrumbOverride(id as string, breadcrumbLabel);

  // Sync state with loaded data
  useEffect(() => {
    if (encounter) {
      setChiefComplaint(encounter.chiefComplaint || "");
      setHistoryOfPresentIllness(encounter.historyOfPresentIllness || "");
      setExaminationFindings(encounter.examinationFindings || "");
      setAssessmentNotes(encounter.assessmentNotes || "");
      setPlanNotes(encounter.planNotes || "");
      setPatientInstructions(encounter.patientInstructions || "");
    }
  }, [encounter]);

  // 2. Search ICD-10 codes
  useEffect(() => {
    if (!icdSearch) {
      setIcdResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await apiClient.get<{ data: { code: string; description: string }[] }>(
          `/icd-codes?search=${icdSearch}`
        );
        setIcdResults(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [icdSearch]);

  // 3. Search medications
  useEffect(() => {
    if (!rxSearch) {
      setRxResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await apiClient.get<{ data: Medication[] }>(`/medications?search=${rxSearch}`);
        setRxResults(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [rxSearch]);

  // 4. Save SOAP Notes Mutation
  const saveSoapMutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/encounters/${id}`, {
        chiefComplaint,
        historyOfPresentIllness,
        examinationFindings,
        assessmentNotes,
        planNotes,
        patientInstructions,
      }),
    onSuccess: () => {
      careosToast.success("SOAP progress saved.");
      queryClient.invalidateQueries({ queryKey: ["encounters", id] });
    },
    onError: (err: any) => {
      careosToast.error("Failed to save changes", err.message);
    },
  });

  // 5. Add Diagnosis Mutation
  const addDiagnosisMutation = useMutation({
    mutationFn: (diag: { code: string; description: string }) =>
      apiClient.post(`/encounters/${id}/diagnoses`, {
        icdCode: diag.code,
        icdDescription: diag.description,
        diagnosisType: "primary",
        status: "active",
      }),
    onSuccess: () => {
      careosToast.success("Diagnosis attached.");
      setSelectedIcd(null);
      setIcdSearch("");
      queryClient.invalidateQueries({ queryKey: ["encounters", id] });
    },
    onError: (err: any) => {
      careosToast.error("Failed to add diagnosis", err.message);
    },
  });

  // 6. Remove Diagnosis Mutation
  const removeDiagnosisMutation = useMutation({
    mutationFn: (diagId: string) =>
      apiClient.delete(`/encounters/${id}/diagnoses/${diagId}`),
    onSuccess: () => {
      careosToast.success("Diagnosis removed.");
      queryClient.invalidateQueries({ queryKey: ["encounters", id] });
    },
    onError: (err: any) => {
      careosToast.error("Failed to remove diagnosis", err.message);
    },
  });

  // 7. Add Prescription Mutation
  const addPrescriptionMutation = useMutation({
    mutationFn: (rxData: any) => apiClient.post("/prescriptions", rxData),
    onSuccess: () => {
      careosToast.success("Prescription order placed.");
      setSelectedMedication(null);
      setRxSearch("");
      setDose("");
      setDurationDays("");
      setRxInstructions("");
      queryClient.invalidateQueries({ queryKey: ["encounters", id] });
    },
    onError: (err: any) => {
      careosToast.error("Failed to place prescription", err.message);
    },
  });

  // 8. Place Lab Order Mutation
  const addLabOrderMutation = useMutation({
    mutationFn: (labData: any) => apiClient.post("/lab-orders", labData),
    onSuccess: () => {
      careosToast.success("Lab order placed.");
      setLabOrderItems([]);
      setLabNotes("");
      setLabTestName("");
      queryClient.invalidateQueries({ queryKey: ["encounters", id] });
    },
    onError: (err: any) => {
      careosToast.error("Failed to place lab order", err.message);
    },
  });

  // 9. Finalize Encounter Mutation
  const finalizeMutation = useMutation({
    mutationFn: () => apiClient.post(`/encounters/${id}/finalize`, {}),
    onSuccess: () => {
      careosToast.success("Encounter finalized successfully.");
      setIsFinalizeModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["encounters", id] });
      router.push("/d/encounters");
    },
    onError: (err: any) => {
      careosToast.error("Finalization failed", err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] lg:col-span-2" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (isError || !encounter) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-text-primary">Encounter Not Found</h3>
        <p className="text-text-secondary mt-1">
          This record does not exist or you do not have permission to view it.
        </p>
      </div>
    );
  }

  const handleAttachDiagnosis = () => {
    if (selectedIcd) {
      addDiagnosisMutation.mutate(selectedIcd);
    }
  };

  const handleAddPrescriptionItem = () => {
    if (!selectedMedication || !dose || !durationDays) {
      careosToast.warning("Fill in all prescription details.");
      return;
    }

    addPrescriptionMutation.mutate({
      encounterId: id,
      patientId: encounter.patientId,
      notes: "Routine prescription",
      items: [
        {
          medicationId: selectedMedication.id,
          dose: parseFloat(dose),
          doseUnit,
          route,
          frequency,
          durationDays: parseInt(durationDays),
          instructions: rxInstructions || null,
        },
      ],
    });
  };

  const handleAddLabTest = () => {
    if (!labTestName.trim()) return;
    setLabOrderItems([...labOrderItems, { testName: labTestName.trim() }]);
    setLabTestName("");
  };

  const handleRemoveLabTest = (idx: number) => {
    setLabOrderItems(labOrderItems.filter((_, i) => i !== idx));
  };

  const handlePlaceLabOrder = () => {
    if (labOrderItems.length === 0) {
      careosToast.warning("Add at least one test to place a lab order.");
      return;
    }

    addLabOrderMutation.mutate({
      encounterId: id,
      patientId: encounter.patientId,
      priority: labPriority,
      clinicalNotes: labNotes || null,
      items: labOrderItems,
    });
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const age = encounter.patient.profile?.dateOfBirth
    ? calculateAge(encounter.patient.profile.dateOfBirth)
    : "N/A";

  return (
    <div className="flex flex-col gap-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-elevated border border-border rounded-xl p-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-text-primary">
              {encounter.patient.profile?.fullName || "Patient Record"}
            </h2>
            <Badge variant={isFinalized ? "success" : "warning"}>
              {encounter.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-text-secondary mt-1 text-sm">
            Age: {age} · Gender: {encounter.patient.profile?.gender || "N/A"} · Blood Group:{" "}
            {encounter.patient.profile?.bloodGroup || "N/A"}
          </p>
        </div>
        {!isFinalized && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => saveSoapMutation.mutate()}
              disabled={saveSoapMutation.isPending}
              className="h-10 px-4 flex items-center gap-2 rounded-md bg-bg-subtle border border-border text-text-primary hover:bg-bg-subtle/70 transition-colors text-sm font-semibold"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={() => setIsFinalizeModalOpen(true)}
              className="h-10 px-4 flex items-center gap-2 rounded-md bg-clinical text-text-inverse hover:bg-clinical-hover transition-colors text-sm font-semibold shadow-md"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Finalize Consultation</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOAP Progress Notes Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-6 bg-bg-surface border-border flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <FileText className="w-5 h-5 text-clinical" />
              <h3 className="text-base font-semibold text-text-primary">Clinical SOAP Notes</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Subjective: Chief Complaint
                </label>
                <textarea
                  readOnly={isFinalized}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Reason for visit..."
                  className="p-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical min-h-[90px] disabled:opacity-75"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Subjective: History of Present Illness (HPI)
                </label>
                <textarea
                  readOnly={isFinalized}
                  value={historyOfPresentIllness}
                  onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
                  placeholder="Timeline and symptom details..."
                  className="p-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical min-h-[90px] disabled:opacity-75"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Objective: Examination Findings & Vitals
              </label>
              <textarea
                readOnly={isFinalized}
                value={examinationFindings}
                onChange={(e) => setExaminationFindings(e.target.value)}
                placeholder="Physical findings, vitals, etc..."
                className="p-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical min-h-[90px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Assessment: Clinical Diagnosis Notes
              </label>
              <textarea
                readOnly={isFinalized}
                value={assessmentNotes}
                onChange={(e) => setAssessmentNotes(e.target.value)}
                placeholder="Clinical evaluation and differential diagnoses..."
                className="p-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical min-h-[90px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Plan: Care & Follow-up Plan
                </label>
                <textarea
                  readOnly={isFinalized}
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  placeholder="Next steps, treatment plans..."
                  className="p-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical min-h-[90px]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Plan: Patient Instructions
                </label>
                <textarea
                  readOnly={isFinalized}
                  value={patientInstructions}
                  onChange={(e) => setPatientInstructions(e.target.value)}
                  placeholder="Instructions to patient..."
                  className="p-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical min-h-[90px]"
                />
              </div>
            </div>
          </Card>

          {/* Prescriptions Section */}
          <Card className="p-6 bg-bg-surface border-border flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Pill className="w-5 h-5 text-clinical" />
              <h3 className="text-base font-semibold text-text-primary">Prescribed Medications</h3>
            </div>

            {/* Existing Prescriptions */}
            <div className="flex flex-col gap-3">
              {encounter.prescriptions?.map((rx) => (
                <div key={rx.id} className="p-3 rounded-md bg-bg-subtle/20 border border-border text-sm flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-brand-primary">Rx Order #{rx.id.slice(0, 8)}</span>
                    <Badge variant={rx.status === "active" ? "success" : "critical"}>{rx.status}</Badge>
                  </div>
                  <div className="divide-y divide-border/30">
                    {rx.items.map((item) => (
                      <div key={item.id} className="py-2 flex justify-between items-start gap-4">
                        <div>
                          <p className="font-semibold text-text-primary">{item.medication.genericName}</p>
                          {item.instructions && <p className="text-xs text-text-secondary mt-0.5">{item.instructions}</p>}
                        </div>
                        <div className="text-right text-xs text-text-secondary">
                          <p>{item.dose} {item.doseUnit} · {item.route.toUpperCase()} · {item.frequency}</p>
                          {item.durationDays && <p className="mt-0.5">{item.durationDays} Days</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {encounter.prescriptions?.length === 0 && (
                <p className="text-center py-4 text-xs text-text-secondary">No prescriptions issued.</p>
              )}
            </div>

            {/* Prescriptions Form (if Draft) */}
            {!isFinalized && (
              <div className="p-4 rounded-xl border border-border bg-bg-subtle/30 flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-text-primary">Issue New Medication</h4>

                {/* Medication Autocomplete */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-semibold text-text-secondary">Search Medication</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      type="text"
                      value={rxSearch}
                      onChange={(e) => {
                        setRxSearch(e.target.value);
                        setSelectedMedication(null);
                      }}
                      placeholder="Type generic or brand name..."
                      className="w-full h-10 pl-10 pr-4 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical"
                    />
                  </div>
                  {/* Results List */}
                  {rxResults.length > 0 && !selectedMedication && (
                    <div className="absolute top-[68px] z-10 w-full rounded-md border border-border bg-bg-elevated shadow-lg max-h-[160px] overflow-y-auto">
                      {rxResults.map((med) => (
                        <div
                          key={med.id}
                          onClick={() => {
                            setSelectedMedication(med);
                            setRxSearch(med.genericName);
                          }}
                          className="px-4 py-2 hover:bg-bg-subtle text-sm cursor-pointer text-text-primary border-b border-border/20 last:border-b-0"
                        >
                          <span className="font-semibold">{med.genericName}</span>{" "}
                          <span className="text-xs text-text-secondary">
                            ({med.brandNames.join(", ")})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Dose</label>
                    <input
                      type="number"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                      placeholder="e.g. 500"
                      className="h-10 px-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Unit</label>
                    <select
                      value={doseUnit}
                      onChange={(e) => setDoseUnit(e.target.value)}
                      className="h-10 px-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical"
                    >
                      <option value="mg">mg</option>
                      <option value="ml">ml</option>
                      <option value="mcg">mcg</option>
                      <option value="g">g</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Route</label>
                    <select
                      value={route}
                      onChange={(e) => setRoute(e.target.value)}
                      className="h-10 px-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical"
                    >
                      <option value="oral">Oral</option>
                      <option value="iv">Intravenous (IV)</option>
                      <option value="im">Intramuscular (IM)</option>
                      <option value="sc">Subcutaneous (SC)</option>
                      <option value="topical">Topical</option>
                      <option value="inhaled">Inhaled</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="h-10 px-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical"
                    >
                      <option value="OD">Once Daily (OD)</option>
                      <option value="BD">Twice Daily (BD)</option>
                      <option value="TDS">Three Times (TDS)</option>
                      <option value="QID">Four Times (QID)</option>
                      <option value="PRN">As Needed (PRN)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Duration (Days)</label>
                    <input
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      placeholder="e.g. 7"
                      className="h-10 px-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-text-secondary">Special Instructions</label>
                    <input
                      type="text"
                      value={rxInstructions}
                      onChange={(e) => setRxInstructions(e.target.value)}
                      placeholder="e.g. Take after food..."
                      className="h-10 px-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddPrescriptionItem}
                  disabled={!selectedMedication || addPrescriptionMutation.isPending}
                  className="h-10 self-end px-4 flex items-center gap-2 rounded-md bg-clinical text-text-inverse hover:bg-clinical-hover transition-colors text-xs font-semibold disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Place Prescription Order</span>
                </button>
              </div>
            )}
          </Card>

          {/* Lab Orders Section */}
          <Card className="p-6 bg-bg-surface border-border flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <FlaskConical className="w-5 h-5 text-clinical" />
              <h3 className="text-base font-semibold text-text-primary">Laboratory Orders</h3>
            </div>

            {/* Existing Lab Orders */}
            <div className="flex flex-col gap-3">
              {encounter.labOrders?.map((order) => (
                <div key={order.id} className="p-3 rounded-md bg-bg-subtle/20 border border-border text-sm flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-brand-primary">Lab Order #{order.id.slice(0, 8)}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={order.priority === "stat" ? "critical" : "info"}>{order.priority.toUpperCase()}</Badge>
                      <Badge variant="warning">{order.status}</Badge>
                    </div>
                  </div>
                  <div className="divide-y divide-border/30">
                    {order.results?.map((res) => (
                      <div key={res.id} className="py-2 flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-text-primary">{res.testName}</p>
                          {res.referenceRange && <p className="text-xs text-text-tertiary">Ref: {res.referenceRange}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-text-primary">
                            {res.resultValue ? `${res.resultValue} ${res.resultUnit || ""}` : "Pending Result"}
                          </p>
                          {res.flag && res.flag !== "normal" && <Badge variant="critical" className="text-[10px] py-0 px-1 mt-0.5">{res.flag}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {encounter.labOrders?.length === 0 && (
                <p className="text-center py-4 text-xs text-text-secondary">No lab orders placed.</p>
              )}
            </div>

            {/* Lab Orders Form (if Draft) */}
            {!isFinalized && (
              <div className="p-4 rounded-xl border border-border bg-bg-subtle/30 flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-text-primary">Place New Lab Order</h4>

                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={labTestName}
                      onChange={(e) => setLabTestName(e.target.value)}
                      placeholder="Type test name (e.g. Lipid Profile, TSH)..."
                      className="h-10 px-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical"
                    />
                  </div>
                  <button
                    onClick={handleAddLabTest}
                    className="h-10 px-4 rounded-md bg-bg-elevated border border-border hover:bg-bg-subtle text-text-primary transition-colors text-xs font-semibold self-end"
                  >
                    Add Test
                  </button>
                </div>

                {/* List of tests to order */}
                {labOrderItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-bg-muted rounded-md border border-border">
                    {labOrderItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded bg-bg-elevated border border-border text-text-primary flex items-center gap-1.5"
                      >
                        <span>{item.testName}</span>
                        <button onClick={() => handleRemoveLabTest(idx)} className="text-text-secondary hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Priority</label>
                    <select
                      value={labPriority}
                      onChange={(e) => setLabPriority(e.target.value)}
                      className="h-10 px-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical"
                    >
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="stat">STAT</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Clinical Notes</label>
                    <input
                      type="text"
                      value={labNotes}
                      onChange={(e) => setLabNotes(e.target.value)}
                      placeholder="e.g. Suspected thyroid dysfunction..."
                      className="h-10 px-3 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePlaceLabOrder}
                  disabled={labOrderItems.length === 0 || addLabOrderMutation.isPending}
                  className="h-10 self-end px-4 flex items-center gap-2 rounded-md bg-clinical text-text-inverse hover:bg-clinical-hover transition-colors text-xs font-semibold disabled:opacity-50"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>Submit Lab Order</span>
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Diagnoses Panel */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 bg-bg-surface border-border flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <FileText className="w-5 h-5 text-clinical" />
              <h3 className="text-base font-semibold text-text-primary">Encounter Diagnoses</h3>
            </div>

            {/* List of Attached Diagnoses */}
            <div className="flex flex-col gap-2">
              {encounter.diagnoses?.map((diag) => (
                <div key={diag.id} className="p-2.5 rounded-lg bg-bg-subtle/30 border border-border flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-text-primary">{diag.icdCode}</span>
                    <p className="text-text-secondary mt-0.5">{diag.icdDescription}</p>
                  </div>
                  {!isFinalized && (
                    <button
                      onClick={() => removeDiagnosisMutation.mutate(diag.id)}
                      disabled={removeDiagnosisMutation.isPending}
                      className="p-1 hover:text-red-500 text-text-secondary rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {encounter.diagnoses?.length === 0 && (
                <p className="text-center py-4 text-xs text-text-secondary">No diagnoses attached.</p>
              )}
            </div>

            {/* Add Diagnosis Search Form (if Draft) */}
            {!isFinalized && (
              <div className="flex flex-col gap-3 pt-3 border-t border-border/55">
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-semibold text-text-secondary">Search ICD-10 Diagnosis</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      type="text"
                      value={icdSearch}
                      onChange={(e) => {
                        setIcdSearch(e.target.value);
                        setSelectedIcd(null);
                      }}
                      placeholder="Search code or description..."
                      className="w-full h-10 pl-10 pr-4 rounded-md border border-border bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-clinical"
                    />
                  </div>
                  {/* Results list */}
                  {icdResults.length > 0 && !selectedIcd && (
                    <div className="absolute top-[68px] z-10 w-full rounded-md border border-border bg-bg-elevated shadow-lg max-h-[160px] overflow-y-auto">
                      {icdResults.map((icd) => (
                        <div
                          key={icd.code}
                          onClick={() => {
                            setSelectedIcd(icd);
                            setIcdSearch(`${icd.code} - ${icd.description}`);
                          }}
                          className="px-4 py-2 hover:bg-bg-subtle text-xs cursor-pointer text-text-primary border-b border-border/20 last:border-b-0"
                        >
                          <span className="font-semibold">{icd.code}</span> - {icd.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAttachDiagnosis}
                  disabled={!selectedIcd || addDiagnosisMutation.isPending}
                  className="h-10 w-full rounded-md bg-clinical text-text-inverse hover:bg-clinical-hover transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Attach Diagnosis</span>
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Finalize Confirmation Modal */}
      <Modal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        title="Finalize SOAP Consultation"
        description="Are you absolutely sure you want to finalize this encounter? Finalizing will lock all SOAP notes, prescriptions, and lab orders from further edits, and mark the linked appointment as completed."
      >
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/25 rounded-lg mb-4 text-xs text-red-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Warning: This action is irreversible and complies with electronic medical record integrity laws.</span>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsFinalizeModalOpen(false)}
            className="h-10 px-4 rounded-md bg-bg-subtle border border-border text-text-primary hover:bg-bg-subtle/70 transition-colors text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => finalizeMutation.mutate()}
            disabled={finalizeMutation.isPending}
            className="h-10 px-4 rounded-md bg-clinical text-text-inverse hover:bg-clinical-hover disabled:opacity-50 transition-colors text-sm font-semibold"
          >
            {finalizeMutation.isPending ? "Finalizing..." : "Yes, Finalize"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
