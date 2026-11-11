"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onConfirm: (reason: string) => Promise<void>;
  isLoading: boolean;
}

export function CancelOrderModal({
  isOpen,
  onClose,
  orderId,
  onConfirm,
  isLoading,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen || !orderId) return null;

  const handleConfirm = async () => {
    await onConfirm(reason.trim());
    setReason("");
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Cancel Order Confirmation" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold">Are you sure you want to cancel this order?</p>
            <p className="mt-1">
              Order ID: <span className="font-mono font-semibold">{orderId}</span>.
              The backend will update the order status to <strong>CANCELLED</strong> while preserving full audit history.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Cancellation Reason (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Customer requested cancellation / Kitchen out of stock"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isLoading}
            className="flex w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Keep Order
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

