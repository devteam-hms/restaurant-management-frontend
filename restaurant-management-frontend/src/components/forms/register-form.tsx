"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, User, Mail, Lock, Store, ArrowRight, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { extractErrorMessage } from "@/services/api";

const registerSchema = z
  .object({
    tenant_name: z
      .string()
      .min(2, "Business / Tenant name must have at least 2 characters")
      .max(100, "Business name cannot exceed 100 characters")
      .transform((v) => v.trim())
      .refine((v) => v.length >= 2, "Tenant name cannot be whitespace only"),
    first_name: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name cannot exceed 50 characters")
      .transform((v) => v.trim()),
    last_name: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name cannot exceed 50 characters")
      .transform((v) => v.trim()),
    email: z
      .string()
      .email("Please enter a valid email address")
      .transform((v) => v.trim().toLowerCase()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password cannot exceed 128 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { registerAndLogin } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tenant_name: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerAndLogin({
        tenant_name: data.tenant_name,
        owner: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          password: data.password,
        },
      });
    } catch (err) {
      const msg = extractErrorMessage(err);
      setServerError(msg);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 mb-4">
          <Store className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Create Restaurant Group
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Register your business tenant and initial owner account to get started.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-900/5">
        {serverError && (
          <Alert variant="destructive" className="mb-6">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Section: Business Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Business Organization
              </span>
            </div>

            <Input
              label="Business / Tenant Name"
              placeholder="e.g. Food House Group"
              required
              helperText="The corporate or group name for your restaurant chain"
              error={errors.tenant_name?.message}
              {...register("tenant_name")}
            />
          </div>

          {/* Section: Owner Information */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Owner Account Details
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="e.g. John"
                required
                error={errors.first_name?.message}
                {...register("first_name")}
              />
              <Input
                label="Last Name"
                placeholder="e.g. Doe"
                required
                error={errors.last_name?.message}
                {...register("last_name")}
              />
            </div>

            <Input
              label="Business Email"
              type="email"
              placeholder="e.g. owner@foodhouse.com"
              required
              helperText="Used for Keycloak sign-in and tenant administration"
              error={errors.email?.message}
              {...register("email")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                required
                helperText="Minimum 8 characters"
                error={errors.password?.message}
                {...register("password")}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                required
                error={errors.confirm_password?.message}
                {...register("confirm_password")}
              />
            </div>
          </div>

          <div className="pt-3">
            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold gap-2"
              isLoading={isSubmitting}
              loadingText="Registering Tenant & Logging In..."
            >
              <span>Register & Launch Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Already have an existing restaurant account?{" "}
              <a
                href="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Sign In
              </a>
            </p>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Protected with Keycloak OAuth2 / OpenID Connect & RBAC</span>
      </div>
    </div>
  );
}

