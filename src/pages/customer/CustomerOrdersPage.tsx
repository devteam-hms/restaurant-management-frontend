import React, { useState, useEffect } from 'react';
import { ShoppingBag, Eye, XCircle, Search, Filter } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { OrderItemResponseModel } from '@/types/order';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';

export const CustomerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderItemResponseModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderItemResponseModel | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<OrderItemResponseModel | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { success, error: toastError } = useToast();

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getOrders({ page: 1, limit: 30 });
      setOrders(res.data);
    } catch (e: any) {
      toastError('Failed to load orders', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      await orderService.cancelOrder(orderToCancel.id, cancelReason);
      success('Order Cancelled', `Order #${orderToCancel.id} has been cancelled.`);
      setCancelModalOpen(false);
      setOrderToCancel(null);
      setCancelReason('');
      loadOrders();
    } catch (e: any) {
      toastError('Cancellation Failed', e.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredOrders =
    statusFilter === 'ALL' ? orders : orders.filter((o) => o.order_status === statusFilter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
            Dining History
          </span>
          <h1 className="font-serif text-4xl text-foreground font-normal">My Orders</h1>
          <p className="text-xs text-muted mt-1">
            Track active dining orders, kitchen preparation progress, and order history.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          {['ALL', 'PREPARING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                statusFilter === st
                  ? 'bg-primary text-background font-semibold'
                  : 'bg-surface text-muted hover:text-foreground border border-border'
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
              <th className="px-6 py-4 font-medium">Order Ref</th>
              <th className="px-6 py-4 font-medium">Branch Location</th>
              <th className="px-6 py-4 font-medium">Items</th>
              <th className="px-6 py-4 font-medium">Total</th>
              <th className="px-6 py-4 font-medium">Order Status</th>
              <th className="px-6 py-4 font-medium">Payment</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted text-xs">
                  Loading orders...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-muted font-serif italic">
                  No orders recorded matching your filter.
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
                    <p className="text-xs font-medium text-foreground">{order.branch_name || 'Kolkata — Park Street Flagship'}</p>
                    {order.table_number && (
                      <p className="text-[10px] text-muted mt-0.5">{order.table_number}</p>
                    )}
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
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </Button>

                      {['PLACED', 'CONFIRMED'].includes(order.order_status) && (
                        <Button
                          variant="danger"
                          size="sm"
                          className="px-2.5 py-1 text-xs"
                          onClick={() => {
                            setOrderToCancel(order);
                            setCancelModalOpen(true);
                          }}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.id}`}
          subtitle={`Placed on ${formatDate(selectedOrder.created_at)}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary border border-border">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">Status</p>
                <div className="mt-1">
                  <OrderStatusBadge status={selectedOrder.order_status} />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">Payment</p>
                <div className="mt-1">
                  <PaymentStatusBadge status={selectedOrder.payment_status} />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">Branch Location</p>
                <p className="text-xs font-medium text-foreground mt-1">
                  {selectedOrder.branch_name || 'The Bengal Table — Park Street Flagship'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-muted font-medium">Ordered Dishes</h4>
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

            <div className="p-4 rounded-xl bg-surface-secondary/70 border border-border space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="font-mono text-foreground">{formatCurrency(selectedOrder.subtotal || selectedOrder.total_amount)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>GST (CGST + SGST)</span>
                <span className="font-mono text-foreground">{formatCurrency(selectedOrder.tax_amount || 0)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between font-semibold text-sm">
                <span className="text-foreground">Total Paid</span>
                <span className="font-mono text-primary">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {selectedOrder.special_instructions && (
              <div className="p-3.5 rounded-xl bg-surface-secondary text-xs text-muted">
                <strong className="text-foreground block mb-0.5">Special Instructions:</strong>
                {selectedOrder.special_instructions}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      {orderToCancel && (
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Cancel Order"
          subtitle={`Are you sure you wish to cancel Order #${orderToCancel.id}?`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-muted leading-relaxed">
              Orders that have not yet begun kitchen preparation may be cancelled without service fee.
            </p>
            <textarea
              className="w-full bg-surface-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:border-primary focus:outline-none"
              rows={3}
              placeholder="Reason for cancellation (optional)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setCancelModalOpen(false)}>
                Keep Order
              </Button>
              <Button variant="danger" isLoading={isCancelling} onClick={handleCancelOrder}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

