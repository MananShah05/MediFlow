"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Calendar, Shield, CreditCard, Heart, ArrowRight, Loader2, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { careosToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Doctor {
  id: string;
  specialization: string;
  departmentId: string | null;
  user: {
    email: string;
  };
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Facility {
  id: string;
  name: string;
}

interface Vital {
  id: string;
  systolicBp: number | null;
  diastolicBp: number | null;
  pulse: number | null;
  temperature: number | null;
  temperatureUnit: string;
  spo2: number | null;
  respiratoryRate: number | null;
  recordedAt: string;
}

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  visitReason: string | null;
  doctor: Doctor;
  department: Department | null;
  facility: Facility | null;
}

interface PrescriptionItem {
  id: string;
  dose: string | number;
  doseUnit: string;
  route: string;
  frequency: string;
  durationDays: number | null;
  medication: {
    genericName: string;
    brandNames: string[];
  };
}

interface Prescription {
  id: string;
  status: string;
  items: PrescriptionItem[];
}

interface Diagnosis {
  id: string;
  icdCode: string;
  icdDescription: string;
}

interface Encounter {
  id: string;
  chiefComplaint: string | null;
  followUpDate: string | null;
  createdAt: string;
  status: string;
  doctor: Doctor;
  diagnoses: Diagnosis[];
  prescriptions: Prescription[];
}

interface DashboardData {
  patient: {
    id: string;
    uhid: string;
  };
  stats: {
    nextAppointment: Appointment | null;
    latestVitals: Vital | null;
    activeConsentsCount: number;
    outstandingBalance: number;
  };
  recentEncounters: Encounter[];
  metadata: {
    doctors: Doctor[];
    departments: Department[];
    facilities: Facility[];
  };
}

