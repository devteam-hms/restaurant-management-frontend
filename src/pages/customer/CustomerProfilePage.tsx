import React, { useState, useEffect } from 'react';
import { Camera, Trash2, Award, User, Sparkles, Check, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { customerService } from '@/services/customer.service';
import { CustomerProfile } from '@/types/customer';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';

export const CustomerProfilePage: React.FC = () => {
  const { user, updateCurrentUserProfile } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const { success, error: toastError } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await customerService.getProfile(user?.id || 'cust-001');
        setProfile(data);
        setName(data.name);
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setAvatarUrl(data.avatar || '');
      } catch (e: any) {
        console.error('Failed to load profile', e);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updated = await customerService.updateProfile(user?.id || 'cust-001', {
        name,
        phone,
        address,
        city,
      });
      setProfile(updated);
      updateCurrentUserProfile({ name: updated.name });
      success('Profile Updated', 'Your personal details have been saved.');
    } catch (e: any) {
      toastError('Update Failed', e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpdate = async (newUrl: string) => {
    try {
      const updated = await customerService.uploadAvatar(user?.id || 'cust-001', newUrl);
      setProfile(updated);
      setAvatarUrl(newUrl);
      updateCurrentUserProfile({ avatar: newUrl });
      setAvatarModalOpen(false);
      success('Portrait Updated', 'Your profile portrait has been updated.');
    } catch (e: any) {
      toastError('Avatar Update Failed', e.message);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const updated = await customerService.removeAvatar(user?.id || 'cust-001');
      setProfile(updated);
      setAvatarUrl('');
      updateCurrentUserProfile({ avatar: undefined });
      success('Portrait Removed', 'Default monogram has been restored.');
    } catch (e: any) {
      toastError('Remove Failed', e.message);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
          Diner Concierge
        </span>
        <h1 className="font-serif text-4xl text-foreground font-normal">Customer Profile</h1>
        <p className="text-xs text-muted mt-1">
          Manage your contact credentials, private dining preferences, and verified status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Portrait & Loyalty Tier */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-luxury text-center space-y-4">
            <div className="relative w-28 h-28 mx-auto">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full rounded-full object-cover border-2 border-primary/50 shadow-gold-glow"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-surface-secondary border-2 border-primary/40 flex items-center justify-center text-3xl font-serif text-primary">
                  {(name || 'G')[0]}
                </div>
              )}

              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-background shadow-md hover:bg-primary-hover transition-colors"
                title="Change portrait"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="font-serif text-2xl font-normal text-foreground">{name}</h3>
              <p className="text-xs text-muted">{profile?.email || user?.email}</p>
            </div>

            {/* Loyalty Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary font-medium">
              <Award className="w-3.5 h-3.5" />
              <span>{profile?.loyalty_tier || 'RMS Privilege Member'}</span>
            </div>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-xs text-danger/80 hover:text-danger flex items-center justify-center gap-1 mx-auto pt-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove portrait</span>
              </button>
            )}
          </div>

          {/* Dining Preferences */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-luxury space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-4 h-4" />
              <h4 className="font-serif text-lg font-normal text-foreground">
                Dining Preferences
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(profile?.dining_preferences || ['Medium Spice Level', 'Kasundi Mustard Fan', 'Dum Biryani Enthusiast']).map(
                (pref) => (
                  <span
                    key={pref}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-secondary text-foreground/80 border border-border"
                  >
                    {pref}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl border border-border bg-surface p-8 shadow-luxury space-y-6"
          >
            <h3 className="font-serif text-2xl font-normal text-foreground">
              Personal Information
            </h3>

            <div className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                value={profile?.email || user?.email || ''}
                disabled
                helperText="Email is managed via Keycloak Identity Provider."
              />

              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98301 88921"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="14 Southern Avenue"
                />
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Kolkata"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button type="submit" variant="primary" size="md" isLoading={isUpdating} className="gap-2">
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Select Portrait Modal */}
      {avatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-luxury space-y-4">
            <h3 className="font-serif text-2xl text-foreground">Select Profile Portrait</h3>
            <p className="text-xs text-muted">
              Choose from our curated fine-dining portrait collection or enter an image URL.
            </p>

            <div className="grid grid-cols-3 gap-3 py-2">
              {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
              ].map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Option ${i}`}
                  onClick={() => handleAvatarUpdate(url)}
                  className="w-full h-24 object-cover rounded-xl cursor-pointer hover:border-2 hover:border-primary transition-all hover:scale-105"
                />
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => setAvatarModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

