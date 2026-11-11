"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RestaurantItem } from "@/types/restaurant";
import { restaurantService } from "@/services/restaurant.service";
import { useToast } from "@/context/toast-context";
import { extractErrorMessage } from "@/services/api";

const restaurantSchema = z.object({
  name: z
    .string()
    .min(1, "Restaurant name is required")
    .max(100, "Restaurant name must be 100 characters or fewer")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "Restaurant name cannot be empty spaces"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;

interface RestaurantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  restaurantToEdit?: RestaurantItem | null;
  onSuccess: () => void;
}

export function RestaurantDialog({
  isOpen,
  onClose,
  tenantId,
  restaurantToEdit,
  onSuccess,
}: RestaurantDialogProps) {
  const toast = useToast();
  const isEditing = !!restaurantToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (restaurantToEdit) {
      reset({
        name: restaurantToEdit.restaurant_name,
        description: restaurantToEdit.description || "",
      });
    } else {
      reset({
        name: "",
        description: "",
      });
    }
  }, [restaurantToEdit, reset, isOpen]);

  const onSubmit = async (data: RestaurantFormData) => {
    try {
      if (isEditing && restaurantToEdit) {
        // Backend PUT /restaurants/{restaurant_id} expects { restaurant_name, description }
        await restaurantService.updateRestaurant(restaurantToEdit.restaurant_id, {
          restaurant_name: data.name,
          description: data.description ? data.description.trim() : null,
        });
        toast.success(
          `Restaurant "${data.name}" has been updated.`,
          "Restaurant Updated"
        );
      } else {
        // Backend POST /restaurants expects { tenant_id, name, description }
        await restaurantService.createRestaurant({
          tenant_id: tenantId,
          name: data.name,
          description: data.description ? data.description.trim() : null,
        });
        toast.success(
          `Restaurant "${data.name}" has been registered.`,
          "Restaurant Created"
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
      title={isEditing ? "Edit Restaurant" : "Create New Restaurant"}
      description={
        isEditing
          ? "Update this restaurant's brand name and general details."
          : "Add a new restaurant brand entity under your current business organization."
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <Input
          label="Restaurant Name"
          placeholder="e.g. Food House Bistro"
          required
          error={errors.name?.message}
          {...register("name")}
        />

        <div className="w-full space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Premium casual dining restaurant serving authentic delicacies."
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
            {isEditing ? "Save Changes" : "Create Restaurant"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

