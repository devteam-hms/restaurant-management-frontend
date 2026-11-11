"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  UtensilsCrossed,
  DollarSign,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/context/toast-context";
import { extractErrorMessage } from "@/services/api";
import { menuService } from "@/services/menu.service";
import { MenuItem } from "@/types/menu";

const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const menuFormSchema = z.object({
  menu_name: z
    .string()
    .min(1, "Dish / Item name is required")
    .max(200, "Item name must be 200 characters or fewer"),
  price: z
    .number()
    .min(0, "Price must be greater than or equal to 0"),
  image: z
    .string()
    .min(1, "Image URL or path is required"),
  short_description: z
    .string()
    .min(1, "Short description is required")
    .refine((v) => countWords(v) <= 150, "Short description must not exceed 150 words"),
  long_description: z
    .string()
    .min(1, "Detailed description is required")
    .refine((v) => countWords(v) <= 1400, "Detailed description must not exceed 1400 words"),
  availability: z.boolean(),
});

type MenuFormData = z.infer<typeof menuFormSchema>;

interface MenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName?: string;
  menuToEdit?: MenuItem | null;
  onSuccess: () => void;
}

export function MenuDialog({
  isOpen,
  onClose,
  branchId,
  branchName,
  menuToEdit,
  onSuccess,
}: MenuDialogProps) {
  const toast = useToast();
  const isEditing = !!menuToEdit;
  const [serverError, setServerError] = useState<string | null>(null);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MenuFormData>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      menu_name: "",
      price: 0,
      image: "",
      short_description: "",
      long_description: "",
      availability: true,
    },
  });

  const watchImage = watch("image");
  const watchShortDesc = watch("short_description");
  const watchLongDesc = watch("long_description");

  useEffect(() => {
    if (menuToEdit) {
      reset({
        menu_name: menuToEdit.menu_name,
        price: menuToEdit.price,
        image: menuToEdit.image,
        short_description: menuToEdit.short_description,
        long_description: menuToEdit.long_description,
        availability: menuToEdit.status === 1,
      });
    } else {
      reset({
        menu_name: "",
        price: 0,
        image: "",
        short_description: "",
        long_description: "",
        availability: true,
      });
    }
    setServerError(null);
    setImagePreviewError(false);
  }, [menuToEdit, reset, isOpen]);

  const onSubmit = async (data: MenuFormData) => {
    setServerError(null);

    try {
      if (isEditing && menuToEdit) {
        // Backend PUT /menus/branch/{branch_id}/{menu_id}
        // Accepts: menu_name, image, short_description, long_description, price, status (0 or 1)
        await menuService.updateMenu(branchId, menuToEdit.id, {
          menu_name: data.menu_name,
          image: data.image,
          short_description: data.short_description,
          long_description: data.long_description,
          price: Number(data.price),
          status: data.availability ? 1 : 0,
        });

        toast.success(
          `Menu item "${data.menu_name}" was successfully updated.`,
          "Menu Updated"
        );
      } else {
        // Backend POST /menus
        // Accepts: branch_id, menu_name, image, short_description, long_description, price, availability (boolean)
        await menuService.createMenu({
          branch_id: branchId,
          menu_name: data.menu_name,
          image: data.image,
          short_description: data.short_description,
          long_description: data.long_description,
          price: Number(data.price),
          availability: data.availability,
        });

        toast.success(
          `Menu item "${data.menu_name}" was created successfully.`,
          "Menu Created"
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      setServerError(msg);
      toast.error(msg, isEditing ? "Update Failed" : "Creation Failed");
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Menu Item" : "Add New Menu Item"}
      description={
        branchName
          ? `${isEditing ? "Modify dish details" : "Create a new dish"} under branch: ${branchName}`
          : "Configure dish specifications, pricing, and availability."
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {serverError && (
          <Alert variant="destructive" className="text-xs">
            {serverError}
          </Alert>
        )}

        {/* Row 1: Item Name & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <UtensilsCrossed className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Chicken Dum Biryani"
                disabled={isSubmitting}
                {...register("menu_name")}
                className={`flex h-10 w-full rounded-lg border bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 ${
                  errors.menu_name ? "border-rose-400" : "border-slate-300 dark:border-slate-700"
                }`}
              />
            </div>
            {errors.menu_name && (
              <p className="text-xs text-rose-600 font-medium">
                {errors.menu_name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              Price (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                disabled={isSubmitting}
                {...register("price", { valueAsNumber: true })}
                className={`flex h-10 w-full rounded-lg border bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 ${
                  errors.price ? "border-rose-400" : "border-slate-300 dark:border-slate-700"
                }`}
              />
            </div>
            {errors.price && (
              <p className="text-xs text-rose-600 font-medium">{errors.price.message}</p>
            )}
          </div>
        </div>

        {/* Row 2: Image URL & Preview */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
            Image URL <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-3 items-start">
            <div className="relative flex-1">
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="https://images.unsplash.com/... or image path"
                disabled={isSubmitting}
                {...register("image")}
                className={`flex h-10 w-full rounded-lg border bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 ${
                  errors.image ? "border-rose-400" : "border-slate-300 dark:border-slate-700"
                }`}
              />
            </div>

            {/* Thumbnail Preview */}
            <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center overflow-hidden">
              {watchImage && !imagePreviewError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={watchImage}
                  alt="Preview"
                  onError={() => setImagePreviewError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>
          {errors.image && (
            <p className="text-xs text-rose-600 font-medium">{errors.image.message}</p>
          )}
        </div>

        {/* Row 3: Short Description (max 150 words) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              Short Summary <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-[11px] font-medium ${
                countWords(watchShortDesc || "") > 150 ? "text-rose-600" : "text-slate-400"
              }`}
            >
              {countWords(watchShortDesc || "")} / 150 words
            </span>
          </div>
          <textarea
            rows={2}
            placeholder="A brief 1-2 sentence description for customers (max 150 words)..."
            disabled={isSubmitting}
            {...register("short_description")}
            className={`flex w-full rounded-lg border bg-white dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 resize-y ${
              errors.short_description
                ? "border-rose-400"
                : "border-slate-300 dark:border-slate-700"
            }`}
          />
          {errors.short_description && (
            <p className="text-xs text-rose-600 font-medium">
              {errors.short_description.message}
            </p>
          )}
        </div>

        {/* Row 4: Detailed Description (max 1400 words) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-[11px] font-medium ${
                countWords(watchLongDesc || "") > 1400 ? "text-rose-600" : "text-slate-400"
              }`}
            >
              {countWords(watchLongDesc || "")} / 1400 words
            </span>
          </div>
          <textarea
            rows={4}
            placeholder="Complete culinary description, ingredients, allergen info, cooking style (max 1400 words)..."
            disabled={isSubmitting}
            {...register("long_description")}
            className={`flex w-full rounded-lg border bg-white dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 resize-y ${
              errors.long_description
                ? "border-rose-400"
                : "border-slate-300 dark:border-slate-700"
            }`}
          />
          {errors.long_description && (
            <p className="text-xs text-rose-600 font-medium">
              {errors.long_description.message}
            </p>
          )}
        </div>

        {/* Row 5: Availability Toggle */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Controller
              name="availability"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    field.value ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      field.value ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              )}
            />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Item Availability
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {watch("availability")
                  ? "Dish is currently in stock and visible to customers."
                  : "Dish is marked sold-out or unavailable for ordering."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
            className="min-w-[130px]"
          >
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update Item"
              : "Create Item"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

