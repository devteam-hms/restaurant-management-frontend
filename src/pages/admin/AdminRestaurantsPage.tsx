import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Store, MapPin, Star, ExternalLink, Upload, Image as ImageIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from '@/store/slices/restaurantSlice';
import { RestaurantItem } from '@/types/restaurant';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';

const PRESET_RESTAURANT_IMAGES = [
  { label: 'Biryani & Royal Rice', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80' },
  { label: 'Artisan Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
  { label: 'Momo & Dumplings', url: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80' },
  { label: 'Burgers & Grill', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { label: 'Kebabs & Mughlai', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80' },
  { label: 'Fine Dining Ambience', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80' },
  { label: 'Cozy Cafe & Bakery', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80' },
];

export const AdminRestaurantsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: restaurants, isLoading, isSaving } = useAppSelector((state) => state.restaurants);

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { success, error: toastError } = useToast();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastError('Invalid File Type', 'Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toastError('Image Too Large', 'Please choose an image smaller than 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        success('Image Uploaded', 'Custom photo loaded. Click Save to persist.');
      }
    };
    reader.onerror = () => {
      toastError('Upload Failed', 'Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  const openCreateModal = () => {
    setEditingRestaurant(null);
    setName('');
    setDescription('');
    setCuisine('North Indian & Mughlai');
    setAddress('18 Park Street, Kolkata');
    setImageUrl('');
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
    try {
      if (editingRestaurant) {
        await dispatch(
          updateRestaurant({
            id: editingRestaurant.restaurant_id,
            payload: {
              restaurant_name: name,
              description,
              cuisine,
              image: imageUrl,
            },
          })
        ).unwrap();
        success('Restaurant Updated', `${name} updated successfully.`);
      } else {
        const activeTenantId = tenant?.tenant_id || user?.tenant_id;
        if (!activeTenantId) {
          throw new Error('No active tenant organization found. Please ensure you are signed in under an authorized tenant.');
        }
        await dispatch(
          createRestaurant({
            tenant_id: activeTenantId,
            name,
            description,
            cuisine,
            address,
            image: imageUrl,
          })
        ).unwrap();
        success('Restaurant Created', `${name} registered under ${tenant?.tenant_name || activeTenantId}.`);
      }
      setModalOpen(false);
    } catch (e: any) {
      toastError('Operation Failed', typeof e === 'string' ? e : e.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await dispatch(deleteRestaurant(deletingId)).unwrap();
      success('Restaurant Removed', 'Restaurant deleted successfully.');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    } catch (e: any) {
      toastError('Delete Failed', typeof e === 'string' ? e : e.message);
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

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
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
                    src={rest.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'}
                    alt={rest.restaurant_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
                    }}
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

          {/* Restaurant Cover Image & Live Preview */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider font-medium text-muted">
              Restaurant Cover Image
            </label>

            {imageUrl ? (
              <div className="relative h-44 rounded-xl overflow-hidden border border-border group bg-surface-secondary">
                <img
                  src={imageUrl}
                  alt="Restaurant Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New</span>
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setImageUrl('')}
                    className="gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center cursor-pointer bg-surface-secondary/40 text-muted hover:text-foreground"
              >
                <Upload className="w-6 h-6 mb-1 text-primary/70" />
                <span className="text-xs font-medium">Click to upload photo from your computer</span>
                <span className="text-[10px] text-muted">PNG, JPG, WEBP up to 3MB</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Quick Cuisine / Dish Presets */}
            <div className="pt-1 space-y-1.5">
              <span className="text-[11px] text-muted font-medium block">
                Quick 1-Click Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_RESTAURANT_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                      imageUrl === preset.url
                        ? 'bg-primary text-background font-semibold border-primary shadow-sm'
                        : 'bg-surface-secondary text-muted hover:text-foreground border-border hover:border-primary/40'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input */}
            <div className="pt-1">
              <Input
                label="Or Direct Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

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

