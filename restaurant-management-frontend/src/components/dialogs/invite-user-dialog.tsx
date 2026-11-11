"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Mail,
  User,
  Shield,
  UtensilsCrossed,
  GitBranch,
  Send,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";
import { extractErrorMessage } from "@/services/api";
import { restaurantService } from "@/services/restaurant.service";
import { branchService } from "@/services/branch.service";
import { invitationService } from "@/services/invitation.service";
import { RestaurantItem } from "@/types/restaurant";
import { BranchItem } from "@/types/branch";

const inviteSchema = z.object({
  full_name: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must be 100 characters or fewer")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "Full name cannot be whitespace only"),
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please provide a valid email address")
    .transform((val) => val.trim().toLowerCase()),
  role: z.enum(["MANAGER", "STAFF", "CUSTOMER"]),
  restaurant_id: z.string().optional().nullable(),
  branch_id: z.string().optional().nullable(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

export function InviteUserDialog({
  isOpen,
  onClose,
  tenantId,
  onSuccess,
}: InviteUserDialogProps) {
  const toast = useToast();
  const { isOwner, isManager } = useAuth();

  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Allowed roles based on current authenticated caller
  // OWNER can invite: MANAGER, STAFF, CUSTOMER
  // MANAGER can invite: STAFF, CUSTOMER
  const availableRoles: { value: "MANAGER" | "STAFF" | "CUSTOMER"; label: string; desc: string }[] =
    isOwner
      ? [
          {
            value: "MANAGER",
            label: "Manager",
            desc: "Can manage restaurants, branches, menu, and invite operational staff.",
          },
          {
            value: "STAFF",
            label: "Staff",
            desc: "Branch-level operator. Can view menus, operate orders, and access assigned branch.",
          },
          {
            value: "CUSTOMER",
            label: "Customer",
            desc: "Customer profile with order and menu viewing access.",
          },
        ]
      : [
          {
            value: "STAFF",
            label: "Staff",
            desc: "Branch-level operator. Can view menus, operate orders, and access assigned branch.",
          },
          {
            value: "CUSTOMER",
            label: "Customer",
            desc: "Customer profile with order and menu viewing access.",
          },
        ];

  const defaultRole = availableRoles[0]?.value || "STAFF";

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: defaultRole,
      restaurant_id: "",
      branch_id: "",
    },
  });

  const selectedRestaurantId = watch("restaurant_id");

  // Fetch restaurants when modal opens
  useEffect(() => {
    if (!isOpen || !tenantId) return;

    let isMounted = true;
    async function loadRestaurants() {
      setLoadingRestaurants(true);
      try {
        const res = await restaurantService.getRestaurants({
          page: 1,
          limit: 100,
          tenant_id: tenantId,
        });
        if (isMounted) {
          setRestaurants(res.data);
        }
      } catch (err) {
        console.error("Failed to load restaurants for invitation dialog:", err);
      } finally {
        if (isMounted) {
          setLoadingRestaurants(false);
        }
      }
    }

    loadRestaurants();
    return () => {
      isMounted = false;
    };
  }, [isOpen, tenantId]);

  // Fetch branches whenever selected restaurant changes
  useEffect(() => {
    if (!selectedRestaurantId) {
      setBranches([]);
      setValue("branch_id", "");
      return;
    }

    // Reset branch selection immediately when restaurant changes
    setValue("branch_id", "");

    let isMounted = true;
    async function loadBranches() {
      setLoadingBranches(true);
      try {
        const res = await branchService.getBranches({
          restaurant_id: selectedRestaurantId || undefined,
          page: 1,
          limit: 100,
        });
        if (isMounted) {
          setBranches(res.data);
        }
      } catch (err) {
        console.error("Failed to load branches for restaurant:", err);
      } finally {
        if (isMounted) {
          setLoadingBranches(false);
        }
      }
    }

    loadBranches();
    return () => {
      isMounted = false;
    };
  }, [selectedRestaurantId, setValue]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      reset({
        full_name: "",
        email: "",
        role: defaultRole,
        restaurant_id: "",
        branch_id: "",
      });
    }
  }, [isOpen, reset, defaultRole]);

  const onSubmit = async (data: InviteFormData) => {
    setServerError(null);

    const payload = {
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      restaurant_id: data.restaurant_id || undefined,
      branch_id: data.branch_id || undefined,
    };

    try {
      const response = await invitationService.inviteUser(tenantId, payload);
      toast.success(
        `Invitation sent to ${data.email}. Keycloak activation instructions have been dispatched.`,
        "User Invited Successfully"
      );
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      setServerError(msg);
      toast.error(msg, "Invitation Failed");
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member"
      description="Send a restaurant organization invitation. The user will receive an email to verify identity and configure credentials in Keycloak."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
        {serverError && (
          <Alert variant="destructive" className="text-xs">
            {serverError}
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                disabled={isSubmitting}
                {...register("full_name")}
                className={`flex h-10 w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 ${
                  errors.full_name
                    ? "border-rose-400 focus-visible:ring-rose-500 bg-rose-50/20"
                    : "border-slate-300"
                }`}
              />
            </div>
            {errors.full_name && (
              <p className="text-xs text-rose-600 font-medium">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                placeholder="e.g. manager@restaurant.com"
                disabled={isSubmitting}
                {...register("email")}
                className={`flex h-10 w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 ${
                  errors.email
                    ? "border-rose-400 focus-visible:ring-rose-500 bg-rose-50/20"
                    : "border-slate-300"
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-600 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        {/* Assigned Role */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Role Permission <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <select
              disabled={isSubmitting}
              {...register("role")}
              className={`flex h-10 w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 ${
                errors.role ? "border-rose-400" : "border-slate-300"
              }`}
            >
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} ({r.value})
                </option>
              ))}
            </select>
          </div>
          {errors.role && (
            <p className="text-xs text-rose-600 font-medium">{errors.role.message}</p>
          )}
          <p className="text-xs text-slate-500">
            {availableRoles.find((r) => r.value === watch("role"))?.desc}
          </p>
        </div>

        {/* Scope: Restaurant & Branch */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Assignment Scope (Optional)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Restaurant Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Restaurant Brand
              </label>
              <div className="relative">
                <select
                  disabled={isSubmitting || loadingRestaurants}
                  {...register("restaurant_id")}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">-- All Restaurants (Unscoped) --</option>
                  {restaurants.map((rest) => (
                    <option key={rest.restaurant_id} value={rest.restaurant_id}>
                      {rest.restaurant_name}
                    </option>
                  ))}
                </select>
                {loadingRestaurants && (
                  <div className="absolute right-3 top-3 pointer-events-none">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Scope the user to a specific brand.
              </p>
            </div>

            {/* Branch Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Branch Location
              </label>
              <div className="relative">
                <select
                  disabled={
                    isSubmitting ||
                    loadingBranches ||
                    !selectedRestaurantId ||
                    branches.length === 0
                  }
                  {...register("branch_id")}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    {!selectedRestaurantId
                      ? "-- Select a Restaurant First --"
                      : branches.length === 0
                      ? "-- No Branches for this Restaurant --"
                      : "-- All Branches in Restaurant --"}
                  </option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.branch_name} ({b.city})
                    </option>
                  ))}
                </select>
                {loadingBranches && (
                  <div className="absolute right-3 top-3 pointer-events-none">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Resets automatically when restaurant changes.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="gap-2 min-w-[130px]"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? "Inviting..." : "Send Invitation"}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

