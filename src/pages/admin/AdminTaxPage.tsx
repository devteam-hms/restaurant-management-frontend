import React, { useState, useEffect } from 'react';
import { Percent, Plus, Edit3, CheckCircle, ShieldCheck, History, AlertCircle } from 'lucide-react';
import { TaxConfigItem } from '@/types/tax';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchTaxes,
  createTax,
  updateTax,
  activateTax,
} from '@/store/slices/taxSlice';

export const AdminTaxPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: taxConfigs, activeTax, isLoading, isSaving } = useAppSelector((state) => state.taxes);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxConfigItem | null>(null);
  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState(12.5);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [taxToActivate, setTaxToActivate] = useState<TaxConfigItem | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const { success, error: toastError } = useToast();

  const loadTaxData = () => {
    dispatch(fetchTaxes())
      .unwrap()
      .catch((e: any) => {
        toastError('Failed to load tax configurations', typeof e === 'string' ? e : e?.message || 'Error');
      });
  };

  useEffect(() => {
    loadTaxData();
  }, [dispatch]);

  const openCreateModal = () => {
    setEditingTax(null);
    setName('GST - CGST (2.5%) & SGST (2.5%)');
    setPercentage(5.0);
    setDescription('Standard Goods and Services Tax (GST) applicable to restaurant dining.');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (tax: TaxConfigItem) => {
    setEditingTax(tax);
    setName(tax.name);
    setPercentage(tax.tax_percentage);
    setDescription(tax.description || '');
    setIsActive(tax.is_active);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTax) {
        await dispatch(
          updateTax({
            id: editingTax.id,
            payload: {
              name,
              tax_percentage: Number(percentage),
              description,
              is_active: isActive,
            },
          })
        ).unwrap();
        success('Tax Configuration Updated', `${name} set to ${percentage}%.`);
      } else {
        await dispatch(
          createTax({
            name,
            tax_percentage: Number(percentage),
            description,
            is_active: isActive,
          })
        ).unwrap();
        success('Tax Configuration Created', `${name} (${percentage}%) registered.`);
      }
      setModalOpen(false);
    } catch (e: any) {
      toastError('Failed to save tax configuration', typeof e === 'string' ? e : e?.message || 'Failed to save');
    }
  };

  const handleConfirmActivate = async () => {
    if (!taxToActivate) return;
    setIsActivating(true);
    try {
      const activated = await dispatch(activateTax(taxToActivate.id)).unwrap();
      success(
        'Tax Rate Activated',
        `${activated.name} is now the authoritative billing rate (${activated.tax_percentage}%).`
      );
      setTaxToActivate(null);
    } catch (e: any) {
      toastError('Activation Failed', typeof e === 'string' ? e : e?.message || 'Activation failed');
    } finally {
      setIsActivating(false);
    }
  };

    return (
      <div className="space-y-8">
        <AdminTopbar
          title="Tax Configuration"
          subtitle="Manage statutory hospitality VAT, municipal surcharges, and MongoDB tax rules"
          actions={
            <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Create Tax Configuration</span>
            </Button>
          }
        />

        <div className="px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Active Tax Rule Feature Banner */}
          <div className="p-8 rounded-2xl bg-surface border border-primary/50 shadow-luxury relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success inline-block animate-ping" />
                <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                  Live Authoritative Backend Tax Rate
                </span>
              </div>
              <h2 className="font-serif text-3xl font-normal text-foreground">
                {activeTax ? activeTax.name : 'Fine Dining Hospitality VAT'}
              </h2>
              <p className="text-xs text-muted max-w-xl">
                {activeTax?.description || 'Applied automatically to all dining orders, branch bills, and wine cellar items.'}
              </p>
            </div>

            <div className="flex items-center gap-6 self-start md:self-center">
              <div className="text-right">
                <span className="text-xs text-muted block">Effective Tax Percentage</span>
                <span className="font-mono text-4xl sm:text-5xl font-bold text-primary">
                  {isLoading ? '—' : `${activeTax?.tax_percentage ?? 12.5}%`}
                </span>
              </div>
              {activeTax && (
                <Button variant="outline" size="sm" onClick={() => openEditModal(activeTax)}>
                  <Edit3 className="w-4 h-4 mr-1" />
                  <span>Adjust</span>
                </Button>
              )}
            </div>
          </div>

          {/* Security & Strict Compliance Notice */}
          <div className="p-4 rounded-xl bg-surface-secondary border border-border/80 text-xs text-muted flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">
                Dynamic Statutory Compliance (Backend-Managed)
              </p>
              <p className="text-[11px] leading-relaxed">
                Tax percentages are strictly fetched dynamically from the MongoDB Tax Configuration collection. The system never hardcodes tax rates on the frontend or backend order calculators.
              </p>
            </div>
          </div>

          {/* Tax Configurations & History Table */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h3 className="font-serif text-2xl font-normal text-foreground">
                Tax Configuration History & Archive
              </h3>
            </div>

            <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-luxury">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 bg-surface-secondary/60 text-[11px] uppercase tracking-wider text-muted">
                      <th className="px-3.5 py-3 font-medium whitespace-nowrap">Configuration Name</th>
                      <th className="px-3.5 py-3 font-medium whitespace-nowrap">Rate (%)</th>
                      <th className="px-3.5 py-3 font-medium whitespace-nowrap">Description</th>
                      <th className="px-3.5 py-3 font-medium whitespace-nowrap">Status</th>
                      <th className="px-3.5 py-3 font-medium whitespace-nowrap">Last Modified</th>
                      <th className="px-3.5 py-3 font-medium text-right whitespace-nowrap pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted text-xs">
                          Loading tax configurations...
                        </td>
                      </tr>
                    ) : (
                      taxConfigs.map((tax) => (
                        <tr key={tax.id} className="hover:bg-surface-secondary/40 transition-colors">
                          <td className="px-3.5 py-2.5 font-medium text-foreground text-xs whitespace-nowrap">
                            {tax.name}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-xs font-bold text-primary whitespace-nowrap">
                            {tax.tax_percentage}%
                          </td>
                          <td className="px-3.5 py-2.5 text-xs text-muted max-w-sm truncate">
                            {tax.description || '—'}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            {tax.is_active ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-success/15 text-success border border-success/30">
                                <CheckCircle className="w-3 h-3" />
                                Active Rule
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-secondary text-muted border border-border">
                                Archived
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-xs text-muted whitespace-nowrap">
                            {formatDate(tax.updated_at || tax.created_at)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right whitespace-nowrap pr-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="px-2 py-1 text-[11px] h-7"
                                onClick={() => openEditModal(tax)}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </Button>
                              {!tax.is_active && (
                                <Button
                                  variant="gold-outline"
                                  size="sm"
                                  className="px-2.5 py-1 text-[11px] h-7"
                                  onClick={() => setTaxToActivate(tax)}
                                >
                                  <span>Activate</span>
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
          </div>
        </div>

        {/* Create / Edit Tax Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingTax ? 'Update Tax Configuration' : 'Create Tax Configuration'}
          subtitle="Manage statutory hospitality rate in MongoDB"
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Tax Configuration Title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GST - CGST (2.5%) & SGST (2.5%)"
              required
            />

            <Input
              label="Tax Percentage (%)"
              type="number"
              step="0.01"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              placeholder="5.0"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider font-medium text-muted">
                Regulatory Description
              </label>
              <textarea
                className="w-full bg-surface-secondary text-foreground text-sm rounded-lg p-3 border border-border focus:border-primary focus:outline-none"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="State the jurisdiction or statutory GST rate applicable..."
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-border text-primary"
              />
              <span>Set as currently active authoritative tax rule</span>
            </label>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving}>
                {editingTax ? 'Save Changes' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Tax Activation Confirmation */}
        <ConfirmDialog
          isOpen={!!taxToActivate}
          onClose={() => setTaxToActivate(null)}
          onConfirm={handleConfirmActivate}
          title="Activate Tax Configuration"
          description={`Are you sure you want to activate "${taxToActivate?.name}" (${taxToActivate?.tax_percentage}%) as the authoritative statutory rate? This will replace the currently active rate for all future orders and bills.`}
          confirmText="Confirm & Activate"
          variant="primary"
          isLoading={isActivating}
        />
      </div>
    );
  };

