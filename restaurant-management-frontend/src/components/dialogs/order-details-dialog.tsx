"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  OrderItemResponseModel,
  OrderStatus,
  PaymentStatus,
} from "@/types/order";
import { formatDate } from "@/lib/utils";
import {
  Clock,
  User,
  GitBranch,
  Building2,
  DollarSign,
  AlertCircle,
  Calendar,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

interface OrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderItemResponseModel | null;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onPaymentUpdate: (orderId: string, newPayment: PaymentStatus) => Promise<void>;
  onCancelRequest: (order: OrderItemResponseModel) => void;
  canUpdateStatus: boolean;
  canUpdatePayment: boolean;
  canCancel: boolean;
}

// Allowed order status transitions matching backend app/modules/orders/service.py
const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export function OrderDetailsDialog({
  isOpen,
  onClose,
  order,
  onStatusUpdate,
  onPaymentUpdate,
  onCancelRequest,
  canUpdateStatus,
  canUpdatePayment,
  canCancel,
}: OrderDetailsDialogProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!order) return null;

  const allowedNextStatuses = VALID_STATUS_TRANSITIONS[order.order_status] || [];
  const isTerminal =
    order.order_status === "COMPLETED" || order.order_status === "CANCELLED";

  const handleStatusChange = async (nextStatus: OrderStatus) => {
    if (nextStatus === "CANCELLED") {
      onCancelRequest(order);
      return;
    }
    setUpdatingStatus(true);
    setLocalError(null);
    try {
      await onStatusUpdate(order.id, nextStatus);
    } catch (err: any) {
      setLocalError(err?.message || "Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentChange = async (newPayment: PaymentStatus) => {
    setUpdatingPayment(true);
    setLocalError(null);
    try {
      await onPaymentUpdate(order.id, newPayment);
    } catch (err: any) {
      setLocalError(err?.message || "Failed to update payment status");
    } finally {
      setUpdatingPayment(false);
    }
  };

  const getOrderStatusBadge = (st: OrderStatus) => {
    switch (st) {
      case "PLACED":
        return <Badge variant="blue">PLACED</Badge>;
      case "CONFIRMED":
        return <Badge variant="purple">CONFIRMED</Badge>;
      case "PREPARING":
        return <Badge variant="amber">PREPARING</Badge>;
      case "READY":
        return <Badge variant="emerald">READY</Badge>;
      case "COMPLETED":
        return <Badge variant="emerald">COMPLETED</Badge>;
      case "CANCELLED":
        return <Badge variant="rose">CANCELLED</Badge>;
      default:
        return <Badge variant="default">{st}</Badge>;
    }
  };

  const getPaymentStatusBadge = (pst: PaymentStatus) => {
    switch (pst) {
      case "PAID":
        return <Badge variant="emerald">PAID</Badge>;
      case "PENDING":
        return <Badge variant="amber">PENDING</Badge>;
      case "FAILED":
        return <Badge variant="rose">FAILED</Badge>;
      case "REFUNDED":
        return <Badge variant="purple">REFUNDED</Badge>;
      default:
        return <Badge variant="default">{pst}</Badge>;
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Order Specifications" size="xl">
      <div className="space-y-6">
        {localError && (
          <Alert variant="destructive" className="text-xs">
            {localError}
          </Alert>
        )}

        {/* Top Header Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Order ID:
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                {order.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Customer ID:</span>
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {order.customer_id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Branch ID:</span>
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
                {order.branch_id}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Order Status:
              </span>
              <div>{getOrderStatusBadge(order.order_status)}</div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Payment Status:
              </span>
              <div>{getPaymentStatusBadge(order.payment_status)}</div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created: {formatDate(order.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Cancellation Notice if cancelled */}
        {order.order_status === "CANCELLED" && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 p-3.5 text-xs text-rose-900 dark:text-rose-300">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Order Cancelled</span>
            </div>
            <p>
              Reason:{" "}
              <span className="italic font-medium">
                {order.cancellation_reason || "No explicit reason provided."}
              </span>
            </p>
          </div>
        )}

        {/* Order Items Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Ordered Dishes ({order.items.length})
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Verified backend pricing
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {order.items.map((item, index) => (
                  <tr key={`${item.menu_id}-${index}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.menu_name || "Menu Item"}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {item.menu_id}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      x{item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      ₹{item.unit_price.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₹{item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 font-bold text-sm">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 uppercase text-xs">
                    Total Amount:
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-mono text-base">
                    ₹{order.total_amount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Management Controls: Status & Payment Transitions */}
        {(canUpdateStatus || canUpdatePayment) && !isTerminal && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Management Controls
            </h4>

            {/* Status Transitions */}
            {canUpdateStatus && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Allowed Order Transitions from ({order.order_status}):
                </label>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {allowedNextStatuses.length === 0 ? (
                    <span className="text-xs italic text-slate-400">
                      No further status transitions allowed (Terminal state).
                    </span>
                  ) : (
                    allowedNextStatuses.map((st) => (
                      <Button
                        key={st}
                        size="sm"
                        variant={st === "CANCELLED" ? "destructiveOutline" : "outline"}
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange(st)}
                        className="text-xs h-8"
                      >
                        {st === "CANCELLED" ? "Cancel Order" : `Mark as ${st}`}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Payment Status Dropdown */}
            {canUpdatePayment && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Update Payment Status:
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={order.payment_status}
                    disabled={updatingPayment}
                    onChange={(e) => handlePaymentChange(e.target.value as PaymentStatus)}
                    className="flex h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {PAYMENT_STATUSES.map((pst) => (
                      <option key={pst} value={pst}>
                        {pst}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400">
                    Synchronizes live billing & payment state
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800">
          {canCancel && !isTerminal && (
            <Button
              variant="destructiveOutline"
              size="sm"
              onClick={() => onCancelRequest(order)}
            >
              Cancel Order
            </Button>
          )}
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Details
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

