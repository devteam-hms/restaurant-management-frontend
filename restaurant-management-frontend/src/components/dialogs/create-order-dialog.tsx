"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/context/toast-context";
import { extractErrorMessage } from "@/services/api";
import { orderService } from "@/services/order.service";
import { restaurantService } from "@/services/restaurant.service";
import { branchService } from "@/services/branch.service";
import { menuService } from "@/services/menu.service";
import { RestaurantItem } from "@/types/restaurant";
import { BranchItem } from "@/types/branch";
import { MenuItem } from "@/types/menu";
import { OrderItemPayload } from "@/types/order";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Building2,
  GitBranch,
  AlertCircle,
  ShoppingBag,
  Info,
} from "lucide-react";

interface CreateOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DraftOrderItem {
  menu_id: string;
  menu_name: string;
  unit_price: number;
  quantity: number;
}

export function CreateOrderDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateOrderDialogProps) {
  const toast = useToast();

  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [availableMenus, setAvailableMenus] = useState<MenuItem[]>([]);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const [orderItems, setOrderItems] = useState<DraftOrderItem[]>([]);
  const [selectedMenuIdToAdd, setSelectedMenuIdToAdd] = useState<string>("");
  const [addQuantity, setAddQuantity] = useState<number>(1);

  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Load restaurants when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadRestaurants() {
      setLoadingRestaurants(true);
      try {
        const res = await restaurantService.getRestaurants({ page: 1, limit: 100 });
        if (isMounted) {
          setRestaurants(res.data);
          if (res.data.length > 0) {
            setSelectedRestaurantId(res.data[0].restaurant_id);
          }
        }
      } catch (err) {
        console.error("Failed to load restaurants:", err);
      } finally {
        if (isMounted) setLoadingRestaurants(false);
      }
    }

    loadRestaurants();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Load branches when selectedRestaurantId changes
  useEffect(() => {
    if (!selectedRestaurantId) {
      setBranches([]);
      setSelectedBranchId("");
      return;
    }

    let isMounted = true;
    async function loadBranches() {
      setLoadingBranches(true);
      try {
        const res = await branchService.getBranches({
          restaurant_id: selectedRestaurantId,
          page: 1,
          limit: 100,
        });
        if (isMounted) {
          setBranches(res.data);
          if (res.data.length > 0) {
            setSelectedBranchId(res.data[0].branch_id);
          } else {
            setSelectedBranchId("");
          }
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
        if (isMounted) setBranches([]);
      } finally {
        if (isMounted) setLoadingBranches(false);
      }
    }

    loadBranches();
    return () => {
      isMounted = false;
    };
  }, [selectedRestaurantId]);

  // Load active menu items when selectedBranchId changes
  useEffect(() => {
    setOrderItems([]);
    setSelectedMenuIdToAdd("");
    if (!selectedBranchId) {
      setAvailableMenus([]);
      return;
    }

    let isMounted = true;
    async function loadMenus() {
      setLoadingMenus(true);
      try {
        const res = await menuService.getMenusByBranch(selectedBranchId, {
          page: 1,
          limit: 100,
          status: 1, // Only active/available dishes
        });
        if (isMounted) {
          // Filter strictly active status = 1
          const activeOnly = res.data.filter((m) => m.status === 1);
          setAvailableMenus(activeOnly);
          if (activeOnly.length > 0) {
            setSelectedMenuIdToAdd(activeOnly[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load menus:", err);
        if (isMounted) setAvailableMenus([]);
      } finally {
        if (isMounted) setLoadingMenus(false);
      }
    }

    loadMenus();
    return () => {
      isMounted = false;
    };
  }, [selectedBranchId]);

  const handleAddItem = () => {
    if (!selectedMenuIdToAdd || addQuantity < 1) return;
    const menuItem = availableMenus.find((m) => m.id === selectedMenuIdToAdd);
    if (!menuItem) return;

    setOrderItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.menu_id === selectedMenuIdToAdd);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += addQuantity;
        return updated;
      }
      return [
        ...prev,
        {
          menu_id: menuItem.id,
          menu_name: menuItem.menu_name,
          unit_price: menuItem.price,
          quantity: addQuantity,
        },
      ];
    });

    setAddQuantity(1);
  };

  const handleRemoveItem = (menuId: string) => {
    setOrderItems((prev) => prev.filter((i) => i.menu_id !== menuId));
  };

  const handleQuantityChange = (menuId: string, qty: number) => {
    if (qty < 1) return;
    setOrderItems((prev) =>
      prev.map((i) => (i.menu_id === menuId ? { ...i, quantity: qty } : i))
    );
  };

  // Indicative subtotal for display only
  const estimatedTotal = orderItems.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      setServerError("Please select an operating branch.");
      return;
    }
    if (orderItems.length === 0) {
      setServerError("Please add at least one menu item to the order.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    // Strict backend schema: Only branch_id and items [{ menu_id, quantity }]
    const payload = {
      branch_id: selectedBranchId,
      items: orderItems.map((item) => ({
        menu_id: item.menu_id,
        quantity: item.quantity,
      })),
    };

    try {
      await orderService.createOrder(payload);
      toast.success(
        "Order has been placed successfully in PLACED status.",
        "Order Created"
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      setServerError(msg);
      toast.error(msg, "Order Creation Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create New Order" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {serverError && (
          <Alert variant="destructive" className="text-xs">
            {serverError}
          </Alert>
        )}

        {/* Informative Limitation Banner */}
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/25 p-3.5 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Backend Integration Notice: </span>
            The API places this order linked to your authenticated user account.
            Prices are validated securely by the server from active branch menu records.
          </div>
        </div>

        {/* Location Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Restaurant
            </label>
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              disabled={loadingRestaurants || isSubmitting}
              className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
            >
              {restaurants.map((r) => (
                <option key={r.restaurant_id} value={r.restaurant_id}>
                  {r.restaurant_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Branch <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={loadingBranches || branches.length === 0 || isSubmitting}
              className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
            >
              {branches.length === 0 ? (
                <option value="">No branches available</option>
              ) : (
                branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Menu Item Selector and Quantity */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Select Menu Items
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1 w-full">
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Active Menu Item
              </label>
              <select
                value={selectedMenuIdToAdd}
                onChange={(e) => setSelectedMenuIdToAdd(e.target.value)}
                disabled={loadingMenus || availableMenus.length === 0 || isSubmitting}
                className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
              >
                {availableMenus.length === 0 ? (
                  <option value="">No active menu items for this branch</option>
                ) : (
                  availableMenus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.menu_name} — ₹{m.price.toFixed(2)}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="w-24 space-y-1">
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={addQuantity}
                onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={availableMenus.length === 0 || isSubmitting}
                className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={availableMenus.length === 0 || isSubmitting}
              onClick={handleAddItem}
              className="gap-1.5 h-10 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </Button>
          </div>
        </div>

        {/* Added Items List */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Order Items Summary ({orderItems.length})
          </label>

          {orderItems.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-400">
              No items added yet. Select a dish above and click &quot;Add Item&quot;.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {orderItems.map((item) => (
                <div
                  key={item.menu_id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-900"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.menu_name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      ₹{item.unit_price.toFixed(2)} each
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.menu_id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-bold text-xs">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.menu_id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 w-16 text-right">
                      ₹{(item.unit_price * item.quantity).toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.menu_id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 font-bold text-xs">
                <span className="text-slate-600 dark:text-slate-400 uppercase">
                  Estimated Total:
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                  ₹{estimatedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Form Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            disabled={orderItems.length === 0 || !selectedBranchId}
            className="gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Place Order</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

