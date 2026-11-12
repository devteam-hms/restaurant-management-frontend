import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, CheckCircle2, XCircle, Sparkles, Image } from 'lucide-react';
import { menuService } from '@/services/menu.service';
import { branchService } from '@/services/branch.service';
import { MenuItem } from '@/types/menu';
import { BranchItem } from '@/types/branch';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/utils';

export const AdminMenuPage: React.FC = () => {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const loadBranches = async () => {
    try {
      const bRes = await branchService.getBranches();
      setBranches(bRes.data);
      if (bRes.data.length > 0) {
        const bId = bRes.data[0].branch_id;
        setSelectedBranchId(bId);
        loadMenuItems(bId);
      } else {
        setIsLoading(false);
      }
    } catch (e: any) {
      toastError('Failed to load branches', e.message);
      setIsLoading(false);
    }
  };

  const loadMenuItems = async (bId: string) => {
    setIsLoading(true);
    try {
      const mRes = await menuService.getMenusByBranch(bId, { limit: 50 });
      setMenus(mRes.data);
    } catch (e: any) {
      toastError('Failed to load menu items', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleBranchSelect = (bId: string) => {
    setSelectedBranchId(bId);
    loadMenuItems(bId);
  };

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
    if (!selectedBranchId) return;
    setIsSaving(true);
    try {
      const tags = dietaryTagsStr.split(',').map((t) => t.trim()).filter(Boolean);
      if (editingItem) {
        await menuService.updateMenu(selectedBranchId, editingItem.id, {
          menu_name: menuName,
          short_description: shortDesc,
          long_description: longDesc,
          price: Number(price),
          category,
          image: imageUrl,
          status: availability ? 1 : 0,
          is_signature: isSignature,
          dietary_tags: tags,
        });
        success('Menu Item Updated', `${menuName} updated successfully.`);
      } else {
        await menuService.createMenu({
          branch_id: selectedBranchId,
          menu_name: menuName,
          short_description: shortDesc,
          long_description: longDesc,
          price: Number(price),
          category,
          image: imageUrl,
          availability,
          is_signature: isSignature,
          dietary_tags: tags,
        });
        success('Menu Item Created', `${menuName} added to branch menu.`);
      }
      setModalOpen(false);
      loadMenuItems(selectedBranchId);
    } catch (e: any) {
      toastError('Save Failed', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId || !selectedBranchId) return;
    try {
      await menuService.deleteMenu(selectedBranchId, deletingId);
      success('Item Removed', 'Menu item removed from branch.');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      loadMenuItems(selectedBranchId);
    } catch (e: any) {
      toastError('Delete Failed', e.message);
    }
  };

  const toggleItemStatus = async (item: MenuItem) => {
    try {
      const newStatus = item.status === 1 ? 0 : 1;
      await menuService.updateMenu(item.branch_id, item.id, {
        status: newStatus,
      });
      success('Status Toggled', `${item.menu_name} is now ${newStatus === 1 ? 'Available' : 'Unavailable'}.`);
      loadMenuItems(selectedBranchId);
    } catch (e: any) {
      toastError('Toggle Failed', e.message);
    }
  };

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Menu Management"
        subtitle="Configure regional menus, dish pricing, and kitchen availability"
        actions={
          <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Add Menu Dish</span>
          </Button>
        }
      />

      <div className="px-8 space-y-6">
        {/* Branch Selector Bar */}
        <div className="p-4 rounded-xl bg-surface border border-border flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-muted font-medium">Select Branch:</span>
          {branches.map((b) => (
            <button
              key={b.branch_id}
              onClick={() => handleBranchSelect(b.branch_id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-colors ${
                selectedBranchId === b.branch_id
                  ? 'bg-primary/20 text-primary border border-primary/50 font-semibold shadow-sm'
                  : 'text-muted hover:text-foreground bg-surface-secondary border border-border/60'
              }`}
            >
              {b.branch_name} ({b.city})
            </button>
          ))}
        </div>

        {/* Menu Items Table */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-luxury">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-secondary/60 text-xs uppercase tracking-wider text-muted">
                <th className="px-6 py-4 font-medium">Course Details</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Service Availability</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted text-xs">
                    Loading courses...
                  </td>
                </tr>
              ) : menus.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-muted font-serif italic">
                    No menu courses found for this branch.
                  </td>
                </tr>
              ) : (
                menus.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80'}
                          alt={item.menu_name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-border/80 bg-surface-secondary"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif text-lg font-medium text-foreground">
                              {item.menu_name}
                            </h4>
                            {item.is_signature && (
                              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 flex items-center gap-1 font-bold">
                                <Sparkles className="w-2.5 h-2.5" />
                                Signature
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted max-w-md line-clamp-1 mt-0.5">
                            {item.short_description || item.long_description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-foreground">
                      {item.category || 'Mains'}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-primary">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit3 className="w-4 h-4 text-muted hover:text-foreground" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="p-2"
                          onClick={() => {
                            setDeletingId(item.id);
                            setDeleteConfirmOpen(true);
                          }}
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

      {/* Create / Edit Menu Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Culinary Course' : 'Create New Culinary Course'}
        subtitle="Manage description, pricing, and dietary classification"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Dish Name"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            placeholder="e.g. Kolkata Chicken Biryani"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (INR ₹)"
              type="number"
              step="1"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider font-medium text-muted">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface-secondary text-foreground text-sm rounded-lg p-2.5 border border-border focus:border-primary focus:outline-none"
              >
                <option value="Starters">Starters</option>
                <option value="Biryani">Biryani</option>
                <option value="Bengali Cuisine">Bengali Cuisine</option>
                <option value="North Indian">North Indian</option>
                <option value="South Indian">South Indian</option>
                <option value="Mughlai">Mughlai</option>
                <option value="Tandoor">Tandoor</option>
                <option value="Street Food">Street Food</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Desserts">Desserts</option>
                <option value="Beverages">Beverages</option>
              </select>
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

          <Input
            label="Dietary Tags (comma separated)"
            value={dietaryTagsStr}
            onChange={(e) => setDietaryTagsStr(e.target.value)}
            placeholder="Signature, Vegetarian, Non-Vegetarian, Spicy"
          />

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isSignature}
                onChange={(e) => setIsSignature(e.target.checked)}
                className="rounded border-border text-primary"
              />
              <span>Mark as Signature Dish</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={availability}
                onChange={(e) => setAvailability(e.target.checked)}
                className="rounded border-border text-primary"
              />
              <span>Available for Order</span>
            </label>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingItem ? 'Save Changes' : 'Create Dish'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Remove Menu Course"
        subtitle="Confirm removal of course from branch menu"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            This course will be permanently removed from this branch. Active orders will not be affected.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

