import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Edit3,
  Trash2,
  UtensilsCrossed,
  Clock,
  Phone,
  MapPin,
  Mail,
  QrCode,
  Download,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '@/store/slices/branchSlice';
import { fetchRestaurants } from '@/store/slices/restaurantSlice';
import { BranchItem, BranchQRDetails } from '@/types/branch';
import { branchService, resolveQRImageUrl } from '@/services/branch.service';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';

export const AdminBranchesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRestaurantId = searchParams.get('restaurant_id') || '';

  const dispatch = useAppDispatch();
  const { items: branches, isLoading, isSaving } = useAppSelector((state) => state.branches);
  const { items: restaurants } = useAppSelector((state) => state.restaurants);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState(initialRestaurantId);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // QR Modal states
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrBranch, setQrBranch] = useState<BranchItem | null>(null);
  const [qrDetails, setQrDetails] = useState<BranchQRDetails | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [isQrGenerating, setIsQrGenerating] = useState(false);
  const [isQrDownloading, setIsQrDownloading] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  // Form states
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [openingHours, setOpeningHours] = useState('18:00 – 23:30');
  const [capacity, setCapacity] = useState(60);
  const [formRestaurantId, setFormRestaurantId] = useState('');

  const { success, error: toastError } = useToast();

  useEffect(() => {
    dispatch(fetchBranches({ restaurant_id: selectedRestaurantId || undefined }));
    dispatch(fetchRestaurants());
  }, [dispatch, selectedRestaurantId]);

  useEffect(() => {
    if (!formRestaurantId && restaurants.length > 0) {
      setFormRestaurantId(selectedRestaurantId || restaurants[0].restaurant_id);
    }
  }, [restaurants, selectedRestaurantId, formRestaurantId]);

  const openCreateModal = () => {
    setEditingBranch(null);
    setBranchName('');
    setAddress('Block C, Connaught Place');
    setCity('New Delhi');
    setState('Delhi');
    setEmail('cp@saffronspice.com');
    setPhone('+91 98110 56789');
    setOpeningHours('12:00 – 23:30 (Daily)');
    setCapacity(80);
    setFormRestaurantId(selectedRestaurantId || restaurants[0]?.restaurant_id || '');
    setModalOpen(true);
  };

  const openEditModal = (b: BranchItem) => {
    setEditingBranch(b);
    setBranchName(b.branch_name);
    setAddress(b.address);
    setCity(b.city);
    setState(b.state);
    setEmail(b.email);
    setPhone(b.phone || '');
    setOpeningHours(b.opening_hours || '18:00 – 23:30');
    setCapacity(b.capacity || 60);
    setFormRestaurantId(b.restaurant_id);
    setModalOpen(true);
  };

  const openQrModal = async (branch: BranchItem) => {
    setQrBranch(branch);
    setQrDetails(null);
    setQrModalOpen(true);
    setIsQrLoading(true);

    try {
      const res = await branchService.getBranchQR(branch.branch_id);
      setQrDetails(res.data);
    } catch (e) {
      console.warn('Could not fetch branch QR code:', e);
      setQrDetails(null);
    } finally {
      setIsQrLoading(false);
    }
  };

  const handleGenerateBranchQr = async (regenerate: boolean = false) => {
    if (!qrBranch) return;
    setIsQrGenerating(true);
    try {
      const res = await branchService.generateBranchQR(qrBranch.branch_id, regenerate);
      setQrDetails(res.data);
      success(
        regenerate
          ? 'New QR code generated successfully.'
          : 'Branch QR code ready.'
      );
    } catch (e: any) {
      toastError(e.message || 'Failed to generate QR code.');
    } finally {
      setIsQrGenerating(false);
    }
  };

  const handleDownloadBranchQr = async () => {
    if (!qrBranch) return;
    setIsQrDownloading(true);
    try {
      await branchService.downloadBranchQR(qrBranch.branch_id, qrBranch.branch_name);
      success('QR Code downloaded.');
    } catch (e: any) {
      toastError(e.message || 'Failed to download QR code.');
    } finally {
      setIsQrDownloading(false);
    }
  };

  const handleCopyQrUrl = () => {
    if (!qrDetails?.menu_url) return;
    navigator.clipboard.writeText(qrDetails.menu_url);
    setQrCopied(true);
    success('Menu URL copied to clipboard.');
    setTimeout(() => setQrCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await dispatch(
          updateBranch({
            id: editingBranch.branch_id,
            payload: {
              branch_name: branchName,
              address,
              city,
              state,
              email,
              phone,
              opening_hours: openingHours,
              capacity,
            },
            restaurantId: selectedRestaurantId || undefined,
          })
        ).unwrap();
        success('Branch Updated', `${branchName} details saved.`);
      } else {
        await dispatch(
          createBranch({
            restaurant_id: formRestaurantId,
            branch_name: branchName,
            address,
            city,
            state,
            email,
            phone,
            opening_hours: openingHours,
            capacity,
          })
        ).unwrap();
        success('Branch Created', `${branchName} location established.`);
      }
      setModalOpen(false);
    } catch (e: any) {
      toastError('Operation Failed', typeof e === 'string' ? e : e.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await dispatch(
        deleteBranch({
          id: deletingId,
          restaurantId: selectedRestaurantId || undefined,
        })
      ).unwrap();
      success('Branch Removed', 'Branch deleted successfully.');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    } catch (e: any) {
      toastError('Delete Failed', typeof e === 'string' ? e : e.message);
    }
  };

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Branch Management"
        subtitle="Manage global salon locations, floor capacities, and reservations"
        actions={
          <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Create Branch</span>
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Restaurant Filter Bar */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedRestaurantId('')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${selectedRestaurantId === ''
                ? 'bg-primary text-background font-semibold shadow-gold-glow'
                : 'bg-surface text-muted hover:text-foreground border border-border'
              }`}
          >
            All Brands ({restaurants.length})
          </button>
          {restaurants.map((r) => (
            <button
              key={r.restaurant_id}
              onClick={() => setSelectedRestaurantId(r.restaurant_id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all whitespace-nowrap ${selectedRestaurantId === r.restaurant_id
                  ? 'bg-primary text-background font-semibold shadow-gold-glow'
                  : 'bg-surface text-muted hover:text-foreground border border-border'
                }`}
            >
              {r.restaurant_name}
            </button>
          ))}
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-surface animate-pulse" />
            ))
          ) : branches.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted font-serif italic">
              No branch locations found for this restaurant concept.
            </div>
          ) : (
            branches.map((b) => (
              <div
                key={b.branch_id}
                className="p-6 rounded-2xl border border-border bg-surface shadow-luxury hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {b.city}, {b.state}
                    </span>
                    <span className="text-xs font-mono text-muted">Cap: {b.capacity || 60} covers</span>
                  </div>

                  <h3 className="font-serif text-2xl font-normal text-foreground">{b.branch_name}</h3>
                  <p className="text-xs text-muted flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{b.address}</span>
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-muted border-t border-border/60 pt-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{b.opening_hours || '18:00 – 23:30'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>{b.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    <span>{b.email}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openQrModal(b)} className="gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs">QR Code</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(b)}>
                    <Edit3 className="w-4 h-4 text-muted hover:text-foreground" />
                    <span className="text-xs ml-1">Edit</span>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setDeletingId(b.branch_id);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-xs ml-1">Delete</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Branch Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBranch ? 'Edit Branch Location' : 'Establish New Branch'}
        subtitle="Specify branch address, contact, and guest seating capacity"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingBranch && (
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider font-medium text-muted">
                Assign to Restaurant Brand
              </label>
              <select
                value={formRestaurantId}
                onChange={(e) => setFormRestaurantId(e.target.value)}
                className="w-full bg-surface-secondary text-foreground text-sm rounded-lg p-2.5 border border-border focus:border-primary focus:outline-none"
                required
              >
                {restaurants.map((r) => (
                  <option key={r.restaurant_id} value={r.restaurant_id}>
                    {r.restaurant_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Branch Name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="e.g. The Bengal Table — Park Street Flagship"
            required
          />

          <Input
            label="Street Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="18 Park Street, Central Kolkata"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Kolkata"
              required
            />
            <Input
              label="State / Region"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="West Bengal"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parkstreet@bengaltable.com"
              required
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98301 23456"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Opening Hours"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="18:00 – 23:30"
            />
            <Input
              label="Cover Capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingBranch ? 'Save Changes' : 'Create Branch'}
            </Button>
          </div>
        </form>
      </Modal>

        {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Branch"
      description="Deleting this branch will remove its active booking slot availability. Ensure no live orders are pending."
      confirmText="Confirm Delete"
      variant="danger"
      />

      {/* Branch QR Management Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={`Branch QR Code — ${qrBranch?.branch_name || 'Branch'}`}
      >
        <div className="space-y-5">
          {/* Informative Table Message Requirement */}
          <div className="p-3.5 rounded-lg bg-surface-secondary border border-border text-xs text-muted leading-relaxed">
            <p className="m-0 italic">
              "This QR code can be placed on all tables in this restaurant branch. Customers scanning it will automatically access this branch's digital menu."
            </p>
          </div>

          {/* QR Preview Card */}
          <div className="flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-border text-center space-y-3">
            {isQrLoading ? (
              <div className="py-8 text-xs text-muted animate-pulse">Loading QR Code...</div>
            ) : qrDetails?.public_menu_code ? (
              <>
                <div className="p-3 bg-white rounded-xl shadow-md inline-block border border-gray-100">
                  <img
                    src={resolveQRImageUrl(qrDetails?.qr_preview_url, qrBranch?.branch_id, qrDetails?.menu_url)}
                    alt={`QR Code for ${qrBranch?.branch_name}`}
                    className="w-48 h-48 object-contain"
                    onError={(e) => {
                      if (qrDetails?.menu_url) {
                        const fallback = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDetails.menu_url)}`;
                        if ((e.target as HTMLImageElement).src !== fallback) {
                          (e.target as HTMLImageElement).src = fallback;
                        }
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <Check className="w-3 h-3" />
                    Status: Active
                  </div>
                  <div className="text-[11px] font-mono text-muted">
                    Code: {qrDetails.public_menu_code}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-6 space-y-2">
                <div className="w-14 h-14 rounded-full bg-surface-secondary flex items-center justify-center mx-auto text-muted">
                  <QrCode className="w-7 h-7 opacity-40" />
                </div>
                <div className="text-xs text-muted font-medium">QR Code Not Yet Generated</div>
                <p className="text-[11px] text-muted max-w-xs">
                  Generate a unique table QR code for this branch.
                </p>
              </div>
            )}
          </div>

          {/* Customer URL & Copy */}
          {qrDetails?.menu_url && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">
                Digital Menu URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={qrDetails.menu_url}
                  className="flex-1 h-9 px-3 text-xs font-mono rounded-lg border border-border bg-surface text-foreground select-all"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyQrUrl}
                  className="h-9 px-3 gap-1"
                >
                  {qrCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-xs">{qrCopied ? 'Copied' : 'Copy'}</span>
                </Button>
                <a
                  href={qrDetails.menu_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-border bg-surface text-foreground hover:bg-surface-secondary text-xs gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Visit</span>
                </a>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
            {qrDetails?.public_menu_code ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateBranchQr(true)}
                  isLoading={isQrGenerating}
                  className="gap-1.5 text-xs text-muted hover:text-foreground"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setQrModalOpen(false)}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDownloadBranchQr}
                    isLoading={isQrDownloading}
                    className="gap-1.5 shadow-gold-glow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setQrModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleGenerateBranchQr(false)}
                  isLoading={isQrGenerating}
                  className="gap-1.5 shadow-gold-glow"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Generate QR Code</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

