import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Eye,
  Plus,
  CheckCircle,
  Download,
  XCircle,
  Store,
  CreditCard,
  FileText,
  UtensilsCrossed,
  Building2,
  GitBranch,
  Search,
} from 'lucide-react';
import { BillItem, PaymentMethod, PaymentStatus } from '@/types/bill';
import { OrderItemResponseModel } from '@/types/order';
import { BranchItem } from '@/types/branch';
import { RestaurantItem } from '@/types/restaurant';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { CustomSelect } from '@/components/common/CustomSelect';
import { PaymentStatusBadge } from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchBills,
  generateBill,
  updateBill,
  cancelBill,
} from '@/store/slices/billSlice';
import { fetchOrders } from '@/store/slices/orderSlice';
import { fetchRestaurants } from '@/store/slices/restaurantSlice';
import { fetchBranches } from '@/store/slices/branchSlice';

export const AdminBillsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: bills, isLoading } = useAppSelector((state) => state.bills);
  const { items: orders } = useAppSelector((state) => state.orders);
  const { items: restaurants, isLoading: loadingRestaurants } = useAppSelector((state) => state.restaurants);
  const { items: branches, isLoading: loadingBranches } = useAppSelector((state) => state.branches);

  // Hierarchy States (Restaurant -> Branch Filter)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [allBranches, setAllBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState<BillItem | null>(null);
  const [newPayStatus, setNewPayStatus] = useState<PaymentStatus>('PAID');
  const [billToCancel, setBillToCancel] = useState<BillItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const { success, error: toastError } = useToast();

  const getBranchInfo = (branchId: string): BranchItem | undefined => {
    return allBranches.find((b) => b.branch_id === branchId) || branches.find((b) => b.branch_id === branchId);
  };

  const loadData = async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    }

    try {
      await Promise.all([
        dispatch(fetchBills({ limit: 100 })),
        dispatch(fetchOrders({ limit: 100 })),
        dispatch(fetchRestaurants({ page: 1, limit: 100 })),
        dispatch(fetchBranches({ limit: 100 })),
      ]);
    } catch (e: any) {
      if (!silent) {
        toastError('Failed to load billing data', typeof e === 'string' ? e : e?.message || 'Error');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  useEffect(() => {
    loadData();
    // Live polling every 8s so newly generated bills sync automatically
    const interval = setInterval(() => {
      loadData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Branches when selected restaurant changes
  useEffect(() => {
    if (selectedRestaurantId) {
      dispatch(fetchBranches({ restaurant_id: selectedRestaurantId, limit: 100 }));
    } else {
      dispatch(fetchBranches({ limit: 100 }));
    }
    setSelectedBranchId('');
  }, [selectedRestaurantId, dispatch]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setIsGenerating(true);
    try {
      const newBill = await dispatch(
        generateBill({
          order_id: selectedOrderId,
          discount_amount: Number(discountAmount),
          payment_method: paymentMethod,
          notes,
        })
      ).unwrap();
      success('Bill Generated', `Invoice #${newBill.bill_number} generated successfully.`);
      setGenerateModalOpen(false);
      setDiscountAmount(0);
      setNotes('');
      loadData();
    } catch (e: any) {
      toastError('Generation Failed', typeof e === 'string' ? e : e?.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdatePaymentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPaymentStatus) return;
    try {
      await dispatch(
        updateBill({
          id: editPaymentStatus.id,
          payload: {
            payment_status: newPayStatus,
          },
        })
      ).unwrap();
      success(
        'Payment Status Updated',
        `Bill #${editPaymentStatus.bill_number} updated to ${newPayStatus}.`
      );
      setEditPaymentStatus(null);
      loadData();
    } catch (e: any) {
      toastError('Update Failed', typeof e === 'string' ? e : e?.message || 'Update failed');
    }
  };

  const handleConfirmCancelBill = async () => {
    if (!billToCancel) return;
    setIsCancelling(true);
    try {
      await dispatch(cancelBill({ id: billToCancel.id })).unwrap();
      success('Bill Cancelled', `Bill #${billToCancel.bill_number} has been cancelled.`);
      setBillToCancel(null);
      loadData();
    } catch (e: any) {
      toastError('Cancel Failed', typeof e === 'string' ? e : e?.message || 'Cancel failed');
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    // 1. Restaurant Filter
    if (selectedRestaurantId) {
      if (b.restaurant_id && b.restaurant_id !== selectedRestaurantId) {
        return false;
      }
      if (!b.restaurant_id && branches.length > 0) {
        const belongsToRestaurant = branches.some((br) => br.branch_id === b.branch_id);
        if (!belongsToRestaurant) return false;
      }
    }

    // 2. Branch Filter
    if (selectedBranchId && b.branch_id !== selectedBranchId) {
      return false;
    }

    // 3. Payment Status Filter
    if (paymentStatusFilter !== 'ALL' && b.payment_status !== paymentStatusFilter) {
      return false;
    }

    // 4. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const branch = getBranchInfo(b.branch_id);
      const branchName = branch?.branch_name || b.branch_name || '';
      const restName = b.restaurant_name || '';
      const matches =
        b.bill_number.toLowerCase().includes(q) ||
        b.order_id.toLowerCase().includes(q) ||
        (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
        branchName.toLowerCase().includes(q) ||
        restName.toLowerCase().includes(q) ||
        (b.transaction_id && b.transaction_id.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Bill & Invoice Management"
        subtitle="Itemized revenue documentation, statutory tax collection, and transaction records"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setGenerateModalOpen(true)}
            className="gap-1.5 shadow-gold-glow"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoicing Bill</span>
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Controls Toolbar: Search & Hierarchy Selectors */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-border shadow-luxury">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search bill #, order, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-muted" />}
              />
            </div>

            {/* Restaurant Selector */}
            <div className="min-w-[200px] sm:min-w-[220px]">
              <CustomSelect
                icon={<Building2 className="w-4 h-4" />}
                value={selectedRestaurantId}
                onChange={(val) => setSelectedRestaurantId(val)}
                disabled={loadingRestaurants}
                placeholder="All Restaurants"
                options={[
                  { value: '', label: 'All Restaurants' },
                  ...restaurants.map((r) => ({
                    value: r.restaurant_id,
                    label: r.restaurant_name,
                  })),
                ]}
              />
            </div>

            {/* Branch Selector */}
            <div className="min-w-[200px] sm:min-w-[220px]">
              <CustomSelect
                icon={<GitBranch className="w-4 h-4" />}
                value={selectedBranchId}
                onChange={(val) => setSelectedBranchId(val)}
                disabled={loadingBranches}
                placeholder={selectedRestaurantId ? 'All Branches in Restaurant' : 'All Branches'}
                options={[
                  {
                    value: '',
                    label: selectedRestaurantId ? 'All Branches in Restaurant' : 'All Branches',
                  },
                  ...branches.map((b) => ({
                    value: b.branch_id,
                    label: b.branch_name,
                    sublabel: b.city,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Payment Status Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {['ALL', 'PAID', 'PENDING', 'REFUNDED'].map((st) => (
              <button
                key={st}
                onClick={() => setPaymentStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all whitespace-nowrap ${
                  paymentStatusFilter === st
                    ? 'bg-primary text-background font-semibold shadow-gold-glow'
                    : 'bg-surface-secondary text-muted hover:text-foreground border border-border'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-luxury">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-secondary/60 text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Bill Number</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Order Ref</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Branch Location</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Subtotal</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Tax Breakdown</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Final Amount</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Payment Status</th>
                  <th className="px-3.5 py-3 font-medium text-right whitespace-nowrap pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted text-xs">
                      Loading invoices...
                    </td>
                  </tr>
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-muted font-serif italic">
                      {bills.length === 0
                        ? 'No bills generated yet. Click "Generate Invoicing Bill" to issue an invoice from an order.'
                        : 'No bills found matching your selected restaurant, branch, or search criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => {
                    const branch = getBranchInfo(bill.branch_id);
                    const branchDisplayName = branch?.branch_name || bill.branch_name || bill.branch_id;

                    return (
                      <tr key={bill.id} className="hover:bg-surface-secondary/40 transition-colors">
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-primary">
                              {bill.bill_number}
                            </span>
                            {bill.bill_status === 'CANCELLED' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-danger/10 text-danger border border-danger/30 font-semibold uppercase">
                                Cancelled
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted mt-0.5">{formatDate(bill.created_at)}</p>
                        </td>

                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className="font-mono text-xs text-foreground/90 block">
                            #{bill.order_id}
                          </span>
                          {bill.customer_id && (
                            <span className="text-[10px] font-mono text-muted truncate max-w-[120px] block mt-0.5" title={bill.customer_id}>
                              Cust: {bill.customer_id}
                            </span>
                          )}
                        </td>

                        {/* Real Branch Location */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div>
                            <span className="text-xs text-foreground font-medium flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="truncate max-w-[140px] xl:max-w-[180px]" title={branchDisplayName}>
                                {branchDisplayName}
                              </span>
                            </span>
                            {branch?.city && (
                              <p className="text-[10px] text-muted mt-0.5 ml-5">{branch.city}</p>
                            )}
                          </div>
                        </td>

                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className="font-mono text-xs text-muted block">
                            {formatCurrency(bill.subtotal)}
                          </span>
                          {bill.discount_amount > 0 && (
                            <span className="text-[10px] text-success font-medium block mt-0.5">
                              Disc: -{formatCurrency(bill.discount_amount)}
                            </span>
                          )}
                        </td>

                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="text-xs font-mono">
                            <span className="text-foreground">{formatCurrency(bill.tax_amount)}</span>
                            <span className="text-[10px] text-primary ml-1 font-sans">
                              ({bill.tax_percentage}%)
                            </span>
                          </div>
                        </td>

                        <td className="px-3.5 py-2.5 font-mono text-xs font-bold text-foreground whitespace-nowrap">
                          {formatCurrency(bill.final_amount)}
                        </td>

                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <PaymentStatusBadge status={bill.payment_status} />
                            <span className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border text-[9px] font-mono text-muted uppercase">
                              {bill.payment_method || 'CASH'}
                            </span>
                          </div>
                        </td>

                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2 py-1 text-[11px] h-7 gap-1"
                              onClick={() => setSelectedBill(bill)}
                              title="View Formal Invoice"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </Button>

                            <Button
                              variant="gold-outline"
                              size="sm"
                              className="px-2.5 py-1 text-[11px] h-7"
                              onClick={() => {
                                setEditPaymentStatus(bill);
                                setNewPayStatus(bill.payment_status);
                              }}
                              title="Update Payment Status"
                            >
                              <span>Status</span>
                            </Button>

                            {bill.bill_status !== 'CANCELLED' && (
                              <Button
                                variant="danger"
                                size="sm"
                                className="p-1.5 h-7 w-7"
                                onClick={() => setBillToCancel(bill)}
                                title="Cancel Bill"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Bill Modal */}
      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate Bill from Order"
        subtitle="Issues a formal invoice with authoritative backend tax calculation"
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
              className="w-full bg-surface-secondary text-foreground text-sm rounded-xl px-3.5 py-3 border border-border focus:border-primary focus:outline-none"
              required
            >
              {(() => {
                const availableOrders = orders.filter((o) => {
                  if (selectedBranchId) return o.branch_id === selectedBranchId;
                  if (selectedRestaurantId && o.restaurant_id) return o.restaurant_id === selectedRestaurantId;
                  return true;
                });
                const displayOrders = availableOrders.length > 0 ? availableOrders : orders;
                return displayOrders.map((o) => {
                  const branch = getBranchInfo(o.branch_id);
                  const bName = branch?.branch_name || o.branch_name || '';
                  return (
                    <option key={o.id} value={o.id}>
                      #{o.id} {bName ? `• ${bName}` : ''} — {formatCurrency(o.total_amount)} ({o.order_status})
                    </option>
                  );
                });
              })()}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider font-medium text-muted">
              Settlement Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full bg-surface-secondary text-foreground text-sm rounded-xl px-3.5 py-3 border border-border focus:border-primary focus:outline-none"
            >
              <option value="CASH">CASH (Physical Currency)</option>
              <option value="CARD">CARD (Credit / Debit Terminal)</option>
              <option value="UPI">UPI (Unified Payments Interface)</option>
              <option value="ONLINE">ONLINE (Digital Payment Gateway)</option>
            </select>
          </div>

          <Input
            label="Special Privilege Discount (INR ₹)"
            type="number"
            step="1"
            min="0"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
            placeholder="0.00"
          />

          <Input
            label="Service / Kitchen Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Corporate dining privilege concession"
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

      {/* Bill Details Modal (Fine-Dining Tax Invoice) */}
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
              <span className="text-xs font-bold text-primary font-serif tracking-wider inline-flex items-center justify-center w-8 h-8 rounded-full border border-primary/40 mx-auto">
                RMS
              </span>
              <h3 className="font-serif text-xl uppercase tracking-widest text-foreground">
                RMS Fine Dining
              </h3>
              <p className="text-[10px] text-muted">GST & Statutory Hospitality Tax Invoice</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted block text-[11px]">Branch Location:</span>
                <span className="font-medium text-foreground">
                  {(() => {
                    const b = getBranchInfo(selectedBill.branch_id);
                    return b ? `${b.branch_name} (${b.city})` : selectedBill.branch_name || selectedBill.branch_id;
                  })()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted block text-[11px]">Issued Date:</span>
                <span className="font-medium text-foreground">{formatDate(selectedBill.created_at)}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px]">Associated Order:</span>
                <span className="font-mono font-medium text-primary">#{selectedBill.order_id}</span>
              </div>
              <div className="text-right">
                <span className="text-muted block text-[11px]">Payment Mode:</span>
                <span className="font-mono font-medium text-foreground uppercase">
                  {selectedBill.payment_method || 'CASH'} ({selectedBill.payment_status})
                </span>
              </div>
            </div>

            {/* Itemized Courses Breakdown if items exist */}
            {selectedBill.items && selectedBill.items.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <span className="text-[11px] uppercase tracking-wider text-muted font-medium flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
                  <span>Itemized Courses</span>
                </span>
                <div className="rounded-xl border border-border/80 bg-surface-secondary/70 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border/60 text-[10px] uppercase text-muted bg-surface-secondary">
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Price</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                      {selectedBill.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-surface/50">
                          <td className="p-2.5 font-sans font-medium text-foreground">
                            {it.menu_name}
                          </td>
                          <td className="p-2.5 text-center text-muted">{it.quantity}</td>
                          <td className="p-2.5 text-right text-muted">{formatCurrency(it.unit_price)}</td>
                          <td className="p-2.5 text-right font-semibold text-foreground">
                            {formatCurrency(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="font-mono text-foreground">{formatCurrency(selectedBill.subtotal)}</span>
              </div>
              {selectedBill.discount_amount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Privilege Concession / Discount</span>
                  <span className="font-mono font-semibold">
                    -{formatCurrency(selectedBill.discount_amount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Statutory GST ({selectedBill.tax_percentage}%)</span>
                <span className="font-mono text-foreground">{formatCurrency(selectedBill.tax_amount)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between font-bold text-base">
                <span className="text-foreground">Total Invoiced Amount</span>
                <span className="font-mono text-primary">{formatCurrency(selectedBill.final_amount)}</span>
              </div>
            </div>

            <div className="text-center pt-2 text-[11px] text-muted italic">
              Thank you for dining with us. GST invoices are filed authoritatively into ledger records.
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
                onChange={(e) => setNewPayStatus(e.target.value as PaymentStatus)}
                className="w-full bg-surface-secondary text-foreground text-sm rounded-xl px-3.5 py-3 border border-border focus:border-primary focus:outline-none"
              >
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
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
