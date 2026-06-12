"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface Patient {
  id: string;
  uhid: string;
  abhaId: string | null;
  status: string;
  registrationDate: string;
  profile: {
    fullName: string;
    gender: string;
    dateOfBirth: string;
    mobileNumber: string | null;
  } | null;
}

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Fetch patients list
  const { data: patientsData, isLoading } = useQuery({
    queryKey: ["patients", searchQuery],
    queryFn: () => apiClient.get<{ data: Patient[] }>(`/patients?search=${searchQuery}&limit=50`),
  });

  const patients = patientsData?.data || [];

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-bg-elevated border border-border rounded-xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">My Patients</h2>
          <p className="text-text-secondary mt-1">Access patient profiles, clinical history, and admission details.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-bg-elevated p-4 border border-border rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by patient name, UHID..."
            className="w-full h-10 pl-10 pr-4 rounded-md border border-border bg-bg-muted text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-clinical text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-6 bg-bg-surface border-border">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary font-medium">
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">UHID</th>
                <th className="py-3 px-4">Demographics</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-4">
                    <Skeleton className="h-10 w-full mb-2" />
                    <Skeleton className="h-10 w-full mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-secondary">
                    No patients found matching your search.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => {
                  const age = patient.profile?.dateOfBirth ? calculateAge(patient.profile.dateOfBirth) : "N/A";
                  const nameInitials = patient.profile?.fullName
                    ? patient.profile.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "P";

                  return (
                    <tr key={patient.id} className="hover:bg-bg-subtle/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-text-primary flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-clinical/10 text-clinical flex items-center justify-center text-xs font-bold">
                          {nameInitials}
                        </div>
                        {patient.profile?.fullName || "Unknown Patient"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-text-secondary">{patient.uhid}</td>
                      <td className="py-3 px-4 text-text-secondary">
                        {age} yrs · {patient.profile?.gender || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={patient.status === "active" ? "success" : "critical"}>
                          {patient.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => router.push(`/d/patients/${patient.id}`)}
                          className="h-8 px-3 rounded-md bg-clinical text-text-inverse hover:bg-clinical-hover transition-colors text-xs font-semibold"
                        >
                          View Records
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
