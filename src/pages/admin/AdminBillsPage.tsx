import React, { useState, useEffect } from 'react';
import { Receipt, Eye, Plus, CheckCircle, Download, XCircle } from 'lucide-react';
import { billService } from '@/services/bill.service';
import { orderService } from '@/services/order.service';
import { BillItem } from '@/types/bill';
import { OrderItemResponseModel } from '@/types/order';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { PaymentStatusBadge } from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';

export const AdminBillsPage: React.FC = () => {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [orders, setOrders] = useState<OrderItemResponseModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState<BillItem | null>(null);
  const [newPayStatus, setNewPayStatus] = useState<'PENDING' | 'PAID' | 'REFUNDED' | 'CANCELLED'>('PAID');
  const [billToCancel, setBillToCancel] = useState<BillItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const { success, error: toastError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bRes, oRes] = await Promise.all([
        billService.getBills({ limit: 50 }),
        orderService.getOrders({ limit: 50 }),
      ]);
      setBills(bRes.data);
      setOrders(oRes.data);
      if (oRes.data.length > 0) {
        setSelectedOrderId(oRes.data[0].id);
      }
    } catch (e: any) {
      toastError('Failed to load billing data', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setIsGenerating(true);
    try {
      const newBill = await billService.generateBill({
        order_id: selectedOrderId,
        discount_amount: Number(discountAmount),
        notes,
      });
      success('Bill Generated', `Invoice #${newBill.bill_number} generated.`);
      setGenerateModalOpen(false);
      setDiscountAmount(0);
      setNotes('');
      loadData();
    } catch (e: any) {
      toastError('Generation Failed', e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdatePaymentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPaymentStatus) return;
    try {
      await billService.updateBill(editPaymentStatus.id, {
        payment_status: newPayStatus,
      });
      success('Payment Status Updated', `Bill #${editPaymentStatus.bill_number} updated to ${newPayStatus}.`);
      setEditPaymentStatus(null);
      loadData();
    } catch (e: any) {
      toastError('Update Failed', e.message);
    }
  };

    const handleConfirmCancelBill = async () => {
      if (!billToCancel) return;
      setIsCancelling(true);
      try {
        await billService.cancelBill(billToCancel.id);
        success('Bill Cancelled', `Bill #${billToCancel.bill_number} has been cancelled.`);
        setBillToCancel(null);
        loadData();
      } catch (e: any) {
        toastError('Cancel Failed', e.message);
      } finally {
        setIsCancelling(false);
      }
    };

    return (
      <div className="space-y-8">
        <AdminTopbar
          title="Bill & Invoice Management"
          subtitle="Itemized revenue documentation, statutory tax collection, and transaction records"
          actions={
            <Button variant="primary" size="sm" onClick={() => setGenerateModalOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Generate Invoicing Bill</span>
            </Button>
          }
        />

        <div className="px-8 space-y-6">
          <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-luxury">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-secondary/60 text-xs uppercase tracking-wider text-muted">
                  <th className="px-6 py-4 font-medium">Bill Number</th>
                  <th className="px-6 py-4 font-medium">Order Ref</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Subtotal</th>
                  <th className="px-6 py-4 font-medium">Tax Breakdown</th>
                  <th className="px-6 py-4 font-medium">Final Amount</th>
                  <th className="px-6 py-4 font-medium">Payment Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted text-xs">
                      Loading invoices...
                    </td>
                  </tr>
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-muted font-serif italic">
                      No bills generated yet. Click "Generate Invoicing Bill" to issue an invoice from an order.
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-primary">{bill.bill_number}</span>
                        <p className="text-[10px] text-muted mt-0.5">{formatDate(bill.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-foreground/80">
                        {bill.order_id}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-foreground">
                        {bill.customer_name || 'VIP Guest'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted">
                        {formatCurrency(bill.subtotal)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono">
                          <span className="text-foreground">{formatCurrency(bill.tax_amount)}</span>
                          <span className="text-[10px] text-primary ml-1 font-sans">
                            ({bill.tax_percentage}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">
                        {formatCurrency(bill.final_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <PaymentStatusBadge status={bill.payment_status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-2.5 py-1 text-xs"
                            onClick={() => setSelectedBill(bill)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Button>
                          <Button
                            variant="gold-outline"
                            size="sm"
                            className="px-2.5 py-1 text-xs"
                            onClick={() => {
                              setEditPaymentStatus(bill);
                              setNewPayStatus(bill.payment_status);
                            }}
                          >
                            <span>Status</span>
                          </Button>
                          {bill.payment_status !== 'CANCELLED' && (
                            <Button
                              variant="danger"
                              size="sm"
                              className="p-1.5"
                              onClick={() => setBillToCancel(bill)}
                              title="Cancel Bill"
                            >
                              <XCircle className="w-3.5 h-3.5" />
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
        </div>

        {/* Generate Bill Modal */}
        <Modal
          isOpen={generateModalOpen}
          onClose={() => setGenerateModalOpen(false)}
          title="Generate Bill from Order"
          subtitle="Issues a formal invoice with backend tax calculation"
          maxWidth="md"
        >
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider font-medium text-muted">
                Select Authorized Order
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-surface-secondary text-foreground text-sm rounded-lg p-2.5 border border-border focus:border-primary focus:outline-none"
                required
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} — {o.customer_name || 'Guest'} — {formatCurrency(o.total_amount)} ({o.order_status})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Special Privilege Discount (INR ₹)"
              type="number"
              step="1"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              placeholder="0.00"
            />

            <Input
              label="Service / Kitchen Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Complimentary dessert discount"
            />

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setGenerateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isGenerating}>
                Generate Invoice
              </Button>
            </div>
          </form>
        </Modal>

        {/* Bill Details Modal */}
        {selectedBill && (
          <Modal
            isOpen={!!selectedBill}
            onClose={() => setSelectedBill(null)}
            title="Tax Invoice"
            subtitle={selectedBill.bill_number}
            maxWidth="md"
          >
            <div className="space-y-5">
              <div className="text-center pb-4 border-b border-border space-y-1">
                <span className="text-xs font-bold text-primary font-serif tracking-wider inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary/40 mx-auto">
                  RMS
                </span>
                <h3 className="font-serif text-xl uppercase tracking-widest text-foreground">
                  RMS
                </h3>
                <p className="text-[10px] text-muted">GST & Hospitality Tax Invoice</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted block">Billed To:</span>
                  <span className="font-medium text-foreground">{selectedBill.customer_name || 'Diner'}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted block">Issued Date:</span>
                  <span className="font-medium text-foreground">{formatDate(selectedBill.created_at)}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="font-mono text-foreground">{formatCurrency(selectedBill.subtotal)}</span>
                </div>
                {selectedBill.discount_amount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span className="font-mono">-{formatCurrency(selectedBill.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>
                    GST ({selectedBill.tax_percentage}%)
                  </span>
                  <span className="font-mono text-foreground">{formatCurrency(selectedBill.tax_amount)}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between font-bold text-base">
                  <span className="text-foreground">Total Invoiced</span>
                  <span className="font-mono text-primary">{formatCurrency(selectedBill.final_amount)}</span>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Update Payment Status Modal */}
        {editPaymentStatus && (
          <Modal
            isOpen={!!editPaymentStatus}
            onClose={() => setEditPaymentStatus(null)}
            title={`Update Payment Status`}
            subtitle={`Bill #${editPaymentStatus.bill_number}`}
            maxWidth="md"
          >
            <form onSubmit={handleUpdatePaymentStatus} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-medium text-muted">
                  Payment Status
                </label>
                <select
                  value={newPayStatus}
                  onChange={(e) => setNewPayStatus(e.target.value as any)}
                  className="w-full bg-surface-secondary text-foreground text-sm rounded-lg p-2.5 border border-border focus:border-primary focus:outline-none"
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setEditPaymentStatus(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Status
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Cancel Bill Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!billToCancel}
          onClose={() => setBillToCancel(null)}
          onConfirm={handleConfirmCancelBill}
          title="Cancel Bill / Invoice"
          description={`Are you sure you want to cancel Bill #${billToCancel?.bill_number}? This will permanently mark the invoice as cancelled in the ledger.`}
          confirmText="Confirm Cancellation"
          variant="danger"
          isLoading={isCancelling}
        />
      </div>
    );
  };
