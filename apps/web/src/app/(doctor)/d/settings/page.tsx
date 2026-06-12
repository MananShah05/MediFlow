"use client";

import React from "react";
import { useAuthStore } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Bell, Key } from "lucide-react";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-bg-elevated border border-border rounded-xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Settings</h2>
          <p className="text-text-secondary mt-1">Manage portal preferences, security credentials, and MFA setup.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Details */}
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-clinical/10 text-clinical">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">Profile Info</h3>
          </div>
          <div className="flex flex-col gap-3 text-sm mt-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-text-tertiary">Full Name</span>
              <span className="font-semibold text-text-primary">Dr. {user?.firstName} {user?.lastName}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-text-tertiary">Email Address</span>
              <span className="text-text-secondary">{user?.email}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-text-tertiary">Role</span>
              <span className="text-text-secondary capitalize">{user?.role}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-text-tertiary">Tenant ID</span>
              <span className="font-data text-text-secondary">{user?.tenantId}</span>
            </div>
          </div>
        </Card>

        {/* Security & MFA */}
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-clinical/10 text-clinical">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">Security</h3>
          </div>
          <div className="flex flex-col gap-3 text-sm mt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-muted border border-border-subtle">
              <div>
                <h4 className="font-semibold text-text-primary">Two-Factor Auth (MFA)</h4>
                <p className="text-xs text-text-tertiary mt-0.5">Required for clinical staff access</p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-muted border border-border-subtle">
              <div>
                <h4 className="font-semibold text-text-primary">Passkey Login</h4>
                <p className="text-xs text-text-tertiary mt-0.5">Phishing-resistant WebAuthn</p>
              </div>
              <Badge variant="info">Setup Now</Badge>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-clinical/10 text-clinical">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">Notifications</h3>
          </div>
          <div className="flex flex-col gap-3 text-sm mt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border text-clinical focus:ring-clinical" />
              <span className="text-text-secondary">Email alerts on new lab results</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border text-clinical focus:ring-clinical" />
              <span className="text-text-secondary">SMS alerts on critical vital flags</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border text-clinical focus:ring-clinical" />
              <span className="text-text-secondary">Daily shift overview digest</span>
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
}
