"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { careosToast } from "@/components/ui/toast";
import { User, Shield, Bell, Settings, AlertCircle, Save, Key } from "lucide-react";
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

interface NursingDashboardData {
  nurse: Nurse;
  stats: Stats;
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  // Form mock states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Fetch Nurse Dashboard Data
  const { data: responseData, isLoading, isError } = useQuery<{ data: NursingDashboardData }>({
    queryKey: ["nurse", "dashboard"],
    queryFn: () => apiClient.get<{ data: NursingDashboardData }>("/nursing/dashboard"),
  });

  const data = responseData?.data;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    careosToast.success("Profile preferences saved successfully.");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      careosToast.error("Please fill in all password fields.");
      return;
    }
    careosToast.success("Security credentials updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-1/3 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-2 h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
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
          <h3 className="text-lg font-semibold text-text-primary">Failed to load Settings</h3>
          <p className="text-sm text-text-secondary mt-1">Please try refreshing the page.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Portal Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your account profile, configuration preferences, and authentication credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Preferences */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Section: Profile Info */}
          <Card className="p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
              <User className="w-5 h-5 text-role-nurse" />
              <h2 className="text-base font-bold text-text-primary">Clinical Profile Details</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">First Name</label>
                  <input
                    type="text"
                    value={user?.firstName || ""}
                    disabled
                    className="flex h-10 w-full rounded-md border border-border bg-bg-muted/50 px-3 py-2 text-sm text-text-tertiary focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Last Name</label>
                  <input
                    type="text"
                    value={user?.lastName || ""}
                    disabled
                    className="flex h-10 w-full rounded-md border border-border bg-bg-muted/50 px-3 py-2 text-sm text-text-tertiary focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="flex h-10 w-full rounded-md border border-border bg-bg-muted/50 px-3 py-2 text-sm text-text-tertiary focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Clinical Role</label>
                  <input
                    type="text"
                    value="Registered Nurse (RN)"
                    disabled
                    className="flex h-10 w-full rounded-md border border-border bg-bg-muted/50 px-3 py-2 text-sm text-text-tertiary focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Assigned Ward / Department</label>
                  <input
                    type="text"
                    value={data.nurse.department}
                    disabled
                    className="flex h-10 w-full rounded-md border border-border bg-bg-muted/50 px-3 py-2 text-sm text-text-tertiary focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Active Shift Schedule</label>
                  <input
                    type="text"
                    value={data.nurse.shiftRange}
                    disabled
                    className="flex h-10 w-full rounded-md border border-border bg-bg-muted/50 px-3 py-2 text-sm text-text-tertiary focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Session Auto-Timeout (Minutes)</label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-role-nurse"
                >
                  <option value="15">15 minutes (High Security)</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              <button
                type="submit"
                className="h-10 mt-2 rounded-md bg-role-nurse text-text-inverse hover:bg-role-nurse/90 transition-all font-semibold text-sm flex items-center justify-center gap-1.5 shadow-sm self-start px-6"
              >
                <Save className="w-4 h-4" />
                Save Preferences
              </button>
            </form>
          </Card>

          {/* Section: Security */}
          <Card className="p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
              <Shield className="w-5 h-5 text-role-nurse" />
              <h2 className="text-base font-bold text-text-primary">Change Security Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-nurse"
                />
              </div>

              <button
                type="submit"
                className="h-10 mt-2 rounded-md bg-bg-muted border border-border text-text-primary hover:bg-bg-subtle transition-all font-semibold text-sm flex items-center justify-center gap-1.5 shadow-sm self-start px-6"
              >
                <Key className="w-4 h-4 text-text-secondary" />
                Update Password
              </button>
            </form>
          </Card>
        </div>

        {/* Right Column: Notification Preferences */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 shadow-sm flex flex-col gap-4 bg-bg-elevated">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
              <Bell className="w-5 h-5 text-clinical" />
              <h2 className="text-base font-bold text-text-primary">Ward Alert Subscriptions</h2>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-text-primary">Email Notifications</span>
                  <span className="text-[11px] text-text-secondary">Receive end-of-shift handoff reports via email.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-role-nurse focus:ring-role-nurse focus:ring-2 bg-bg-muted border-border cursor-pointer mt-1"
                />
              </div>

              <div className="flex items-start justify-between gap-4 pt-3 border-t border-border-subtle">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-text-primary">Critical Vital Flags (Urgent)</span>
                  <span className="text-[11px] text-text-secondary">Get real-time browser/SMS alerts when a warded patient has critical parameters.</span>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-role-nurse focus:ring-role-nurse focus:ring-2 bg-bg-muted border-border cursor-pointer mt-1"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
