"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TenantItem } from "@/types/tenant";
import { tenantService } from "@/services/tenant.service";
import { useToast } from "@/context/toast-context";
import { extractErrorMessage } from "@/services/api";

const tenantSchema = z.object({
  tenant_name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be 100 characters or fewer")
    .transform((v) => v.trim())
    .refine((v) => v.length >= 2, "Business name must have at least 2 characters"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface TenantEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: TenantItem | null;
  onSuccess: (updated: TenantItem) => void;
}

export function TenantEditDialog({
  isOpen,
  onClose,
  tenant,
  onSuccess,
}: TenantEditDialogProps) {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      tenant_name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (tenant) {
      reset({
        tenant_name: tenant.tenant_name,
        description: tenant.description || "",
      });
    }
  }, [tenant, reset, isOpen]);

  const onSubmit = async (data: TenantFormData) => {
    if (!tenant) return;
    try {
      const updated = await tenantService.updateTenant(tenant.tenant_id, {
        tenant_name: data.tenant_name,
        description: data.description ? data.description.trim() : null,
      });
      toast.success(
        `Business "${updated.tenant_name}" details updated.`,
        "Tenant Updated"
      );
      onSuccess(updated);
      onClose();
    } catch (err) {
      const msg = extractErrorMessage(err);
      toast.error(msg, "Update Failed");
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Business / Tenant"
      description="Update your business organization's registered legal or trading name."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <Input
          label="Business / Tenant Name"
          placeholder="e.g. Food House Group"
          required
          error={errors.tenant_name?.message}
          {...register("tenant_name")}
        />

        <div className="w-full space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Hospitality conglomerate operating multi-cuisine food brands."
            className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-rose-600 font-medium">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

