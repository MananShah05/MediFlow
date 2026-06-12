"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  return (
    <div className="bg-bg-elevated/70 backdrop-blur-xl border border-border rounded-xl p-8 shadow-2xl flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
          Reset Password
        </h2>
        <p className="text-sm text-text-secondary">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <Input
          label="Email Address"
          type="email"
          placeholder="name@hospital.com"
          required
        />

        <Button type="submit" variant="primary" size="lg" className="w-full mt-2">
          Send Reset Link
        </Button>
      </form>

      <div className="text-center text-sm text-text-tertiary">
        Remember your password?{" "}
        <Link href="/login" className="text-clinical hover:underline font-medium">
          Log in
        </Link>
      </div>
    </div>
  );
}
