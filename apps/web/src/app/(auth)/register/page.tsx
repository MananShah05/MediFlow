"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore, type RegisterPatientBody } from "@/lib/auth";
import { cn } from "@/lib/utils";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required").max(200),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    mobileNumber: optionalText,
    bloodGroup: z
      .enum([
        "A_positive",
        "A_negative",
        "B_positive",
        "B_negative",
        "AB_positive",
        "AB_negative",
        "O_positive",
        "O_negative",
        "",
      ])
      .transform((value) => (value === "" ? undefined : value)),
    city: optionalText,
    state: optionalText,
    pincode: optionalText,
    emergencyContactName: optionalText,
    emergencyContactRelation: optionalText,
    emergencyContactPhone: optionalText,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.input<typeof registerSchema>;

const fieldClassName =
  "flex h-10 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-base text-text-primary outline-none transition-colors duration-fast focus:border-clinical focus:ring-2 focus:ring-clinical/20 disabled:cursor-not-allowed disabled:opacity-40";

export default function RegisterPage() {
  const router = useRouter();
  const registerPatient = useAuthStore((s) => s.registerPatient);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      gender: "male",
      email: "",
      password: "",
      confirmPassword: "",
      mobileNumber: "",
      bloodGroup: "",
      city: "",
      state: "",
      pincode: "",
      emergencyContactName: "",
      emergencyContactRelation: "",
      emergencyContactPhone: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    setGeneralError(null);

    try {
      await registerPatient({
        ...values,
        tenantSlug: "cityhospital",
      } as RegisterPatientBody);
      router.replace("/p/dashboard");
    } catch (err: any) {
      setGeneralError(
        err.message || "Unable to register patient. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-elevated/70 backdrop-blur-xl border border-border rounded-xl p-6 shadow-2xl flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
          Patient Registration
        </h2>
        <p className="text-sm text-text-secondary">
          Create your patient portal account and basic hospital profile.
        </p>
      </div>

      {generalError && (
        <div
          className="rounded-md border border-critical bg-critical-muted p-3 text-sm text-critical-text"
          role="alert"
        >
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          placeholder="Steve Rogers"
          error={errors.fullName?.message}
          required
          disabled={loading}
          {...register("fullName")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Date of Birth"
            type="date"
            error={errors.dateOfBirth?.message}
            required
            disabled={loading}
            {...register("dateOfBirth")}
          />

          <div className="flex flex-col gap-[6px]">
            <label className="text-sm font-medium text-text-secondary">
              Gender <span className="ml-[2px] text-critical">*</span>
            </label>
            <select
              className={cn(
                fieldClassName,
                errors.gender && "border-critical focus:border-critical"
              )}
              disabled={loading}
              {...register("gender")}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
            {errors.gender?.message && (
              <p className="text-sm text-critical-text">
                {errors.gender.message}
              </p>
            )}
          </div>
        </div>

        <Input
          label="Email Address"
          type="email"
          placeholder="patient@example.com"
          error={errors.email?.message}
          required
          disabled={loading}
          {...register("email")}
        />

        <Input
          label="Mobile Number"
          type="tel"
          placeholder="+919876543210"
          error={errors.mobileNumber?.message}
          disabled={loading}
          {...register("mobileNumber")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            type="password"
            error={errors.password?.message}
            required
            disabled={loading}
            {...register("password")}
          />
          <Input
            label="Confirm Password"
            type="password"
            error={errors.confirmPassword?.message}
            required
            disabled={loading}
            {...register("confirmPassword")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-[6px]">
            <label className="text-sm font-medium text-text-secondary">
              Blood Group
            </label>
            <select
              className={fieldClassName}
              disabled={loading}
              {...register("bloodGroup")}
            >
              <option value="">Not sure</option>
              <option value="A_positive">A+</option>
              <option value="A_negative">A-</option>
              <option value="B_positive">B+</option>
              <option value="B_negative">B-</option>
              <option value="AB_positive">AB+</option>
              <option value="AB_negative">AB-</option>
              <option value="O_positive">O+</option>
              <option value="O_negative">O-</option>
            </select>
          </div>

          <Input
            label="PIN Code"
            placeholder="560001"
            error={errors.pincode?.message}
            disabled={loading}
            {...register("pincode")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="City"
            placeholder="Bangalore"
            error={errors.city?.message}
            disabled={loading}
            {...register("city")}
          />
          <Input
            label="State"
            placeholder="Karnataka"
            error={errors.state?.message}
            disabled={loading}
            {...register("state")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Emergency Contact"
            placeholder="Peggy Carter"
            error={errors.emergencyContactName?.message}
            disabled={loading}
            {...register("emergencyContactName")}
          />
          <Input
            label="Emergency Phone"
            type="tel"
            placeholder="+919876543211"
            error={errors.emergencyContactPhone?.message}
            disabled={loading}
            {...register("emergencyContactPhone")}
          />
        </div>

        <Input
          label="Emergency Relation"
          placeholder="Spouse, parent, friend"
          error={errors.emergencyContactRelation?.message}
          disabled={loading}
          {...register("emergencyContactRelation")}
        />

        <div className="rounded-md border border-border bg-bg-muted p-3 text-xs leading-5 text-text-secondary">
          By registering, you consent to MediFLOW storing this information for
          hospital registration, appointment, and care management workflows.
        </div>

        <Button type="submit" variant="primary" size="lg" loading={loading}>
          Register as Patient
        </Button>
      </form>

      <div className="text-center text-sm text-text-tertiary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-clinical hover:underline">
          Log in
        </Link>
      </div>
    </div>
  );
}
