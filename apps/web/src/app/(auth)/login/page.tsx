"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  const login = useAuthStore((s) => s.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setGeneralError(null);
    try {
      await login(values.email, values.password);
      
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error("User state not initialized after login");
      }

      const redirectTo = searchParams.get("redirect");
      if (redirectTo?.startsWith("/") && !redirectTo.startsWith("//")) {
        router.replace(redirectTo);
        return;
      }

      // Redirect based on role
      switch (user.role) {
        case "patient":
          router.replace("/p/dashboard");
          break;
        case "doctor":
          router.replace("/d/dashboard");
          break;
        case "nurse":
          router.replace("/n/dashboard");
          break;
        case "admin":
          router.replace("/a/dashboard");
          break;
        case "super_admin":
          router.replace("/sa/dashboard");
          break;
        default:
          router.replace("/login");
          break;
      }
    } catch (err: any) {
      setGeneralError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-elevated/70 backdrop-blur-xl border border-border rounded-xl p-8 shadow-2xl flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <div className="mx-auto w-12 h-12 rounded-lg bg-clinical flex items-center justify-center text-text-inverse font-bold text-xl">
          C
        </div>
        <h2 className="text-2xl font-semibold text-text-primary tracking-tight mt-2">
          Welcome to CareOS
        </h2>
        <p className="text-sm text-text-secondary">
          Enter your credentials to access the hospital management portal
        </p>
      </div>

      {generalError && (
        <div className="bg-critical-muted border border-critical text-critical-text text-sm rounded-md p-3 flex items-start gap-2" role="alert">
          <span className="font-bold">⚠</span>
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@hospital.com"
          error={errors.email?.message}
          required
          disabled={loading}
          {...register("email")}
        />

        <div className="flex flex-col gap-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            required
            disabled={loading}
            {...register("password")}
          />
          <div className="flex justify-end mt-1">
            <Link
              href="/forgot-password"
              className="text-xs text-clinical hover:text-clinical-hover hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full mt-2" loading={loading}>
          Log in
        </Button>
      </form>

      <div className="text-center text-xs text-text-tertiary">
        Don&apos;t have an account? Contact your administrator or{" "}
        <Link href="/register" className="text-clinical hover:underline font-medium">
          Register self
        </Link>
      </div>
    </div>
  );
}
