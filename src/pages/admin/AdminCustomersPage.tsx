import React, { useState, useEffect } from 'react';
import { Users, Mail, UserPlus, Award, Phone, MapPin, Sparkles } from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { CustomerProfile } from '@/types/customer';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invitation Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CUSTOMER');
  const [isInviting, setIsInviting] = useState(false);

  // Selected customer details
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  const { success, error: toastError } = useToast();

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (e: any) {
      toastError('Failed to load customers', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      await customerService.inviteUser('tenant-rms-001', {
        email: inviteEmail,
        role: inviteRole,
      });
      success('Invitation Dispatched', `Keycloak verification invitation sent to ${inviteEmail}.`);
      setInviteModalOpen(false);
      setInviteEmail('');
    } catch (e: any) {
      toastError('Invitation Failed', e.message);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Customer & Diner Management"
        subtitle="Manage guest profiles, loyalty tiers, and VIP invitations"
        actions={
          <Button variant="primary" size="sm" onClick={() => setInviteModalOpen(true)} className="gap-1.5">
            <UserPlus className="w-4 h-4" />
            <span>Invite Diner / Staff</span>
          </Button>
        }
      />

      <div className="px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-surface animate-pulse" />
            ))
          ) : customers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted font-serif italic">
              No customer records found.
            </div>
          ) : (
            customers.map((c) => (
              <div
                key={c.id}
                className="p-6 rounded-2xl border border-border bg-surface shadow-luxury hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-4">
                  {c.avatar ? (
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/40 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-surface-secondary border-2 border-primary/30 flex items-center justify-center font-serif text-xl text-primary shrink-0">
                      {(c.name || 'G')[0]}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif text-xl font-normal text-foreground truncate">
                        {c.name}
                      </h4>
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">{c.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium">
                      <Award className="w-3 h-3" />
                      <span>{c.loyalty_tier || 'RMS Privilege Member'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-secondary/70 border border-border/80 text-xs">
                  <div>
                    <span className="text-muted block text-[11px]">Orders</span>
                    <span className="font-mono font-semibold text-foreground">
                      {c.total_orders || 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Spend</span>
                    <span className="font-mono font-semibold text-primary">
                      {formatCurrency(c.total_spent || 1200)}
                    </span>
                  </div>
                </div>

                {c.dining_preferences && c.dining_preferences.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.dining_preferences.slice(0, 2).map((pref, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-surface-secondary text-muted border border-border/60"
                      >
                        {pref}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-border/40 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setSelectedCustomer(c)}
                  >
                    View Guest Profile
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invitation Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite User via Keycloak"
        subtitle="Dispatches email verification with client role permissions"
        maxWidth="md"
      >
        <form onSubmit={handleSendInvitation} className="space-y-4">
          <Input
            label="Recipient Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="guest@domain.com"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider font-medium text-muted">
              Role Permission
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-surface-secondary text-foreground text-sm rounded-lg p-2.5 border border-border focus:border-primary focus:outline-none"
            >
              <option value="CUSTOMER">CUSTOMER (Guest Dining Portal)</option>
              <option value="STAFF">STAFF (Floor Operations & Terminal)</option>
              <option value="MANAGER">MANAGER (Branch & Menu Management)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isInviting}>
              Send Keycloak Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer VIP Dossier Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={selectedCustomer.name}
          subtitle={`Member since ${selectedCustomer.member_since || '2025'}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              {selectedCustomer.avatar ? (
                <img
                  src={selectedCustomer.avatar}
                  alt={selectedCustomer.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/40"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-surface-secondary border border-border flex items-center justify-center font-serif text-2xl text-primary">
                  {(selectedCustomer.name || 'G')[0]}
                </div>
              )}
              <div>
                <h4 className="font-serif text-xl text-foreground">{selectedCustomer.name}</h4>
                <p className="text-muted">{selectedCustomer.email}</p>
                <div className="mt-1 inline-flex items-center gap-1.5 text-primary">
                  <Award className="w-3.5 h-3.5" />
                  <span className="font-medium">{selectedCustomer.loyalty_tier || 'RMS Privilege Member'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-muted block">Direct Contact:</span>
              <p className="text-foreground">{selectedCustomer.phone || '+91 98301 88921'}</p>
            </div>

            <div className="space-y-2">
              <span className="text-muted block">Residence / City:</span>
              <p className="text-foreground">{selectedCustomer.address || '14 Southern Avenue, Kolkata'}</p>
            </div>

            <div className="space-y-2">
              <span className="text-muted block">Dining Preferences:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(selectedCustomer.dining_preferences || ['Medium Spice', 'Biryani Enthusiast']).map((p) => (
                  <span key={p} className="px-2.5 py-1 rounded-lg bg-surface-secondary text-foreground border border-border">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

