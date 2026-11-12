import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Store, MapPin, Star, ExternalLink } from 'lucide-react';
import { restaurantService } from '@/services/restaurant.service';
import { RestaurantItem } from '@/types/restaurant';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';

export const AdminRestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const loadRestaurants = async () => {
    setIsLoading(true);
    try {
      const res = await restaurantService.getRestaurants();
      setRestaurants(res.data);
    } catch (e: any) {
      toastError('Failed to load restaurants', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const openCreateModal = () => {
    setEditingRestaurant(null);
    setName('');
    setDescription('');
    setCuisine('North Indian & Mughlai');
    setAddress('18 Park Street, Kolkata');
    setImageUrl('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85');
    setModalOpen(true);
  };

  const openEditModal = (r: RestaurantItem) => {
    setEditingRestaurant(r);
    setName(r.restaurant_name);
    setDescription(r.description || '');
    setCuisine(r.cuisine || '');
    setAddress(r.address || '');
    setImageUrl(r.image || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingRestaurant) {
        await restaurantService.updateRestaurant(editingRestaurant.restaurant_id, {
          restaurant_name: name,
          description,
          cuisine,
          image: imageUrl,
        });
        success('Restaurant Updated', `${name} updated successfully.`);
      } else {
        await restaurantService.createRestaurant({
          tenant_id: 'tenant-rms-001',
          name,
          description,
          cuisine,
          address,
          image: imageUrl,
        });
        success('Restaurant Created', `${name} registered under tenant.`);
      }
      setModalOpen(false);
      loadRestaurants();
    } catch (e: any) {
      toastError('Operation Failed', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await restaurantService.deleteRestaurant(deletingId);
      success('Restaurant Removed', 'Restaurant deleted successfully.');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      loadRestaurants();
    } catch (e: any) {
      toastError('Delete Failed', e.message);
    }
  };

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Restaurant Management"
        subtitle="Manage brand concepts, gastronomy styles, and dining flagships"
        actions={
          <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Create Restaurant</span>
          </Button>
        }
      />

      <div className="px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-surface animate-pulse" />
            ))
          ) : restaurants.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted font-serif italic">
              No restaurants registered yet. Click "Create Restaurant" to register your first brand.
            </div>
          ) : (
            restaurants.map((rest) => (
              <div
                key={rest.restaurant_id}
                className="rounded-2xl border border-border bg-surface overflow-hidden shadow-luxury hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div className="relative h-48 overflow-hidden bg-surface-secondary">
                  <img
                    src={rest.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'}
                    alt={rest.restaurant_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                  {rest.rating && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded bg-background/80 backdrop-blur-sm border border-border text-xs text-primary font-medium">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      <span>{rest.rating.toFixed(2)}</span>
                    </div>
                  )}
                  {rest.cuisine && (
                    <div className="absolute bottom-3 left-3 text-[11px] uppercase tracking-wider text-primary font-medium px-2 py-0.5 rounded bg-background/80 backdrop-blur-sm border border-primary/20">
                      {rest.cuisine}
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-2xl font-normal text-foreground">
                      {rest.restaurant_name}
                    </h3>
                    <p className="text-xs text-muted line-clamp-3 leading-relaxed">
                      {rest.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                    <button
                      onClick={() => navigate(`/admin/branches?restaurant_id=${rest.restaurant_id}`)}
                      className="text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Manage Branches</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        onClick={() => openEditModal(rest)}
                        aria-label="Edit restaurant"
                      >
                        <Edit3 className="w-4 h-4 text-muted hover:text-foreground" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="p-2"
                        onClick={() => {
                          setDeletingId(rest.restaurant_id);
                          setDeleteConfirmOpen(true);
                        }}
                        aria-label="Delete restaurant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Restaurant Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRestaurant ? 'Edit Restaurant' : 'Create New Restaurant'}
        subtitle="Manage brand identity and gastronomic parameters"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Restaurant Brand Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Saffron & Spice"
            required
          />

          <Input
            label="Cuisine & Speciality"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="e.g. North Indian & Mughlai"
            required
          />

          <Input
            label="Flagship Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="18 Park Street, Kolkata"
          />

          <Input
            label="Hero Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider font-medium text-muted">
              Brand Narrative / Description
            </label>
            <textarea
              className="w-full bg-surface-secondary text-foreground text-sm rounded-lg p-3 border border-border focus:border-primary focus:outline-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the regional culinary heritage and artisanal dining experience..."
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingRestaurant ? 'Save Changes' : 'Create Restaurant'}
            </Button>
          </div>
        </form>
      </Modal>

        {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Restaurant Concept"
      description="Deleting this restaurant requires that all dependent branch locations and menus are removed first in accordance with backend data integrity checks."
      confirmText="Confirm Delete"
      variant="danger"
      />
    </div>
  );
};

