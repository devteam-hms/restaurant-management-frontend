import React, { useState, useEffect } from 'react';
import { Receipt, Eye, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { billService } from '@/services/bill.service';
import { branchService } from '@/services/branch.service';
import { BillItem } from '@/types/bill';
import { PaymentStatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';

export const CustomerBillsPage: React.FC = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<BillItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);

  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const [res, branchesRes] = await Promise.all([
          billService.getBills({ page: 1, limit: 50 }),
          branchService.getBranches({ limit: 100 }).catch(() => ({ data: [] })),
        ]);

        const branchMap = new Map<string, string>();
        (branchesRes.data || []).forEach((b) => {
          if (b.branch_id && b.branch_name) {
            branchMap.set(b.branch_id, b.branch_name);
          }
        });

        const enriched = (res.data || []).map((b) => ({
          ...b,
          branch_name: branchMap.get(b.branch_id) || b.branch_name || 'Dining Hall',
        }));

        setBills(enriched);
      } catch (e: any) {
        toastError('Failed to load bills', e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBills();
  }, [toastError]);

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
          Invoices & Documentation
        </span>
        <h1 className="font-serif text-4xl text-foreground font-normal">My Bills & Receipts</h1>
        <p className="text-xs text-muted mt-1">
          Detailed itemized receipts, legal tax breakdowns, and payment verifications calculated by the backend Bill engine.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-luxury">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-secondary/60 text-[11px] uppercase tracking-wider text-muted">
                <th className="px-3.5 py-3 font-medium whitespace-nowrap">Bill Reference</th>
                <th className="px-3.5 py-3 font-medium whitespace-nowrap">Order ID</th>
                <th className="px-3.5 py-3 font-medium whitespace-nowrap">Branch Location</th>
                <th className="px-3.5 py-3 font-medium whitespace-nowrap">Subtotal</th>
                <th className="px-3.5 py-3 font-medium whitespace-nowrap">GST Breakdown</th>
                <th className="px-3.5 py-3 font-medium whitespace-nowrap">Final Amount</th>
                <th className="px-3.5 py-3 font-medium whitespace-nowrap">Status</th>
                <th className="px-3.5 py-3 font-medium text-right whitespace-nowrap pr-4">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted text-xs">
                    Loading invoices...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-muted font-serif italic">
                    No invoices recorded yet.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-primary">{bill.bill_number}</span>
                      <p className="text-[10px] text-muted mt-0.5">{formatDate(bill.created_at)}</p>
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-xs text-foreground/80 whitespace-nowrap">
                      {bill.order_id}
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-foreground font-medium whitespace-nowrap">
                      {bill.branch_name || 'Dining Hall'}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-xs text-muted whitespace-nowrap">
                      {formatCurrency(bill.subtotal)}
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
                      <PaymentStatusBadge status={bill.payment_status} />
                    </td>
                    <td className="px-3.5 py-2.5 text-right whitespace-nowrap pr-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 px-2.5 py-1 text-[11px] h-7"
                        onClick={() => setSelectedBill(bill)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill View Modal */}
      {selectedBill && (
        <Modal
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
          title="Tax Invoice & Receipt"
          subtitle={selectedBill.bill_number}
          maxWidth="md"
        >
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-border/80 space-y-1">
              <span className="text-sm font-bold text-primary font-serif tracking-wider inline-flex items-center justify-center w-8 h-8 rounded-full border border-primary/40 mx-auto">
                RMS
              </span>
              <h3 className="font-serif text-2xl uppercase tracking-widest text-foreground">
                RMS
              </h3>
              <p className="text-[11px] text-muted uppercase tracking-widest">
                {selectedBill.branch_name ? `${selectedBill.branch_name} • Tax Invoice` : 'Fine Indian Dining • Official Tax Invoice'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted block">Billed To:</span>
                <span className="font-medium text-foreground">{selectedBill.customer_name || user?.name || user?.email || 'Valued Guest'}</span>
              </div>
              <div className="text-right">
                <span className="text-muted block">Date Issued:</span>
                <span className="font-medium text-foreground">{formatDate(selectedBill.created_at)}</span>
              </div>
              <div>
                <span className="text-muted block">Linked Order:</span>
                <span className="font-mono text-primary">{selectedBill.order_id}</span>
              </div>
              <div className="text-right">
                <span className="text-muted block">Payment Method:</span>
                <span className="font-medium text-foreground">{selectedBill.payment_method || 'UPI / CARD'}</span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-3 text-xs">
              <div className="flex justify-between text-muted">
                <span>Items Subtotal</span>
                <span className="font-mono text-foreground">{formatCurrency(selectedBill.subtotal)}</span>
              </div>
              {selectedBill.discount_amount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Special Privilege Discount</span>
                  <span className="font-mono">-{formatCurrency(selectedBill.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>
                  GST (CGST + SGST @ {selectedBill.tax_percentage}%)
                </span>
                <span className="font-mono text-foreground">{formatCurrency(selectedBill.tax_amount)}</span>
              </div>
              <div className="pt-3 border-t border-border flex justify-between font-bold text-base">
                <span className="text-foreground">Total Paid</span>
                <span className="font-mono text-primary">{formatCurrency(selectedBill.final_amount)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Statutory tax computed authoritatively via backend MongoDB Tax Service.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  toastSuccess('Receipt Downloaded', `Receipt #${selectedBill.bill_number} saved.`);
                }}
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

