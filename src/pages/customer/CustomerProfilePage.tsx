import React, { useState, useEffect, useRef } from 'react';
import { Camera, Trash2, Award, User, Check, Save, Upload, ShieldCheck, Calendar, Hash, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { resolveAvatarUrl } from '@/services/customer.service';
import { CustomerProfile } from '@/types/customer';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchCustomerProfile,
  updateCustomerProfile,
  uploadCustomerAvatar,
  removeCustomerAvatar,
} from '@/store/slices/customerSlice';

export const CustomerProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { profile: reduxProfile, isLoading, isSaving } = useAppSelector((state) => state.customers);
  const { user, updateCurrentUserProfile } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [imgError, setImgError] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { success, error: toastError } = useToast();

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await dispatch(fetchCustomerProfile(user?.id || 'cust-001')).unwrap();
        setProfile(data);

        if (data.first_name || data.last_name) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
        } else if (data.name) {
          const parts = data.name.trim().split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }

        setPhone(data.phone || '');
        setAvatarUrl(data.avatar || '');
      } catch (e: any) {
        console.error('Failed to load profile', e);
      }
    };
    fetchProfile();
  }, [user, dispatch]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toastError('First Name Required', 'Please enter your first name.');
      return;
    }

    setIsUpdating(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const updated = await dispatch(
        updateCustomerProfile({
          customerId: user?.id || 'cust-001',
          payload: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            name: fullName,
            phone: phone.trim() || undefined,
          },
        })
      ).unwrap();

      setProfile(updated);
      updateCurrentUserProfile({ name: updated.name });
      success('Profile Updated', 'Your personal details have been saved to your account.');
    } catch (e: any) {
      toastError('Update Failed', typeof e === 'string' ? e : e?.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpdate = async (newUrlOrFile: string | File) => {
    try {
      const updated = await dispatch(
        uploadCustomerAvatar({
          customerId: user?.id || 'cust-001',
          fileOrUrl: newUrlOrFile,
        })
      ).unwrap();
      setProfile(updated);
      const resultingUrl = updated.avatar || (typeof newUrlOrFile === 'string' ? newUrlOrFile : '');
      setAvatarUrl(resultingUrl);
      updateCurrentUserProfile({ avatar: resultingUrl });
      setAvatarModalOpen(false);
      success('Portrait Updated', 'Your profile portrait has been updated.');
    } catch (e: any) {
      toastError('Avatar Update Failed', typeof e === 'string' ? e : e?.message || 'Avatar update failed');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastError('Invalid File Type', 'Please upload an image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError('Image Too Large', 'Please upload a photo smaller than 5MB.');
      return;
    }
    handleAvatarUpdate(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = async () => {
    try {
      const updated = await dispatch(removeCustomerAvatar(user?.id || 'cust-001')).unwrap();
      setProfile(updated);
      setAvatarUrl('');
      updateCurrentUserProfile({ avatar: undefined });
      success('Portrait Removed', 'Default monogram has been restored.');
    } catch (e: any) {
      toastError('Remove Failed', typeof e === 'string' ? e : e?.message || 'Remove failed');
    }
  };

  const displayName =
    `${firstName.trim()} ${lastName.trim()}`.trim() || profile?.name || user?.name || 'Valued Guest';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'G';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
          Diner Concierge
        </span>
        <h1 className="font-serif text-4xl text-foreground font-normal">Customer Profile</h1>
        <p className="text-xs text-muted mt-1">
          Manage your verified contact credentials and dining account details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* Left Column: Portrait & Loyalty Tier */}
        <div className="flex flex-col">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-luxury text-center space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="relative w-28 h-28 mx-auto">
                {avatarUrl && !imgError ? (
                  <img
                    src={resolveAvatarUrl(avatarUrl)}
                    alt=""
                    onError={() => setImgError(true)}
                    className="w-full h-full rounded-full object-cover border-2 border-primary/50 shadow-gold-glow"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-surface-secondary border-2 border-primary/40 flex items-center justify-center text-3xl font-serif text-primary tracking-wider uppercase select-none shadow-inner">
                    {initials}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  className="absolute bottom-0 right-0 p-2.5 rounded-full bg-primary text-background shadow-md hover:bg-primary-hover transition-all hover:scale-110"
                  title="Change portrait"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="font-serif text-2xl font-normal text-foreground truncate">
                  {displayName}
                </h3>
                <p className="text-xs text-muted truncate mt-0.5">{profile?.email || user?.email}</p>
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
                  className="text-xs text-danger/80 hover:text-danger flex items-center justify-center gap-1 mx-auto pt-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove portrait</span>
                </button>
              )}
            </div>

            {/* Live Profile Metadata */}
            <div className="pt-4 border-t border-border/60 text-left space-y-2.5 text-xs mt-4">
              <div className="flex justify-between items-center text-muted">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-primary/70" />
                  <span>Account ID</span>
                </span>
                <span
                  className="font-mono text-foreground text-[11px] truncate max-w-[130px]"
                  title={profile?.customer_id || profile?.id || user?.id || ''}
                >
                  {profile?.customer_id || profile?.id || user?.id || '—'}
                </span>
              </div>

              <div className="flex justify-between items-center text-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary/70" />
                  <span>Member Since</span>
                </span>
                <span className="text-foreground text-[11px]">
                  {profile?.created_at || profile?.member_since
                    ? formatDate(profile.created_at || profile.member_since)
                    : 'Active Guest'}
                </span>
              </div>

              <div className="flex justify-between items-center text-muted">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  <span>Verification</span>
                </span>
                <span className="text-success uppercase font-semibold text-[10px] tracking-wide">
                  Verified Diner
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2 flex flex-col">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl border border-border bg-surface p-8 shadow-luxury space-y-6 flex-1 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-normal text-foreground">
                  Personal Information
                </h3>
                <p className="text-xs text-muted mt-1">
                  Update your verified contact credentials and dining account details.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rohan"
                    required
                  />
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Kumar"
                  />
                </div>

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
          <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-6 shadow-luxury space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-2xl text-foreground font-normal">Select Profile Portrait</h3>
                <p className="text-xs text-muted mt-1">
                  Choose from our curated fine-dining portrait collection or upload your photo.
                </p>
              </div>
              <button
                onClick={() => setAvatarModalOpen(false)}
                className="text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Curated Dining Portraits */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Curated Dining Portraits
              </span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
                  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
                ].map((url, i) => {
                  const isSelected = avatarUrl === url;
                  return (
                    <div
                      key={i}
                      onClick={() => handleAvatarUpdate(url)}
                      className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 h-24 ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40'
                          : 'border-border/80 hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Preset ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-primary text-background rounded-full p-0.5 shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upload from Device */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Or Upload from Computer
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full gap-2 text-xs py-2.5 border-border text-foreground hover:border-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 text-primary" />
                <span>Upload Photo from Device (JPG, PNG, WEBP)</span>
              </Button>
            </div>

            {/* Custom URL Input */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Or Paste Image Link (URL)
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (customUrlInput.trim()) {
                        handleAvatarUpdate(customUrlInput.trim());
                        setCustomUrlInput('');
                      }
                    }
                  }}
                  className="flex-1 bg-surface-secondary text-foreground text-xs rounded-lg px-3 py-2 border border-border focus:border-primary focus:outline-none"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (customUrlInput.trim()) {
                      handleAvatarUpdate(customUrlInput.trim());
                      setCustomUrlInput('');
                    }
                  }}
                  disabled={!customUrlInput.trim()}
                >
                  Apply
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
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