export default function PatientDashboard() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Modals visibility
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);

  // Form states - Request Appointment
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [apptType, setApptType] = useState<"outpatient" | "teleconsult">("outpatient");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [apptReason, setApptReason] = useState("");

  // Form states - Grant Consent
  const [consentPurpose, setConsentPurpose] = useState<"treatment" | "research" | "insurance" | "marketing" | "data_sharing" | "abdm_exchange">("treatment");
  const [granteeType, setGranteeType] = useState<"doctor" | "facility">("doctor");
  const [granteeId, setGranteeId] = useState("");
  const [consentScopes, setConsentScopes] = useState<string[]>(["clinical_records", "vitals"]);
  const [consentExpiryDate, setConsentExpiryDate] = useState("");

  // Fetch Dashboard summary data
  const { data: responseData, isLoading, isError, error } = useQuery<{ data: DashboardData }>({
    queryKey: ["patient", "dashboard"],
    queryFn: () => apiClient.get<{ data: DashboardData }>("/patients/me/dashboard"),
  });

  const data = responseData?.data;

  // Create Appointment Mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (body: any) => apiClient.post("/appointments", body),
    onSuccess: () => {
      careosToast.success("Appointment request submitted successfully.");
      queryClient.invalidateQueries({ queryKey: ["patient", "dashboard"] });
      setIsAppointmentOpen(false);
      resetAppointmentForm();
    },
    onError: (err: any) => {
      careosToast.error("Failed to request appointment", err.message);
    },
  });

  // Create Consent Mutation
  const createConsentMutation = useMutation({
    mutationFn: (body: any) => apiClient.post("/patients/me/consents", body),
    onSuccess: () => {
      careosToast.success("Consent grant recorded successfully.");
      queryClient.invalidateQueries({ queryKey: ["patient", "dashboard"] });
      setIsConsentOpen(false);
      resetConsentForm();
    },
    onError: (err: any) => {
      careosToast.error("Failed to record consent", err.message);
    },
  });

  const resetAppointmentForm = () => {
    setSelectedDoctorId("");
    setApptType("outpatient");
    setApptDate("");
    setApptTime("");
    setApptReason("");
  };

  const resetConsentForm = () => {
    setConsentPurpose("treatment");
    setGranteeType("doctor");
    setGranteeId("");
    setConsentScopes(["clinical_records", "vitals"]);
    setConsentExpiryDate("");
  };

  const handleRequestAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.patient.id || !selectedDoctorId || !apptDate || !apptTime) {
      careosToast.warning("Please fill out all required fields.");
      return;
    }

    const doctor = data.metadata.doctors.find((d) => d.id === selectedDoctorId);
    const facilityId = data.metadata.facilities[0]?.id || "a0f8b1c4-1d2e-3f4a-5b6c-7d8e9f0a1b2c";

    const scheduledAt = new Date(`${apptDate}T${apptTime}`).toISOString();

    createAppointmentMutation.mutate({
      patientId: data.patient.id,
      doctorId: selectedDoctorId,
      facilityId,
      departmentId: doctor?.departmentId || undefined,
      appointmentType: apptType,
      scheduledAt,
      durationMinutes: 30,
      visitReason: apptReason || undefined,
      bookingChannel: "patient_portal",
    });
  };

  const handleGrantConsent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!granteeId || !consentExpiryDate || consentScopes.length === 0) {
      careosToast.warning("Please fill out all required fields.");
      return;
    }

    const expiresAt = new Date(`${consentExpiryDate}T23:59:59`).toISOString();

    createConsentMutation.mutate({
      purpose: consentPurpose,
      dataScope: consentScopes,
      granteeType,
      granteeId,
      expiresAt,
    });
  };

  const toggleScope = (scope: string) => {
    setConsentScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const getDoctorName = (email?: string) => {
    if (!email) return "Practitioner";
    if (email.toLowerCase().startsWith("doctor@")) return "Dr. Jane Foster";
    const prefix = email.split("@")[0] || "";
    return `Dr. ${prefix
      .split(".")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ")}`;
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center border border-dashed border-critical rounded-xl bg-critical-muted">
        <h3 className="text-lg font-bold text-critical-text">Unable to load dashboard</h3>
        <p className="text-text-secondary mt-1">{(error as any)?.message || "Internal Server Error"}</p>
      </div>
    );
  }

  const { stats, recentEncounters, metadata } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="bg-bg-elevated border border-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-role-patient/10 blur-3xl pointer-events-none" />
        <h2 className="text-2xl font-bold text-text-primary">
          Welcome back, {user?.firstName || "Patient"}
        </h2>
        <p className="text-text-secondary mt-1">
          Access your digital health record, manage active consents, and schedule appointments.
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Next Appointment Card */}
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-role-patient">
          <div className="p-2 rounded-lg bg-role-patient/10 text-role-patient">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Next Appointment</p>
            {stats.nextAppointment ? (
              <div className="mt-1">
                <p className="text-sm font-semibold text-text-primary">
                  {new Date(stats.nextAppointment.scheduledAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })} at {new Date(stats.nextAppointment.scheduledAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-text-secondary truncate max-w-[180px]">
                  {getDoctorName(stats.nextAppointment.doctor?.user.email)}
                </p>
              </div>
            ) : (
              <p className="text-sm font-semibold text-text-primary mt-1">None Scheduled</p>
            )}
          </div>
        </Card>

        {/* Recent Vitals Card */}
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-clinical">
          <div className="p-2 rounded-lg bg-clinical/10 text-clinical">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Recent Vitals</p>
            {stats.latestVitals ? (
              <div className="mt-1">
                <p className="text-sm font-semibold text-text-primary">
                  SpO2: {Number(stats.latestVitals.spo2)}% · Pulse: {Number(stats.latestVitals.pulse)}
                </p>
                <p className="text-xs text-text-secondary">
                  BP: {Number(stats.latestVitals.systolicBp)}/{Number(stats.latestVitals.diastolicBp)} · Temp: {Number(stats.latestVitals.temperature)}°{stats.latestVitals.temperatureUnit}
                </p>
              </div>
            ) : (
              <p className="text-sm font-semibold text-text-primary mt-1">None Recorded</p>
            )}
          </div>
        </Card>

        {/* Active Consents Card */}
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-role-superadmin">
          <div className="p-2 rounded-lg bg-role-superadmin/10 text-role-superadmin">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Active Consents</p>
            <p className="text-sm font-semibold text-text-primary mt-1">
              {stats.activeConsentsCount} Active Grant{stats.activeConsentsCount !== 1 && "s"}
            </p>
          </div>
        </Card>

        {/* Outstanding Balance Card */}
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-warning">
          <div className="p-2 rounded-lg bg-warning/10 text-warning">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Outstanding Balance</p>
            <p className="text-sm font-semibold text-text-primary mt-1">
              ₹ {stats.outstandingBalance.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      {/* Sub-panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Health Summary */}
        <Card className="lg:col-span-2 p-6 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-text-primary">Recent Health Summary</h3>
          {recentEncounters.length === 0 ? (
            <div className="h-48 border border-dashed border-border rounded-lg flex items-center justify-center text-text-tertiary">
              No recent clinical encounters recorded
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {recentEncounters.map((encounter) => (
                <div
                  key={encounter.id}
                  className="p-4 border border-border rounded-lg bg-bg-subtle/20 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        Consultation with {getDoctorName(encounter.doctor.user?.email)}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1">
                        {new Date(encounter.createdAt).toLocaleDateString([], {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={encounter.status === "finalized" ? "success" : "warning"}>
                      {encounter.status}
                    </Badge>
                  </div>

                  {encounter.chiefComplaint && (
                    <div>
                      <p className="text-xs font-semibold text-text-secondary">Chief Complaint</p>
                      <p className="text-sm text-text-primary mt-1">{encounter.chiefComplaint}</p>
                    </div>
                  )}

                  {encounter.diagnoses.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-secondary">Diagnoses</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {encounter.diagnoses.map((diag) => (
                          <Badge key={diag.id} variant="neutral">
                            {diag.icdCode} - {diag.icdDescription}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {encounter.prescriptions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-secondary">Prescribed Medications</p>
                      <div className="flex flex-col gap-2 mt-1">
                        {encounter.prescriptions.map((presc) =>
                          presc.items.map((item) => (
                            <div key={item.id} className="text-xs text-text-primary bg-bg-surface p-2 border border-border rounded">
                              <span className="font-semibold">
                                {item.medication.genericName}{" "}
                                {item.medication.brandNames.length > 0 && `(${item.medication.brandNames.join(", ")})`}
                              </span>{" "}
                              — {Number(item.dose)} {item.doseUnit} ({item.route}) · {item.frequency}{" "}
                              {item.durationDays && `for ${item.durationDays} days`}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {encounter.followUpDate && (
                    <div className="pt-2 border-t border-border mt-1 flex justify-between items-center text-xs">
                      <span className="text-text-secondary font-medium">Follow-up Recommended:</span>
                      <span className="text-text-primary font-bold">
                        {new Date(encounter.followUpDate).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-text-primary">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsAppointmentOpen(true)}
              className="w-full h-10 px-4 rounded-md bg-role-patient text-text-inverse hover:bg-role-patient/95 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Request Appointment
            </button>
            <button
              onClick={() => setIsConsentOpen(true)}
              className="w-full h-10 px-4 rounded-md bg-bg-muted border border-border text-text-primary hover:bg-bg-subtle transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Grant Data Consent
            </button>
          </div>
        </Card>
      </div>

      {/* Modal: Request Appointment */}
      <Modal
        isOpen={isAppointmentOpen}
        onClose={() => {
          setIsAppointmentOpen(false);
          resetAppointmentForm();
        }}
        title="Request Appointment"
        description="Book a new general consultation or teleconsultation with a hospital practitioner."
      >
        <form onSubmit={handleRequestAppointment} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Select Doctor *</label>
            <select
              required
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="h-10 px-3 border border-border rounded-md bg-bg-surface text-sm text-text-primary focus:outline-none focus:border-role-patient"
            >
              <option value="">Choose a doctor...</option>
              {metadata.doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {getDoctorName(doc.user.email)} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Consultation Type *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                <input
                  type="radio"
                  name="apptType"
                  value="outpatient"
                  checked={apptType === "outpatient"}
                  onChange={() => setApptType("outpatient")}
                  className="accent-role-patient"
                />
                In-Person Outpatient
              </label>
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                <input
                  type="radio"
                  name="apptType"
                  value="teleconsult"
                  checked={apptType === "teleconsult"}
                  onChange={() => setApptType("teleconsult")}
                  className="accent-role-patient"
                />
                Video Teleconsultation
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Date *</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
                className="h-10 px-3 border border-border rounded-md bg-bg-surface text-sm text-text-primary focus:outline-none focus:border-role-patient"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Time *</label>
              <input
                type="time"
                required
                value={apptTime}
                onChange={(e) => setApptTime(e.target.value)}
                className="h-10 px-3 border border-border rounded-md bg-bg-surface text-sm text-text-primary focus:outline-none focus:border-role-patient"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Reason for Visit</label>
            <textarea
              placeholder="Briefly describe your symptoms or concern..."
              rows={3}
              value={apptReason}
              onChange={(e) => setApptReason(e.target.value)}
              className="p-3 border border-border rounded-md bg-bg-surface text-sm text-text-primary focus:outline-none focus:border-role-patient resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={createAppointmentMutation.isPending || !selectedDoctorId || !apptDate || !apptTime}
            className="h-10 rounded-md bg-role-patient text-text-inverse hover:bg-role-patient/90 disabled:opacity-50 transition-colors text-sm font-semibold mt-2 flex items-center justify-center gap-2"
          >
            {createAppointmentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Appointment
          </button>
        </form>
      </Modal>

      {/* Modal: Grant Consent */}
      <Modal
        isOpen={isConsentOpen}
        onClose={() => {
          setIsConsentOpen(false);
          resetConsentForm();
        }}
        title="Grant Data Consent"
        description="Share parts of your clinical record with doctors or clinical facilities."
      >
        <form onSubmit={handleGrantConsent} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Purpose *</label>
            <select
              value={consentPurpose}
              onChange={(e) => setConsentPurpose(e.target.value as any)}
              className="h-10 px-3 border border-border rounded-md bg-bg-surface text-sm text-text-primary focus:outline-none focus:border-role-patient"
            >
              <option value="treatment">Treatment & Care Coordination</option>
              <option value="research">Scientific Research</option>
              <option value="insurance">Insurance Claim Verification</option>
              <option value="data_sharing">Data Sharing Request</option>
              <option value="abdm_exchange">ABDM Exchange</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Grantee Type *</label>
              <select
                value={granteeType}
                onChange={(e) => {
                  setGranteeType(e.target.value as any);
                  setGranteeId("");
                }}
                className="h-10 px-3 border border-border rounded-md bg-bg-surface text-sm text-text-primary focus:outline-none focus:border-role-patient"
              >
                <option value="doctor">Doctor</option>
                <option value="facility">Facility</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Select Grantee *</label>
              <select
                required
                value={granteeId}
                onChange={(e) => setGranteeId(e.target.value)}
                className="h-10 px-3 border border-border rounded-md bg-bg-surface text-sm text-text-primary focus:outline-none focus:border-role-patient"
              >
                <option value="">Choose...</option>
                {granteeType === "doctor"
                  ? metadata.doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {getDoctorName(doc.user.email)} ({doc.specialization})
                      </option>
                    ))
                  : metadata.facilities.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Data Scope (Select at least one) *</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentScopes.includes("clinical_records")}
                  onChange={() => toggleScope("clinical_records")}
                  className="rounded border-border text-role-patient focus:ring-role-patient"
                />
                Clinical Records
              </label>
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentScopes.includes("vitals")}
                  onChange={() => toggleScope("vitals")}
                  className="rounded border-border text-role-patient focus:ring-role-patient"
                />
                Vitals & Readings
              </label>
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentScopes.includes("prescriptions")}
                  onChange={() => toggleScope("prescriptions")}
                  className="rounded border-border text-role-patient focus:ring-role-patient"
                />
                Prescriptions
              </label>
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentScopes.includes("lab_results")}
                  onChange={() => toggleScope("lab_results")}
                  className="rounded border-border text-role-patient focus:ring-role-patient"
                />
                Laboratory Results
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Consent Expiration Date *</label>
            <input
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              value={consentExpiryDate}
              onChange={(e) => setConsentExpiryDate(e.target.value)}
              className="h-10 px-3 border border-border rounded-md bg-bg-surface text-sm text-text-primary focus:outline-none focus:border-role-patient"
            />
          </div>

          <button
            type="submit"
            disabled={createConsentMutation.isPending || !granteeId || !consentExpiryDate || consentScopes.length === 0}
            className="h-10 rounded-md bg-role-patient text-text-inverse hover:bg-role-patient/90 disabled:opacity-50 transition-colors text-sm font-semibold mt-2 flex items-center justify-center gap-2"
          >
            {createConsentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Grant Access
          </button>
        </form>
      </Modal>
    </div>
  );
}
