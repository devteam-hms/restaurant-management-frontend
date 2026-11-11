"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Building2,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { orderService } from "@/services/order.service";
import { restaurantService } from "@/services/restaurant.service";
import { branchService } from "@/services/branch.service";
import {
  OrderItemResponseModel,
  OrderStatus,
  PaymentStatus,
} from "@/types/order";
import { RestaurantItem } from "@/types/restaurant";
import { BranchItem } from "@/types/branch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, RoleBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { OrderDetailsDialog } from "@/components/dialogs/order-details-dialog";
import { CreateOrderDialog } from "@/components/dialogs/create-order-dialog";
import { CancelOrderModal } from "@/components/dialogs/cancel-order-modal";
import { useToast } from "@/context/toast-context";
import { extractErrorMessage } from "@/services/api";
import { formatDate } from "@/lib/utils";

export default function OrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const {
    currentTenant,
    roles,
    canCreateOrder,
    canUpdateOrderStatus,
    canUpdatePaymentStatus,
    canCancelOrder,
  } = useAuth();

  // Scope & Hierarchy state
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // Orders and Pagination state
  const [orders, setOrders] = useState<OrderItemResponseModel[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters state
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] =
    useState<OrderItemResponseModel | null>(null);
  const [orderToCancel, setOrderToCancel] =
    useState<OrderItemResponseModel | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // 1. Fetch Restaurants
  useEffect(() => {
    let isMounted = true;
    async function fetchRestaurants() {
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
    fetchRestaurants();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Branches when restaurant changes
  useEffect(() => {
    if (!selectedRestaurantId) {
      setBranches([]);
      setSelectedBranchId("");
      return;
    }

    let isMounted = true;
    async function fetchBranches() {
      setLoadingBranches(true);
      try {
        const res = await branchService.getBranches({
          restaurant_id: selectedRestaurantId,
          page: 1,
          limit: 100,
        });
        if (isMounted) {
          setBranches(res.data);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
        if (isMounted) setBranches([]);
      } finally {
        if (isMounted) setLoadingBranches(false);
      }
    }
    fetchBranches();
    return () => {
      isMounted = false;
    };
  }, [selectedRestaurantId]);

  // 3. Fetch Orders
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setErrorMessage(null);

    try {
      const res = await orderService.getOrders({
        page,
        limit,
        branch_id: selectedBranchId || undefined,
        order_status: (orderStatusFilter as OrderStatus) || undefined,
        payment_status: (paymentStatusFilter as PaymentStatus) || undefined,
      });

      setOrders(res.data);
      if (res.pagination) {
        setTotalRecords(res.pagination.total_records);
        setTotalPages(res.pagination.total_pages);
      } else {
        setTotalRecords(res.data.length);
        setTotalPages(1);
      }
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      setErrorMessage(msg);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [page, limit, selectedBranchId, orderStatusFilter, paymentStatusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle live search filter locally
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer_id.toLowerCase().includes(q) ||
        o.branch_id.toLowerCase().includes(q) ||
        o.items.some((item) => item.menu_name.toLowerCase().includes(q))
    );
  }, [orders, searchQuery]);

  // Summary Metrics calculated directly from real records
  const metrics = useMemo(() => {
    const total = totalRecords;
    const placed = orders.filter((o) => o.order_status === "PLACED").length;
    const confirmed = orders.filter((o) => o.order_status === "CONFIRMED").length;
    const preparing = orders.filter((o) => o.order_status === "PREPARING").length;
    const ready = orders.filter((o) => o.order_status === "READY").length;
    const completed = orders.filter((o) => o.order_status === "COMPLETED").length;
    const cancelled = orders.filter((o) => o.order_status === "CANCELLED").length;
    return { total, placed, confirmed, preparing, ready, completed, cancelled };
  }, [orders, totalRecords]);

  // Handlers for Status & Payment updates
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await orderService.updateOrder(orderId, {
        order_status: newStatus,
      });
      toast.success(
        `Order ${orderId} transitioned to ${newStatus}`,
        "Status Updated"
      );
      // Update in place
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrderForDetails && selectedOrderForDetails.id === orderId) {
        setSelectedOrderForDetails(updated);
      }
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      toast.error(msg, "Status Update Failed");
      throw err;
    }
  };

  const handlePaymentUpdate = async (orderId: string, newPayment: PaymentStatus) => {
    try {
      const updated = await orderService.updateOrder(orderId, {
        payment_status: newPayment,
      });
      toast.success(
        `Order ${orderId} payment updated to ${newPayment}`,
        "Payment Updated"
      );
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrderForDetails && selectedOrderForDetails.id === orderId) {
        setSelectedOrderForDetails(updated);
      }
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      toast.error(msg, "Payment Update Failed");
      throw err;
    }
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      await orderService.cancelOrder(orderToCancel.id, reason);
      toast.success(
        `Order ${orderToCancel.id} has been cancelled.`,
        "Order Cancelled"
      );
      setOrderToCancel(null);
      if (selectedOrderForDetails?.id === orderToCancel.id) {
        setSelectedOrderForDetails((prev) =>
          prev
            ? {
                ...prev,
                order_status: "CANCELLED",
                cancellation_reason: reason || "Cancelled by management",
              }
            : null
        );
      }
      await fetchOrders();
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      toast.error(msg, "Cancellation Failed");
    } finally {
      setIsCancelling(false);
    }
  };

  const renderOrderStatusBadge = (st: OrderStatus) => {
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

  const renderPaymentStatusBadge = (pst: PaymentStatus) => {
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Order Management
            </h1>
            {roles[0] && <RoleBadge role={roles[0]} />}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time tracking, lifecycle status transitions, and branch order fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            isLoading={loadingOrders}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {canCreateOrder && (
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Order</span>
            </Button>
          )}
        </div>
      </div>

      {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="p-3.5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {metrics.total}
          </p>
        </Card>
        <Card className="p-3.5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Placed
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {metrics.placed}
          </p>
        </Card>
        <Card className="p-3.5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Confirmed
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {metrics.confirmed}
          </p>
        </Card>
        <Card className="p-3.5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Preparing
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {metrics.preparing}
          </p>
        </Card>
        <Card className="p-3.5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Ready
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {metrics.ready}
          </p>
        </Card>
        <Card className="p-3.5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            Completed
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {metrics.completed}
          </p>
        </Card>
        <Card className="p-3.5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Cancelled
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {metrics.cancelled}
          </p>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <Card className="p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ID, customer, dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>

          {/* Branch Filter */}
          <div className="relative">
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>

          {/* Order Status Filter */}
          <div className="relative">
            <select
              value={orderStatusFilter}
              onChange={(e) => {
                setOrderStatusFilter(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="">All Order Statuses</option>
              <option value="PLACED">Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="relative">
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="">All Payment Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {loadingOrders ? (
          <div className="py-20">
            <Spinner size="lg" label="Retrieving live orders..." />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              No Orders Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              There are no orders matching your current filter criteria or branch selection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-950/60">
                <TableRow>
                  <TableHead className="w-[180px]">Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total (₹)</TableHead>
                  <TableHead className="text-center">Order Status</TableHead>
                  <TableHead className="text-center">Payment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {order.id}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-300 max-w-[130px] truncate">
                      {order.customer_id}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      {order.branch_id}
                    </TableCell>
                    <TableCell className="text-xs text-slate-800 dark:text-slate-200">
                      <div className="truncate max-w-[220px]">
                        {order.items.map((i) => `${i.menu_name} (x${i.quantity})`).join(", ")}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {order.items.length} unique dish{order.items.length === 1 ? "" : "es"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                      ₹{order.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderOrderStatusBadge(order.order_status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderPaymentStatusBadge(order.payment_status)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrderForDetails(order)}
                          className="h-8 px-2 text-xs gap-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Button>

                        {canCancelOrder &&
                          order.order_status !== "COMPLETED" &&
                          order.order_status !== "CANCELLED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setOrderToCancel(order)}
                              className="h-8 px-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            >
                              Cancel
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs">
            <span className="text-slate-500">
              Showing page {page} of {totalPages} ({totalRecords} total orders)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Order Details Modal */}
      <OrderDetailsDialog
        isOpen={!!selectedOrderForDetails}
        onClose={() => setSelectedOrderForDetails(null)}
        order={selectedOrderForDetails}
        onStatusUpdate={handleStatusUpdate}
        onPaymentUpdate={handlePaymentUpdate}
        onCancelRequest={(order) => setOrderToCancel(order)}
        canUpdateStatus={canUpdateOrderStatus}
        canUpdatePayment={canUpdatePaymentStatus}
        canCancel={canCancelOrder}
      />

      {/* Create Order Modal */}
      <CreateOrderDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchOrders}
      />

      {/* Cancel Confirmation Modal */}
      <CancelOrderModal
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        orderId={orderToCancel?.id || null}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
      />
    </div>
  );
}

