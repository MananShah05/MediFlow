"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Pill } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

interface PrescriptionItem {
  id: string;
  medication: { genericName: string };
  dose: number;
  doseUnit: string;
  route: string;
  frequency: string;
}

interface Prescription {
  id: string;
  status: string;
  prescribedAt: string;
  patient: {
    profile: {
      fullName: string;
    } | null;
  };
  items: PrescriptionItem[];
}

export default function PrescriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: prescriptionsData, isLoading } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: () => apiClient.get<{ data: Prescription[] }>("/prescriptions?limit=50"),
  });

  const prescriptions = prescriptionsData?.data || [];

  const filteredPrescriptions = prescriptions.filter((p) =>
    p.patient.profile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-bg-elevated border border-border rounded-xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Prescriptions</h2>
          <p className="text-text-secondary mt-1">Issue, sign, and archive patient prescriptions.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-bg-elevated p-4 border border-border rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search prescriptions by patient name..."
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
          ) : filteredPrescriptions.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-sm">
              No prescriptions found.
            </div>
          ) : (
            filteredPrescriptions.map((p) => {
              const formattedDate = new Date(p.prescribedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-bg-subtle/30 border border-border hover:border-border-strong transition-colors gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-clinical/10 text-clinical mt-0.5">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-text-primary">
                          {p.patient.profile?.fullName || "Unknown Patient"}
                        </h4>
                        <span className="text-xs text-text-secondary">•</span>
                        <span className="text-xs font-semibold text-text-secondary">{formattedDate}</span>
                      </div>
                      <div className="flex flex-col gap-1 mt-2">
                        {p.items.map((item) => (
                          <span key={item.id} className="text-xs text-text-secondary font-medium">
                            • {item.medication.genericName} - {item.dose} {item.doseUnit} ({item.route.toUpperCase()}, {item.frequency})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Badge variant={p.status === "active" ? "success" : "critical"}>
                      {p.status}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
