"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FlaskConical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

interface LabResult {
  id: string;
  testName: string;
  resultValue: string | null;
  resultUnit: string | null;
}

interface LabOrder {
  id: string;
  status: string;
  priority: string;
  createdAt: string;
  patient: {
    profile: {
      fullName: string;
    } | null;
  };
  results: LabResult[];
}

export default function LabOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: labOrdersData, isLoading } = useQuery({
    queryKey: ["lab-orders"],
    queryFn: () => apiClient.get<{ data: LabOrder[] }>("/lab-orders?limit=50"),
  });

  const labOrders = labOrdersData?.data || [];

  const filteredOrders = labOrders.filter((o) =>
    o.patient.profile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-bg-elevated border border-border rounded-xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Laboratory Orders</h2>
          <p className="text-text-secondary mt-1">Order tests, track specimen processing, and review clinical results.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-bg-elevated p-4 border border-border rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search lab orders by patient name..."
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
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-sm">
              No lab orders found.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              const testsOrdered = order.results.map((r) => r.testName).join(", ");

              return (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-bg-subtle/30 border border-border hover:border-border-strong transition-colors gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-clinical/10 text-clinical mt-0.5">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-text-primary">
                          {order.patient.profile?.fullName || "Unknown Patient"}
                        </h4>
                        <span className="text-xs text-text-secondary">•</span>
                        <span className="text-xs font-semibold text-text-secondary">{formattedDate}</span>
                        <span className="text-xs text-text-secondary">•</span>
                        <Badge variant={order.priority === "stat" ? "critical" : "info"}>
                          {order.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary mt-2">
                        <span className="font-semibold text-text-primary">Tests: </span>
                        {testsOrdered || "No tests listed."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Badge
                      variant={
                        order.status === "resulted" || order.status === "reviewed"
                          ? "success"
                          : order.status === "processing" || order.status === "specimen_collected"
                          ? "warning"
                          : "info"
                      }
                    >
                      {order.status.replace("_", " ")}
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
