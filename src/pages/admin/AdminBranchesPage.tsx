import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit3, Trash2, UtensilsCrossed, Clock, Phone, MapPin, Mail } from 'lucide-react';
import { branchService } from '@/services/branch.service';
import { restaurantService } from '@/services/restaurant.service';
import { BranchItem } from '@/types/branch';
import { RestaurantItem } from '@/types/restaurant';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';

export const AdminBranchesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRestaurantId = searchParams.get('restaurant_id') || '';

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(initialRestaurantId);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  const [isSaving, setIsSaving] = useState(false);

  const { success, error: toastError } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bRes, rRes] = await Promise.all([
        branchService.getBranches({
          restaurant_id: selectedRestaurantId || undefined,
        }),
        restaurantService.getRestaurants(),
      ]);
      setBranches(bRes.data);
      setRestaurants(rRes.data);
      if (!selectedRestaurantId && rRes.data.length > 0) {
        setFormRestaurantId(rRes.data[0].restaurant_id);
      }
    } catch (e: any) {
      toastError('Failed to load branches', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRestaurantId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingBranch) {
        await branchService.updateBranch(editingBranch.branch_id, {
          branch_name: branchName,
          address,
          city,
          state,
          email,
          phone,
          opening_hours: openingHours,
          capacity,
        });
        success('Branch Updated', `${branchName} details saved.`);
      } else {
        await branchService.createBranch({
          restaurant_id: formRestaurantId,
          branch_name: branchName,
          address,
          city,
          state,
          email,
          phone,
          opening_hours: openingHours,
          capacity,
        });
        success('Branch Created', `${branchName} location established.`);
      }
      setModalOpen(false);
      loadData();
    } catch (e: any) {
      toastError('Operation Failed', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await branchService.deleteBranch(deletingId);
      success('Branch Removed', 'Branch deleted successfully.');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      loadData();
    } catch (e: any) {
      toastError('Delete Failed', e.message);
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

      <div className="px-8 space-y-6">
        {/* Restaurant Filter Bar */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
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
    </div>
  );
};

