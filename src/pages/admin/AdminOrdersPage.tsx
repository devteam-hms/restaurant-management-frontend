import React, { useState, useEffect } from 'react';
import { Search, Eye, XCircle, CheckCircle, Clock, Receipt, Filter } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { branchService } from '@/services/branch.service';
import { billService } from '@/services/bill.service';
import { OrderItemResponseModel, OrderStatus, PaymentStatus } from '@/types/order';
import { BranchItem } from '@/types/branch';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderItemResponseModel[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<OrderItemResponseModel | null>(null);
  const [statusUpdateOrder, setStatusUpdateOrder] = useState<OrderItemResponseModel | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('CONFIRMED');
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>('PAID');
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const { success, error: toastError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [oRes, bRes] = await Promise.all([
        orderService.getOrders({
          branch_id: selectedBranchId || undefined,
          limit: 50,
        }),
        branchService.getBranches(),
      ]);
      setOrders(oRes.data);
      setBranches(bRes.data);
    } catch (e: any) {
      toastError('Failed to load orders', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBranchId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateOrder) return;
    if (newStatus === 'CANCELLED' && statusUpdateOrder.order_status !== 'CANCELLED') {
      setConfirmCancelOpen(true);
      return;
    }
    await executeStatusUpdate();
  };

  const executeStatusUpdate = async () => {
    if (!statusUpdateOrder) return;
    setIsUpdating(true);
    try {
      await orderService.updateOrder(statusUpdateOrder.id, {
        order_status: newStatus,
        payment_status: newPaymentStatus,
      });
      success('Order Updated', `Order #${statusUpdateOrder.id} status changed to ${newStatus}.`);
      setStatusUpdateOrder(null);
      setConfirmCancelOpen(false);
      loadData();
    } catch (e: any) {
      toastError('Update Failed', e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateBill = async (orderId: string) => {
    try {
      const b = await billService.generateBill({ order_id: orderId });
      success('Bill Generated', `Invoice #${b.bill_number} generated successfully.`);
    } catch (e: any) {
      toastError('Bill Generation Failed', e.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.branch_name && o.branch_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || o.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Order Management"
        subtitle="Live kitchen tickets, table orders, and authorized dining"
      />

      <div className="px-8 space-y-6">
        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <Input
                placeholder="Search by ID or guest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-muted" />}
              />
            </div>

            {/* Branch filter */}
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-surface-secondary text-foreground text-xs rounded-lg px-3 py-2.5 border border-border focus:border-primary focus:outline-none"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {['ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-primary text-background font-semibold shadow-gold-glow'
                    : 'bg-surface-secondary text-muted hover:text-foreground border border-border'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-luxury">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-secondary/60 text-xs uppercase tracking-wider text-muted">
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Guest Diner</th>
                <th className="px-6 py-4 font-medium">Branch Location</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Total Amount</th>
                <th className="px-6 py-4 font-medium">Kitchen Status</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted text-xs">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-muted font-serif italic">
                    No authorized orders found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-primary">{order.id}</span>
                      <p className="text-[10px] text-muted mt-0.5">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-foreground">
                        {order.customer_name || 'Guest Diner'}
                      </p>
                      {order.table_number && (
                        <p className="text-[10px] text-muted mt-0.5">{order.table_number}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-foreground font-medium">
                      {order.branch_name || 'The Bengal Table — Park Street Flagship'}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted max-w-xs truncate">
                      {order.items.map((i) => `${i.quantity}x ${i.menu_name}`).join(', ')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <OrderStatusBadge status={order.order_status} />
                    </td>
                    <td className="px-6 py-4">
                      <PaymentStatusBadge status={order.payment_status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2.5 py-1 text-xs"
                          onClick={() => setSelectedOrder(order)}
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="gold-outline"
                          size="sm"
                          className="px-2.5 py-1 text-xs"
                          onClick={() => {
                            setStatusUpdateOrder(order);
                            setNewStatus(order.order_status);
                            setNewPaymentStatus(order.payment_status);
                          }}
                        >
                          <span>Update</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2.5 py-1 text-xs text-primary"
                          onClick={() => handleGenerateBill(order.id)}
                          title="Generate Invoicing Bill"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.id}`}
          subtitle={`Guest: ${selectedOrder.customer_name || 'VIP Guest'}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-surface-secondary border border-border text-xs">
              <div>
                <span className="text-muted block">Status:</span>
                <div className="mt-1">
                  <OrderStatusBadge status={selectedOrder.order_status} />
                </div>
              </div>
              <div>
                <span className="text-muted block">Payment:</span>
                <div className="mt-1">
                  <PaymentStatusBadge status={selectedOrder.payment_status} />
                </div>
              </div>
              <div>
                <span className="text-muted block">Location / Table:</span>
                <span className="font-medium text-foreground mt-1 block">
                  {selectedOrder.branch_name} ({selectedOrder.table_number || 'Main Salon'})
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-muted font-medium">Courses</h4>
              <div className="divide-y divide-border/40 border-y border-border/60">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-foreground">{item.quantity}x</span>{' '}
                      <span className="text-foreground/90">{item.menu_name}</span>
                    </div>
                    <span className="font-mono font-medium text-primary">
                      {formatCurrency(item.subtotal || item.unit_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.special_instructions && (
              <div className="p-3.5 rounded-xl bg-surface-secondary text-xs text-muted">
                <strong className="text-foreground block mb-0.5">Special Dietary Instructions:</strong>
                {selectedOrder.special_instructions}
              </div>
            )}

            <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="font-mono text-foreground">{formatCurrency(selectedOrder.subtotal || selectedOrder.total_amount)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Hospitality VAT</span>
                <span className="font-mono text-foreground">{formatCurrency(selectedOrder.tax_amount || 0)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between font-bold text-base">
                <span className="text-foreground">Total</span>
                <span className="font-mono text-primary">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Update Status Modal */}
      {statusUpdateOrder && (
        <Modal
          isOpen={!!statusUpdateOrder}
          onClose={() => setStatusUpdateOrder(null)}
          title={`Update Order #${statusUpdateOrder.id}`}
          subtitle="Change live kitchen preparation and billing status"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider font-medium text-muted">
                Kitchen Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full bg-surface-secondary text-foreground text-sm rounded-lg p-2.5 border border-border focus:border-primary focus:outline-none"
              >
                <option value="PLACED">PLACED (Pending Kitchen Acceptance)</option>
                <option value="CONFIRMED">CONFIRMED (Accepted by Chef)</option>
                <option value="PREPARING">PREPARING (Courses in Preparation)</option>
                <option value="READY">READY (Ready for Table Service)</option>
                <option value="COMPLETED">COMPLETED (Served & Finalized)</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider font-medium text-muted">
                Payment Status
              </label>
              <select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full bg-surface-secondary text-foreground text-sm rounded-lg p-2.5 border border-border focus:border-primary focus:outline-none"
              >
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setStatusUpdateOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdating}>
                Save Updates
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Order Cancellation */}
      <ConfirmDialog
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={executeStatusUpdate}
        title="Cancel Order"
        description={`Are you sure you want to cancel Order #${statusUpdateOrder?.id}? This will notify the kitchen brigade and stop table preparation.`}
        confirmText="Confirm Cancellation"
        variant="danger"
        isLoading={isUpdating}
      />
    </div>
  );
};

