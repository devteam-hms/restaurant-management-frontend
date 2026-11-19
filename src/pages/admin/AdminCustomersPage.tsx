import React, { useState, useEffect } from 'react';
import { Users, Mail, UserPlus, Award, Phone, MapPin, Sparkles, Building2, Store } from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { tenantService } from '@/services/tenant.service';
import { TokenStorage } from '@/lib/token-storage';
import { CustomerProfile } from '@/types/customer';
import { RestaurantItem } from '@/types/restaurant';
import { BranchItem } from '@/types/branch';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppDispatch } from '@/store/hooks';
import { fetchCustomers } from '@/store/slices/customerSlice';
import { fetchOrders } from '@/store/slices/orderSlice';
import { fetchBills } from '@/store/slices/billSlice';
import { fetchBranches } from '@/store/slices/branchSlice';
import { fetchRestaurants } from '@/store/slices/restaurantSlice';

export const AdminCustomersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Invitation Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'CUSTOMER' | 'STAFF' | 'MANAGER'>('CUSTOMER');
  const [inviteRestaurantId, setInviteRestaurantId] = useState('');
  const [inviteBranchId, setInviteBranchId] = useState('');
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  // Selected customer details
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  const { success, error: toastError } = useToast();
  const { user } = useAuth();
  const { tenant } = useTenant();

  const loadCustomers = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [data, ordersRes, billsRes, branchesRes] = await Promise.all([
        dispatch(fetchCustomers()).unwrap(),
        dispatch(fetchOrders({ limit: 100 })).unwrap().catch(() => ({ data: [] })),
        dispatch(fetchBills({ limit: 100 })).unwrap().catch(() => ({ data: [] })),
        dispatch(fetchBranches({ limit: 100 })).unwrap().catch(() => ({ data: [] })),
      ]);

      const branchMap = new Map<string, string>();
      (branchesRes.data || []).forEach((b) => {
        if (b.branch_id && b.branch_name) {
          branchMap.set(b.branch_id, b.branch_name);
        }
      });

      const allOrders = ordersRes.data || [];
      const allBills = billsRes.data || [];

      const enriched = data.map((u) => {
        const userOrders = allOrders.filter(
          (o) =>
            (u.customer_id && o.customer_id === u.customer_id) ||
            (u.id && o.customer_id === u.id) ||
            (u.email && o.customer_id === u.email)
        );

        const userBills = allBills.filter(
          (b) =>
            (u.customer_id && b.customer_id === u.customer_id) ||
            (u.id && b.customer_id === u.id) ||
            (u.email && (b as any).customer_email === u.email)
        );

        const validOrders = userOrders.filter((o) => o.order_status !== 'CANCELLED');
        const ordersSpend = validOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        const billsSpend = userBills
          .filter((b) => b.bill_status !== 'CANCELLED')
          .reduce((sum, b) => sum + (Number(b.final_amount ?? b.total_amount) || 0), 0);

        const orderCount = Math.max(validOrders.length, userBills.length);
        const totalSpend = Math.max(ordersSpend, billsSpend);

        let tier = 'Registered Guest';
        if (orderCount >= 10 || totalSpend >= 10000) {
          tier = 'Platinum Club';
        } else if (orderCount >= 5 || totalSpend >= 5000) {
          tier = 'Gold Privilege';
        } else if (orderCount >= 1) {
          tier = 'Active Diner';
        }

        return {
          ...u,
          branch_name: u.branch_id ? branchMap.get(u.branch_id) || u.branch_id : undefined,
          total_orders: orderCount,
          total_spent: totalSpend,
          loyalty_tier: tier,
        };
      });

      setCustomers(enriched);

      // Keep selectedCustomer dynamically updated if modal is currently open
      setSelectedCustomer((prev) => {
        if (!prev) return null;
        const updated = enriched.find(
          (c) =>
            (prev.id && c.id === prev.id) ||
            (prev.customer_id && c.customer_id === prev.customer_id) ||
            (prev.email && c.email === prev.email)
        );
        return updated || prev;
      });
    } catch (e: any) {
      if (!silent) {
        toastError('Failed to load customers', e.message);
      }
    } finally {
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadLocations = async () => {
    try {
      const [rRes, bRes] = await Promise.all([
        dispatch(fetchRestaurants({ page: 1, limit: 100 })).unwrap(),
        dispatch(fetchBranches({ limit: 100 })).unwrap(),
      ]);
      const rests = rRes.data || [];
      const brs = bRes.data || [];
      setRestaurants(rests);
      setBranches(brs);

      // Pre-select first restaurant and its corresponding branch
      if (rests.length > 0) {
        const firstRestId = rests[0].restaurant_id;
        setInviteRestaurantId(firstRestId);
        const firstBranches = brs.filter((b) => b.restaurant_id === firstRestId);
        if (firstBranches.length > 0) {
          setInviteBranchId(firstBranches[0].branch_id);
        }
      }
    } catch (e) {
      console.warn('Could not load restaurants/branches for invitations:', e);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadLocations();

    // Live sync polling every 8 seconds so new orders and spend update automatically
    const interval = setInterval(() => {
      loadCustomers(true);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFullName.trim()) {
      toastError('Missing Full Name', 'Please provide the invitee full name.');
      return;
    }
    if (!inviteEmail.trim()) {
      toastError('Missing Email', 'Please provide the recipient email address.');
      return;
    }

    setIsInviting(true);
    let activeTenantId = tenant?.tenant_id || user?.tenant_id || TokenStorage.getCurrentTenantId();
    if (!activeTenantId) {
      try {
        const tRes = await tenantService.getTenants({ page: 1, limit: 1 });
        if (tRes.data && tRes.data.length > 0) {
          activeTenantId = tRes.data[0].tenant_id;
          TokenStorage.setCurrentTenantId(activeTenantId);
        }
      } catch (err) {
        console.warn('Could not auto-fetch tenant id:', err);
      }
    }

    if (!activeTenantId) {
      activeTenantId = 'tenant-rms-001';
    }

    try {
      await customerService.inviteUser(activeTenantId, {
        full_name: inviteFullName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        restaurant_id: inviteRestaurantId || undefined,
        branch_id: inviteBranchId || undefined,
      });

      success(
        'Invitation Dispatched',
        `Keycloak verification invitation sent to ${inviteEmail} for ${inviteFullName} (${inviteRole}).`
      );
      setInviteModalOpen(false);
      setInviteFullName('');
      setInviteEmail('');
      setInviteRole('CUSTOMER');
      setInviteRestaurantId('');
      setInviteBranchId('');
    } catch (e: any) {
      toastError('Invitation Failed', e.message);
    } finally {
      setIsInviting(false);
    }
  };

  const filteredBranches = inviteRestaurantId
    ? branches.filter((b) => b.restaurant_id === inviteRestaurantId)
    : branches;

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Customer & Diner Management"
        subtitle="Manage guest profiles, loyalty tiers, and VIP invitations"
        actions={
          <Button variant="primary" size="sm" onClick={() => setInviteModalOpen(true)} className="gap-1.5 shadow-gold-glow">
            <UserPlus className="w-4 h-4" />
            <span>Invite Diner / Staff</span>
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
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
                      {c.total_orders ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Spend</span>
                    <span className="font-mono font-semibold text-primary">
                      {formatCurrency(c.total_spent ?? 0)}
                    </span>
                  </div>
                </div>

                {c.branch_name && (
                  <p className="text-[11px] text-muted flex items-center gap-1.5 truncate">
                    <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{c.branch_name}</span>
                  </p>
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
            label="Invitee Full Name"
            type="text"
            value={inviteFullName}
            onChange={(e) => setInviteFullName(e.target.value)}
            placeholder="e.g. Abhradeep Paul"
            required
          />

          <Input
            label="Recipient Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="abhradeeppaul02@gmail.com"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider font-medium text-muted">
              Role Permission
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full bg-surface-secondary text-foreground text-sm rounded-xl px-3.5 py-3 border border-border focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="CUSTOMER">CUSTOMER (Guest Dining Portal)</option>
              <option value="STAFF">STAFF (Floor Operations & Terminal)</option>
              <option value="MANAGER">MANAGER (Branch & Menu Management)</option>
            </select>
            <p className="text-[11px] text-muted">
              {inviteRole === 'CUSTOMER' && 'Access limited to ordering, table bookings, and bill history.'}
              {inviteRole === 'STAFF' && 'Access to live kitchen ticket display, terminal orders, and bill settlements.'}
              {inviteRole === 'MANAGER' && 'Full branch management, regional menu management, and operational controls.'}
            </p>
          </div>

          {/* Restaurant and Branch Assignment - Always Accessible */}
          <div className="space-y-3 p-3.5 rounded-xl bg-surface-secondary border border-border">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs uppercase tracking-wider font-semibold text-foreground">
                Target Restaurant & Branch
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase tracking-wider font-medium text-muted">
                  Restaurant Concept
                </label>
                <select
                  value={inviteRestaurantId}
                  onChange={(e) => {
                    const rId = e.target.value;
                    setInviteRestaurantId(rId);
                    const branchesForRest = branches.filter((b) => b.restaurant_id === rId);
                    setInviteBranchId(branchesForRest.length > 0 ? branchesForRest[0].branch_id : '');
                  }}
                  className="w-full bg-surface text-foreground text-sm rounded-xl px-3.5 py-3 border border-border focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="">Choose Restaurant...</option>
                  {restaurants.map((r) => (
                    <option key={r.restaurant_id} value={r.restaurant_id}>
                      {r.restaurant_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase tracking-wider font-medium text-muted">
                  Branch Destination
                </label>
                <select
                  value={inviteBranchId}
                  onChange={(e) => setInviteBranchId(e.target.value)}
                  disabled={!inviteRestaurantId}
                  className="w-full bg-surface text-foreground text-sm rounded-xl px-3.5 py-3 border border-border focus:border-primary focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!inviteRestaurantId ? 'Select Restaurant First' : 'Choose Branch...'}
                  </option>
                  {filteredBranches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-muted">
              Associates the invited account directly with this restaurant unit and branch terminal in MongoDB.
            </p>
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
          subtitle={`Member since ${selectedCustomer.member_since ? formatDate(selectedCustomer.member_since) : 'Recent'}`}
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
                  <span className="font-medium">{selectedCustomer.loyalty_tier || 'Registered Guest'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-secondary/70 border border-border/80 text-xs">
              <div>
                <span className="text-muted block text-[11px]">Total Orders</span>
                <span className="font-mono font-semibold text-foreground text-sm">
                  {selectedCustomer.total_orders ?? 0}
                </span>
              </div>
              <div>
                <span className="text-muted block text-[11px]">Total Lifetime Spend</span>
                <span className="font-mono font-semibold text-primary text-sm">
                  {formatCurrency(selectedCustomer.total_spent ?? 0)}
                </span>
              </div>
            </div>

            {selectedCustomer.branch_name && (
              <div className="space-y-1.5 pt-1">
                <span className="text-muted block text-xs font-medium">Assigned Branch Location</span>
                <p className="text-primary text-xs font-medium flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  <span>{selectedCustomer.branch_name}</span>
                </p>
              </div>
            )}

            <div className="space-y-1.5 pt-3 border-t border-border/50 text-[11px] text-muted flex items-center justify-between">
              <span>Account ID: <span className="font-mono text-foreground">{selectedCustomer.id}</span></span>
              <span>Status: <span className="text-success uppercase font-semibold">{selectedCustomer.status || 'Active'}</span></span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

