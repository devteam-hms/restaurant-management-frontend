import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Building2,
  GitBranch,
  Search,
  Store,
  UtensilsCrossed,
  Filter
} from 'lucide-react';
import { menuService } from '@/services/menu.service';
import { branchService } from '@/services/branch.service';
import { restaurantService } from '@/services/restaurant.service';
import { MenuItem } from '@/types/menu';
import { BranchItem } from '@/types/branch';
import { RestaurantItem } from '@/types/restaurant';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { CustomSelect } from '@/components/common/CustomSelect';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchMenusByBranch,
  createMenu,
  updateMenu,
  deleteMenu,
} from '@/store/slices/menuSlice';
import { fetchBranches } from '@/store/slices/branchSlice';
import { fetchRestaurants } from '@/store/slices/restaurantSlice';

export const AdminMenuPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: restaurants, isLoading: loadingRestaurants } = useAppSelector((state) => state.restaurants);
  const { items: branches, isLoading: loadingBranches } = useAppSelector((state) => state.branches);
  const { items: menus, isLoading } = useAppSelector((state) => state.menus);

  // Hierarchy Selection States
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [menuName, setMenuName] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [price, setPrice] = useState(399);
  const [category, setCategory] = useState('Biryani');
  const [imageUrl, setImageUrl] = useState('');
  const [isSignature, setIsSignature] = useState(false);
  const [availability, setAvailability] = useState(true);
  const [dietaryTagsStr, setDietaryTagsStr] = useState('Signature, Non-Vegetarian');
  const [isSaving, setIsSaving] = useState(false);

  const { success, error: toastError } = useToast();

  // 1. Fetch Restaurants on initial mount via Redux
  useEffect(() => {
    dispatch(fetchRestaurants({ page: 1, limit: 100 }))
      .unwrap()
      .then((res) => {
        if (res.data.length > 0 && !selectedRestaurantId) {
          setSelectedRestaurantId(res.data[0].restaurant_id);
        }
      })
      .catch((err: any) => {
        toastError('Failed to load restaurants', err);
      });
  }, [dispatch]);

  // Keep selectedRestaurantId valid
  useEffect(() => {
    if (restaurants.length > 0 && (!selectedRestaurantId || !restaurants.some(r => r.restaurant_id === selectedRestaurantId))) {
      setSelectedRestaurantId(restaurants[0].restaurant_id);
    }
  }, [restaurants, selectedRestaurantId]);

  // 2. Fetch Branches when restaurant changes via Redux
  useEffect(() => {
    if (!selectedRestaurantId) {
      setSelectedBranchId('');
      return;
    }

    dispatch(fetchBranches({ restaurant_id: selectedRestaurantId }))
      .unwrap()
      .then((res) => {
        if (res.data.length > 0) {
          const firstBranchId = res.data[0].branch_id;
          setSelectedBranchId(firstBranchId);
          dispatch(fetchMenusByBranch({ branchId: firstBranchId, params: { limit: 100 } }));
        } else {
          setSelectedBranchId('');
        }
      })
      .catch((err: any) => {
        toastError('Failed to load branches', err);
        setSelectedBranchId('');
      });
  }, [selectedRestaurantId, dispatch]);

  const loadMenuItems = (bId: string) => {
    if (!bId) return;
    dispatch(fetchMenusByBranch({ branchId: bId, params: { limit: 100 } }));
  };

  const handleRestaurantChange = (newRestId: string) => {
    setSelectedRestaurantId(newRestId);
  };

  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
    loadMenuItems(newBranchId);
  };

  const currentRestaurant = useMemo(
    () => restaurants.find((r) => r.restaurant_id === selectedRestaurantId),
    [restaurants, selectedRestaurantId]
  );

  const currentBranch = useMemo(
    () => branches.find((b) => b.branch_id === selectedBranchId),
    [branches, selectedBranchId]
  );

  const filteredMenus = useMemo(() => {
    if (!searchQuery.trim()) return menus;
    const query = searchQuery.toLowerCase().trim();
    return menus.filter((item) => {
      return (
        item.menu_name.toLowerCase().includes(query) ||
        (item.short_description && item.short_description.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query))
      );
    });
  }, [menus, searchQuery]);

  const openCreateModal = () => {
    setEditingItem(null);
    setMenuName('');
    setShortDesc('');
    setLongDesc('');
    setPrice(399);
    setCategory('Biryani');
    setImageUrl('https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80');
    setIsSignature(true);
    setAvailability(true);
    setDietaryTagsStr('Signature, Non-Vegetarian');
    setModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setMenuName(item.menu_name);
    setShortDesc(item.short_description || '');
    setLongDesc(item.long_description || '');
    setPrice(item.price);
    setCategory(item.category || 'Mains');
    setImageUrl(item.image || '');
    setIsSignature(item.is_signature ?? false);
    setAvailability(item.status === 1);
    setDietaryTagsStr((item.dietary_tags || []).join(', '));
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      toastError('Branch Required', 'Please select a branch before adding dishes.');
      return;
    }
    setIsSaving(true);
    try {
      if (editingItem) {
        await dispatch(
          updateMenu({
            branchId: selectedBranchId,
            menuId: editingItem.id,
            payload: {
              menu_name: menuName,
              short_description: shortDesc,
              long_description: longDesc,
              price: Number(price),
              category,
              image: imageUrl,
              status: availability ? 1 : 0,
              is_signature: editingItem.is_signature ?? false,
              dietary_tags: editingItem.dietary_tags || [],
            },
          })
        ).unwrap();
        success('Menu Item Updated', `${menuName} updated successfully.`);
      } else {
        await dispatch(
          createMenu({
            branch_id: selectedBranchId,
            menu_name: menuName,
            short_description: shortDesc,
            long_description: longDesc,
            price: Number(price),
            category: 'Mains',
            image: imageUrl,
            availability,
            is_signature: false,
            dietary_tags: [],
          })
        ).unwrap();
        success('Menu Item Created', `${menuName} added to ${currentBranch?.branch_name || 'branch'}.`);
      }
      setModalOpen(false);
    } catch (e: any) {
      toastError('Save Failed', typeof e === 'string' ? e : e?.message || 'Failed to save menu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId || !selectedBranchId) return;
    try {
      await dispatch(deleteMenu({ branchId: selectedBranchId, menuId: deletingId })).unwrap();
      success('Item Removed', 'Menu item removed from branch.');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    } catch (e: any) {
      toastError('Delete Failed', typeof e === 'string' ? e : e?.message || 'Failed to delete');
    }
  };

  const toggleItemStatus = async (item: MenuItem) => {
    try {
      const branchId = item.branch_id || selectedBranchId;
      const newStatus = item.status === 1 ? 0 : 1;
      await dispatch(
        updateMenu({
          branchId,
          menuId: item.id,
          payload: {
            status: newStatus,
          },
        })
      ).unwrap();
      success('Status Toggled', `${item.menu_name} is now ${newStatus === 1 ? 'Available' : 'Unavailable'}.`);
    } catch (e: any) {
      toastError('Toggle Failed', typeof e === 'string' ? e : e?.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Menu Management"
        subtitle="Configure regional menus, dish pricing, and kitchen availability"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            disabled={!selectedBranchId}
            className="gap-1.5 shadow-gold-glow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Dish</span>
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
        {/* SECTION: Location Selection Bar (Restaurant & Branch Selector) */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-luxury">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                  Location Hierarchy
                </span>
                <h3 className="font-serif text-lg font-normal text-foreground">
                  Select Restaurant & Branch
                </h3>
                <p className="text-xs text-muted">
                  Choose destination and branch to load or publish dishes
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              {/* Restaurant Select Dropdown */}
              <div className="w-full sm:w-64">
                <CustomSelect
                  label="Restaurant"
                  icon={<Building2 className="w-5 h-5" />}
                  value={selectedRestaurantId}
                  onChange={(val) => handleRestaurantChange(val)}
                  disabled={loadingRestaurants || restaurants.length === 0}
                  placeholder={restaurants.length === 0 ? 'No restaurants found' : 'Select Restaurant'}
                  options={restaurants.map((r) => ({
                    value: r.restaurant_id,
                    label: r.restaurant_name,
                  }))}
                />
              </div>

              {/* Branch Select Dropdown */}
              <div className="w-full sm:w-64">
                <CustomSelect
                  label="Branch Location"
                  icon={<GitBranch className="w-5 h-5" />}
                  value={selectedBranchId}
                  onChange={(val) => handleBranchChange(val)}
                  disabled={loadingBranches || branches.length === 0}
                  placeholder={branches.length === 0 ? 'No branches under this restaurant' : 'Select Branch'}
                  options={branches.map((b) => ({
                    value: b.branch_id,
                    label: b.branch_name,
                    sublabel: b.city ? `${b.city} (Capacity: ${b.capacity})` : undefined,
                  }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Search Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search dishes by name or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-muted" />}
            />
          </div>
          <span className="text-xs text-muted font-medium pr-1">
            Showing {filteredMenus.length} {filteredMenus.length === 1 ? 'dish' : 'dishes'}
          </span>
        </div>

        {/* SECTION: Menu Items Table */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-luxury">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-secondary/60 text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-3.5 font-medium whitespace-nowrap">Menu Details</th>
                  <th className="px-4 py-3.5 font-medium whitespace-nowrap">Price</th>
                  <th className="px-4 py-3.5 font-medium whitespace-nowrap">Service Availability</th>
                  <th className="px-4 py-3.5 font-medium text-right whitespace-nowrap pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-muted text-xs">
                      Loading dishes from branch...
                    </td>
                  </tr>
                ) : branches.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center text-muted font-serif italic">
                      No branches found for {currentRestaurant?.restaurant_name || 'this restaurant'}. Please create a branch first.
                    </td>
                  </tr>
                ) : filteredMenus.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center text-muted font-serif italic">
                      No menu dishes found for {currentBranch?.branch_name || 'this branch'}. Click "+ Add Menu Dish" to add offerings.
                    </td>
                  </tr>
                ) : (
                  filteredMenus.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={
                              item.image ||
                              'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80'
                            }
                            alt={item.menu_name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border/80 bg-surface-secondary shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif text-base font-medium text-foreground truncate max-w-[240px] sm:max-w-md">
                                {item.menu_name}
                              </h4>
                              {item.is_signature && (
                                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 flex items-center gap-1 font-bold shrink-0">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Signature
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted max-w-md line-clamp-1 mt-0.5">
                              {item.short_description || item.long_description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-primary whitespace-nowrap">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => toggleItemStatus(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            item.status === 1
                              ? 'bg-success/15 text-success border border-success/30 hover:bg-success/25'
                              : 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25'
                          }`}
                        >
                          {item.status === 1 ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Available</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Unavailable</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1.5 h-8 w-8 hover:bg-surface-secondary text-muted hover:text-foreground"
                            onClick={() => openEditModal(item)}
                            aria-label="Edit menu item"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="p-1.5 h-8 w-8"
                            onClick={() => {
                              setDeletingId(item.id);
                              setDeleteConfirmOpen(true);
                            }}
                            aria-label="Delete menu item"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Create / Edit Menu Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Menu Details' : 'Add New Menu Dish'}
        subtitle="Manage dish identity, pricing, and kitchen availability"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Active Branch Context Banner */}
          <div className="p-3.5 rounded-xl bg-surface-secondary border border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted min-w-0">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <span className="shrink-0">Target Location:</span>
              <span className="font-semibold text-foreground truncate">
                {currentRestaurant?.restaurant_name || 'Restaurant'} → {currentBranch?.branch_name || 'Branch'} ({currentBranch?.city})
              </span>
            </div>
            <span className="text-[10px] text-primary uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 border border-primary/20 shrink-0 ml-2">
              Active Branch
            </span>
          </div>

          {/* Dish Name & Price in a Balanced Responsive Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Dish Name"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="e.g. Kolkata Chicken Biryani"
                required
              />
            </div>
            <div>
              <Input
                label="Price (INR ₹)"
                type="number"
                step="1"
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="e.g. 399"
                required
              />
            </div>
          </div>

          <Input
            label="Dish Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />

          <Input
            label="Short Description"
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            placeholder="Short appetizing description of ingredients and spices..."
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider font-medium text-muted">
              Detailed Description & Heritage
            </label>
            <textarea
              className="w-full bg-surface-secondary text-foreground text-sm rounded-lg p-3 border border-border focus:border-primary focus:outline-none"
              rows={3}
              value={longDesc}
              onChange={(e) => setLongDesc(e.target.value)}
              placeholder="Cooking technique, spice profile, marinade details..."
            />
          </div>

          {/* Footer Action Bar with Availability Toggle */}
          <div className="pt-4 mt-2 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 text-xs text-foreground cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={availability}
                onChange={(e) => setAvailability(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 bg-surface-secondary cursor-pointer"
              />
              <span className="font-medium">Available for Order</span>
            </label>

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving} className="shadow-gold-glow">
                {editingItem ? 'Save Changes' : 'Create Dish'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Remove Menu Item"
        description="This dish will be permanently removed from this branch. Active orders will not be affected."
        confirmText="Confirm Delete"
        variant="danger"
      />
    </div>
  );
};
