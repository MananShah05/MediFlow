"use client";

import React from "react";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card className="p-6">
        <h3 className="font-semibold text-lg">Profile & Preferences</h3>
        <p className="text-sm text-text-secondary mt-2">Update your personal information, notification preferences, and account security settings (TBD).</p>
      </Card>
    </div>
  );
}
