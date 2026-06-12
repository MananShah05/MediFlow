"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { mediflowToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import {
  BedDouble,
  AlertCircle,
  RefreshCw,
  Plus,
  Search,
  Building2,
  DoorOpen,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Wrench,
} from "lucide-react";

interface Bed {
  id: string;
  bedNumber: string;
  status: string;
  bedType: string;
}

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  beds: Bed[];
}

interface Ward {
  id: string;
  name: string;
  code: string;
  type: string;
  capacity: number;
  departmentName: string | null;
  totalBeds: number;
  occupiedBeds: number;
  rooms: Room[];
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  available: { color: "bg-success/15 text-success border-success/30", icon: <CheckCircle2 className="w-3 h-3" />, label: "Available" },
  occupied: { color: "bg-clinical/15 text-clinical border-clinical/30", icon: <Users className="w-3 h-3" />, label: "Occupied" },
  reserved: { color: "bg-warning/15 text-warning border-warning/30", icon: <Clock className="w-3 h-3" />, label: "Reserved" },
  maintenance: { color: "bg-text-tertiary/15 text-text-tertiary border-text-tertiary/30", icon: <Wrench className="w-3 h-3" />, label: "Maintenance" },
  blocked: { color: "bg-critical/15 text-critical border-critical/30", icon: <XCircle className="w-3 h-3" />, label: "Blocked" },
};

export default function BedsAndWardsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  const { data: wardData, isLoading, isError, refetch, isRefetching } = useQuery<{ data: Ward[] }>({
    queryKey: ["admin", "wards"],
    queryFn: () => apiClient.get<{ data: Ward[] }>("/admin/wards"),
  });

  const wards = wardData?.data || [];

  const filteredWards = wards.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.departmentName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBeds = wards.reduce((sum, w) => sum + w.totalBeds, 0);
  const totalOccupied = wards.reduce((sum, w) => sum + w.occupiedBeds, 0);
  const totalAvailable = totalBeds - totalOccupied;
  const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 border-dashed border-2">
        <div className="p-3 bg-destructive/10 rounded-full text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Beds & Wards</h3>
          <p className="text-sm text-text-secondary mt-1">Please try refreshing the page.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <BedDouble className="w-6 h-6 text-role-admin" />
            Beds & Wards Management
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time bed census, ward occupancy, and room configuration across the facility.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2 rounded-lg bg-bg-muted hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-border transition-all"
          title="Refresh ward data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3 shadow-sm border-l-4 border-l-role-admin">
          <div className="p-2 rounded-lg bg-role-admin/10 text-role-admin">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Total Wards</p>
            <p className="text-lg font-bold text-text-primary font-data">{wards.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 shadow-sm border-l-4 border-l-clinical">
          <div className="p-2 rounded-lg bg-clinical/10 text-clinical">
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Total Beds</p>
            <p className="text-lg font-bold text-text-primary font-data">{totalBeds}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 shadow-sm border-l-4 border-l-success">
          <div className="p-2 rounded-lg bg-success/10 text-success">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Available</p>
            <p className="text-lg font-bold text-text-primary font-data">{totalAvailable}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 shadow-sm border-l-4 border-l-warning">
          <div className="p-2 rounded-lg bg-warning/10 text-warning">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Occupancy Rate</p>
            <p className="text-lg font-bold text-text-primary font-data">{occupancyRate}%</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search wards by name, code, or department..."
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-muted text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-admin"
        />
      </div>

      {/* Ward Grid */}
      {filteredWards.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <p className="text-text-secondary text-sm">No wards match your search criteria.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredWards.map((ward) => {
            const wardOccupancy = ward.totalBeds > 0 ? Math.round((ward.occupiedBeds / ward.totalBeds) * 100) : 0;
            return (
              <Card
                key={ward.id}
                className="p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-l-role-admin/50 hover:border-l-role-admin"
                onClick={() => setSelectedWard(ward)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{ward.name}</h3>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      {ward.code} · {ward.type} · {ward.departmentName || "No Department"}
                    </p>
                  </div>
                  <Badge
                    variant={wardOccupancy > 85 ? "critical" : wardOccupancy > 60 ? "warning" : "success"}
                    className="text-[10px] font-bold"
                  >
                    {wardOccupancy}% Full
                  </Badge>
                </div>

                <div className="w-full bg-bg-surface rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      wardOccupancy > 85 ? "bg-critical" : wardOccupancy > 60 ? "bg-warning" : "bg-success"
                    }`}
                    style={{ width: `${wardOccupancy}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-3 h-3" />
                    {ward.occupiedBeds}/{ward.totalBeds} Beds
                  </span>
                  <span className="flex items-center gap-1">
                    <DoorOpen className="w-3 h-3" />
                    {ward.rooms.length} Rooms
                  </span>
                  <span>Cap: {ward.capacity}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Ward Detail Modal */}
      <Modal
        isOpen={!!selectedWard}
        onClose={() => setSelectedWard(null)}
        title={selectedWard?.name || "Ward Details"}
        description={`${selectedWard?.code} · ${selectedWard?.type} · ${selectedWard?.departmentName || "No Department"}`}
      >
        {selectedWard && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-bg-muted">
                <p className="text-lg font-bold text-text-primary font-data">{selectedWard.totalBeds}</p>
                <p className="text-[10px] text-text-secondary">Total Beds</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-clinical/10">
                <p className="text-lg font-bold text-clinical font-data">{selectedWard.occupiedBeds}</p>
                <p className="text-[10px] text-text-secondary">Occupied</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-success/10">
                <p className="text-lg font-bold text-success font-data">{selectedWard.totalBeds - selectedWard.occupiedBeds}</p>
                <p className="text-[10px] text-text-secondary">Available</p>
              </div>
            </div>

            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mt-2">Rooms & Beds</h4>
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
              {selectedWard.rooms.map((room) => (
                <div key={room.id} className="border border-border rounded-lg p-3 bg-bg-muted">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1">
                      <DoorOpen className="w-3.5 h-3.5 text-text-secondary" />
                      Room {room.roomNumber}
                    </span>
                    <span className="text-[10px] text-text-tertiary">{room.roomType} · Cap: {room.capacity}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {room.beds.map((bed) => {
                      const cfg = STATUS_CONFIG[bed.status] || STATUS_CONFIG.available;
                      return (
                        <div
                          key={bed.id}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-medium ${cfg.color}`}
                          title={`${bed.bedNumber} — ${cfg.label} (${bed.bedType})`}
                        >
                          {cfg.icon}
                          <span>{bed.bedNumber}</span>
                        </div>
                      );
                    })}
                    {room.beds.length === 0 && (
                      <span className="text-[10px] text-text-tertiary italic">No beds configured</span>
                    )}
                  </div>
                </div>
              ))}
              {selectedWard.rooms.length === 0 && (
                <p className="text-sm text-text-tertiary text-center py-4">No rooms configured in this ward.</p>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-border-subtle">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} className={`flex items-center gap-1 text-[10px] font-medium ${cfg.color} px-2 py-0.5 rounded-md border`}>
                  {cfg.icon}
                  {cfg.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
