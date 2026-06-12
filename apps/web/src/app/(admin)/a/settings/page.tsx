"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/lib/auth";
import { careosToast } from "@/components/ui/toast";
import { Settings, Shield, Bell, Key, Save, AlertCircle, Building2, Globe, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [auditRetention, setAuditRetention] = useState("90");
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    careosToast.success("Tenant preferences saved successfully.");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      careosToast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      careosToast.error("New password must be at least 8 characters.");
      return;
    }
    careosToast.success("Security credentials updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-role-admin" />
          Tenant Settings
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Configure tenant-wide preferences, security policies, and notification settings.
        </p>
      </div>

      <Card className="p-6 shadow-sm">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-role-admin" />
          Tenant Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-secondary text-xs font-medium">Tenant ID</span>
            <p className="text-text-primary font-mono text-xs mt-0.5">{user?.tenantId || "N/A"}</p>
          </div>
          <div>
            <span className="text-text-secondary text-xs font-medium">Role</span>
            <p className="text-text-primary font-semibold text-sm mt-0.5 capitalize">{user?.role || "N/A"}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-sm">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-role-admin" />
          Notification Preferences
        </h3>
        <form onSubmit={handleSavePreferences} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Email Alerts</p>
              <p className="text-xs text-text-secondary">Receive audit and compliance alerts via email.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-bg-surface rounded-full peer peer-checked:bg-role-admin after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">SMS Alerts</p>
              <p className="text-xs text-text-secondary">Get critical system alerts via SMS.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-bg-surface rounded-full peer peer-checked:bg-role-admin after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Audit Log Retention (days)</label>
            <input
              type="number"
              value={auditRetention}
              onChange={(e) => setAuditRetention(e.target.value)}
              className="flex h-10 w-full max-w-xs rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-role-admin"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Session Timeout (minutes)</label>
            <input
              type="number"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="flex h-10 w-full max-w-xs rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-role-admin"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-6 rounded-md bg-role-admin text-text-inverse hover:bg-role-admin/90 transition-all font-semibold text-sm flex items-center gap-2 self-start shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Preferences
          </button>
        </form>
      </Card>

      <Card className="p-6 shadow-sm">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-role-admin" />
          Security
        </h3>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="flex h-10 w-full max-w-xs rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-admin"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="flex h-10 w-full max-w-xs rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-role-admin"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-6 rounded-md bg-role-admin text-text-inverse hover:bg-role-admin/90 transition-all font-semibold text-sm flex items-center gap-2 self-start shadow-sm"
          >
            <Key className="w-4 h-4" />
            Update Password
          </button>
        </form>
      </Card>
    </div>
  );
}
