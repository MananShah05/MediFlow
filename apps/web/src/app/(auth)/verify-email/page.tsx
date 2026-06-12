"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="bg-bg-elevated/70 backdrop-blur-xl border border-border rounded-xl p-8 shadow-2xl flex flex-col gap-6 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
          Verify Email
        </h2>
        <p className="text-sm text-text-secondary">
          We have sent a verification code to your email address. Please click the link in that email to verify your identity.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Button variant="secondary" size="lg" className="w-full">
          Resend Verification Email
        </Button>

        <div className="text-sm text-text-tertiary">
          Return to{" "}
          <Link href="/login" className="text-clinical hover:underline font-medium">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
