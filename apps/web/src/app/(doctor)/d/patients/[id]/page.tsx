"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Pill, FlaskConical, Heart, AlertCircle, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbOverride } from "@/lib/breadcrumb-context";

interface Patient {
  id: string;
  uhid: string;
  abhaId: string | null;
  status: string;
  profile: {
    fullName: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup: string | null;
    mobileNumber: string | null;
    email: string | null;
    address: any;
  } | null;
  encounters: {
    id: string;
    status: string;
    chiefComplaint: string | null;
    createdAt: string;
  }[];
  prescriptions: {
    id: string;
    status: string;
    prescribedAt: string;
    items: {
      id: string;
      medication: { genericName: string };
      dose: number;
      doseUnit: string;
      route: string;
      frequency: string;
    }[];
  }[];
  labOrders: {
    id: string;
    status: string;
    priority: string;
    createdAt: string;
    results: {
      id: string;
      testName: string;
      resultValue: string | null;
      resultUnit: string | null;
      flag: string | null;
    }[];
  }[];
}

export default function PatientProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"encounters" | "prescriptions" | "labs">("encounters");

  // Fetch patient full records from patient profile API
  const { data: patientData, isLoading, isError } = useQuery({
    queryKey: ["patients", id],
    queryFn: () => apiClient.get<{ data: Patient }>(`/patients/${id}`),
  });

  const patient = patientData?.data;

  // Set breadcrumb label to patient name instead of UUID
  useBreadcrumbOverride(
    id as string,
    patient?.profile?.fullName || undefined
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-text-primary">Patient Profile Not Found</h3>
        <p className="text-text-secondary mt-1">This record does not exist or has been deleted.</p>
        <button onClick={() => router.back()} className="mt-4 text-clinical hover:underline text-sm font-semibold flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>
      </div>
    );
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const age = patient.profile?.dateOfBirth ? calculateAge(patient.profile.dateOfBirth) : "N/A";

  return (
    <div className="flex flex-col gap-6">
      {/* Back to List */}
      <div>
        <button
          onClick={() => router.push("/d/patients")}
          className="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Patient Records</span>
        </button>
      </div>

      {/* Demographics Card */}
      <Card className="p-6 bg-bg-surface border-border flex flex-col md:flex-row justify-between gap-6">
        <div className="flex gap-4 items-start">
          <div className="w-16 h-16 rounded-full bg-clinical/10 text-clinical text-xl font-bold flex items-center justify-center">
            {patient.profile?.fullName
              ? patient.profile.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : "P"}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {patient.profile?.fullName || "Patient Profile"}
            </h2>
            <p className="text-xs text-text-secondary mt-1 font-semibold">
              UHID: {patient.uhid} {patient.abhaId && `· ABHA ID: ${patient.abhaId}`}
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              {age} yrs · {patient.profile?.gender || "N/A"} · Blood: {patient.profile?.bloodGroup || "N/A"}
            </p>
          </div>
        </div>

        <div className="text-left md:text-right text-xs text-text-secondary flex flex-col gap-1 justify-center">
          <p>
            <span className="font-semibold text-text-primary">Email: </span>
            {patient.profile?.email || "—"}
          </p>
          <p>
            <span className="font-semibold text-text-primary">Phone: </span>
            {patient.profile?.mobileNumber || "—"}
          </p>
          {patient.profile?.address && (
            <p>
              <span className="font-semibold text-text-primary">Location: </span>
              {patient.profile.address.city || "—"}, {patient.profile.address.state || "—"}
            </p>
          )}
        </div>
      </Card>

      {/* Tab Selector */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("encounters")}
          className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "encounters"
              ? "border-b-2 border-clinical text-clinical"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Encounters ({patient.encounters?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab("prescriptions")}
          className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "prescriptions"
              ? "border-b-2 border-clinical text-clinical"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Prescriptions ({patient.prescriptions?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab("labs")}
          className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "labs"
              ? "border-b-2 border-clinical text-clinical"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Lab Results ({patient.labOrders?.length || 0})</span>
        </button>
      </div>

      {/* Tab Content */}
      <Card className="p-6 bg-bg-surface border-border">
        {activeTab === "encounters" && (
          <div className="flex flex-col gap-4">
            {patient.encounters?.map((enc) => {
              const encDate = new Date(enc.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <div
                  key={enc.id}
                  onClick={() => router.push(`/d/encounters/${enc.id}`)}
                  className="p-4 rounded-lg bg-bg-subtle/20 border border-border hover:border-border-strong cursor-pointer transition-colors flex justify-between items-center"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      {enc.chiefComplaint || "Routine Consultation"}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">Visit Date: {encDate}</p>
                  </div>
                  <Badge variant={enc.status === "finalized" ? "success" : "warning"}>
                    {enc.status.replace("_", " ")}
                  </Badge>
                </div>
              );
            })}
            {(!patient.encounters || patient.encounters.length === 0) && (
              <p className="text-center py-6 text-sm text-text-secondary">No encounters on file.</p>
            )}
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div className="flex flex-col gap-4">
            {patient.prescriptions?.map((rx) => {
              const rxDate = new Date(rx.prescribedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <div key={rx.id} className="p-4 rounded-lg bg-bg-subtle/20 border border-border flex flex-col gap-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <span className="font-semibold text-sm text-brand-primary">Rx Order #{rx.id.slice(0, 8)}</span>
                    <span className="text-xs text-text-secondary">{rxDate}</span>
                  </div>
                  <div className="divide-y divide-border/20">
                    {rx.items.map((item) => (
                      <div key={item.id} className="py-2 flex justify-between text-xs text-text-primary">
                        <span>{item.medication.genericName}</span>
                        <span>
                          {item.dose} {item.doseUnit} · {item.route.toUpperCase()} · {item.frequency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {(!patient.prescriptions || patient.prescriptions.length === 0) && (
              <p className="text-center py-6 text-sm text-text-secondary">No prescriptions issued.</p>
            )}
          </div>
        )}

        {activeTab === "labs" && (
          <div className="flex flex-col gap-4">
            {patient.labOrders?.map((order) => {
              const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <div key={order.id} className="p-4 rounded-lg bg-bg-subtle/20 border border-border flex flex-col gap-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <span className="font-semibold text-sm text-brand-primary">Lab Order #{order.id.slice(0, 8)}</span>
                    <span className="text-xs text-text-secondary">{orderDate}</span>
                  </div>
                  <div className="divide-y divide-border/20">
                    {order.results?.map((res) => (
                      <div key={res.id} className="py-2 flex justify-between text-xs text-text-primary">
                        <span>{res.testName}</span>
                        <span className="font-semibold">
                          {res.resultValue ? `${res.resultValue} ${res.resultUnit || ""}` : "Pending Result"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {(!patient.labOrders || patient.labOrders.length === 0) && (
              <p className="text-center py-6 text-sm text-text-secondary">No laboratory orders on file.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
