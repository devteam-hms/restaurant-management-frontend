"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BranchItem } from "@/types/branch";
import { branchService } from "@/services/branch.service";
import { useToast } from "@/context/toast-context";
import { extractErrorMessage } from "@/services/api";

const branchSchema = z.object({
  branch_name: z
    .string()
    .min(1, "Branch name is required")
    .max(100, "Branch name must be 100 characters or fewer")
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "Branch name cannot be empty"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(255, "Address must be 255 characters or fewer")
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "Address cannot be empty"),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be 100 characters or fewer")
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "City cannot be empty"),
  state: z
    .string()
    .min(1, "State is required")
    .max(100, "State must be 100 characters or fewer")
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "State cannot be empty"),
  email: z
    .string()
    .email("Enter a valid email address")
    .transform((v) => v.trim().toLowerCase()),
  phone: z
    .string()
    .min(10, "Phone number must have at least 10 digits")
    .max(20, "Phone number cannot exceed 20 characters")
    .regex(
      /^\+?[0-9\s\-()]{10,20}$/,
      "Please enter a valid phone number (10 to 15 digits)"
    )
    .transform((v) => v.trim()),
});

type BranchFormData = z.infer<typeof branchSchema>;

interface BranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName?: string;
  branchToEdit?: BranchItem | null;
  onSuccess: () => void;
}

export function BranchDialog({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  branchToEdit,
  onSuccess,
}: BranchDialogProps) {
  const toast = useToast();
  const isEditing = !!branchToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      branch_name: "",
      address: "",
      city: "",
      state: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (branchToEdit) {
      reset({
        branch_name: branchToEdit.branch_name,
        address: branchToEdit.address,
        city: branchToEdit.city,
        state: branchToEdit.state,
        email: branchToEdit.email,
        phone: branchToEdit.phone || "",
      });
    } else {
      reset({
        branch_name: "",
        address: "",
        city: "",
        state: "",
        email: "",
        phone: "",
      });
    }
  }, [branchToEdit, reset, isOpen]);

  const onSubmit = async (data: BranchFormData) => {
    try {
      if (isEditing && branchToEdit) {
        await branchService.updateBranch(branchToEdit.branch_id, {
          branch_name: data.branch_name,
          address: data.address,
          city: data.city,
          state: data.state,
          email: data.email,
          phone: data.phone,
        });
        toast.success(
          `Branch "${data.branch_name}" has been updated.`,
          "Branch Updated"
        );
      } else {
        await branchService.createBranch({
          restaurant_id: restaurantId,
          branch_name: data.branch_name,
          address: data.address,
          city: data.city,
          state: data.state,
          email: data.email,
          phone: data.phone,
        });
        toast.success(
          `Branch "${data.branch_name}" has been registered.`,
          "Branch Created"
        );
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = extractErrorMessage(err);
      toast.error(msg, isEditing ? "Update Failed" : "Creation Failed");
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Branch" : "Add Branch Location"}
      description={
        restaurantName
          ? `Associated with "${restaurantName}"`
          : "Configure branch location and contact details."
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <Input
          label="Branch Name"
          placeholder="e.g. Kolkata Main Branch"
          required
          error={errors.branch_name?.message}
          {...register("branch_name")}
        />

        <Input
          label="Street Address"
          placeholder="e.g. 123 Park Street, Suite 400"
          required
          error={errors.address?.message}
          {...register("address")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="City"
            placeholder="e.g. Kolkata"
            required
            error={errors.city?.message}
            {...register("city")}
          />
          <Input
            label="State / Province"
            placeholder="e.g. West Bengal"
            required
            error={errors.state?.message}
            {...register("state")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Branch Contact Email"
            type="email"
            placeholder="e.g. branch.kolkata@example.com"
            required
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g. +919876543210"
            required
            helperText="10 to 15 digits with optional country code"
            error={errors.phone?.message}
            {...register("phone")}
          />
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
            {isEditing ? "Save Changes" : "Create Branch"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

