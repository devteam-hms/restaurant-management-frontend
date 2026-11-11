"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Store, ArrowRight, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { extractErrorMessage } from "@/services/api";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email or username is required")
    .transform((v) => v.trim()),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login({
        email: data.email,
        password: data.password,
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
          RMS Admin Portal
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Sign in to manage restaurants, branches, and operational workflows.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-900/5">
        {serverError && (
          <Alert variant="destructive" className="mb-6">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email or Username"
            type="text"
            placeholder="owner@example.com"
            required
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            required
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold gap-2"
              isLoading={isSubmitting}
              loadingText="Authenticating via Keycloak..."
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-center pt-3 border-t border-slate-100 mt-4">
            <p className="text-xs text-slate-500">
              Need to register a new restaurant business?{" "}
              <a
                href="/register"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Register Business
              </a>
            </p>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Enterprise Keycloak Authentication & Tenant RBAC</span>
      </div>
    </div>
  );
}

