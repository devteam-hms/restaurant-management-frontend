import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Receipt,
  ArrowRight,
  Compass,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/order.service';
import { billService } from '@/services/bill.service';
import { branchService } from '@/services/branch.service';
import { customerService } from '@/services/customer.service';
import { OrderItemResponseModel } from '@/types/order';
import { BillItem } from '@/types/bill';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/common/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export const CustomerOverviewPage: React.FC = () => {
  const { user, updateCurrentUserProfile } = useAuth();
  const [orders, setOrders] = useState<OrderItemResponseModel[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0);
  const [totalBillsCount, setTotalBillsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize customerName, avoiding email username fallback if full name is available
  const [customerName, setCustomerName] = useState<string>(() => {
    const raw = user?.name || '';
    if (raw && !raw.includes('@') && raw !== user?.email?.split('@')[0]) {
      return raw;
    }
    return '';
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, billsRes, branchesRes, profileRes] = await Promise.all([
          orderService.getOrders({ page: 1, limit: 10 }),
          billService.getBills({ page: 1, limit: 10 }),
          branchService.getBranches({ limit: 100 }).catch(() => ({ data: [] })),
          customerService.getProfile().catch(() => null),
        ]);

        if (profileRes) {
          const resolved =
            profileRes.name ||
            `${profileRes.first_name || ''} ${profileRes.last_name || ''}`.trim();
          if (resolved && resolved !== profileRes.email) {
            setCustomerName(resolved);
            updateCurrentUserProfile({ name: resolved, avatar: profileRes.avatar });
          }
        }

        const branchMap = new Map<string, string>();
        (branchesRes.data || []).forEach((b) => {
          if (b.branch_id && b.branch_name) {
            branchMap.set(b.branch_id, b.branch_name);
          }
        });

        const mappedOrders = (ordersRes.data || []).map((o) => ({
          ...o,
          branch_name: branchMap.get(o.branch_id) || o.branch_name || 'Dining Hall',
        }));

        const mappedBills = (billsRes.data || []).map((b) => ({
          ...b,
          branch_name: branchMap.get(b.branch_id) || b.branch_name || 'Dining Hall',
        }));

        setOrders(mappedOrders);
        setBills(mappedBills);
        setTotalOrdersCount(ordersRes.total ?? ordersRes.data?.length ?? 0);
        setTotalBillsCount(billsRes.total ?? billsRes.data?.length ?? 0);
      } catch (e) {
        console.error('Failed to load customer overview', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeOrders = orders.filter((o) =>
    ['PLACED', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.order_status)
  );
  const completedOrders = orders.filter((o) => o.order_status === 'COMPLETED');

  const displayName =
    customerName ||
    (user?.name && user.name !== user.email?.split('@')[0] ? user.name : 'Valued Diner');

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/80">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>RMS Privilege Dining</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-foreground">
            Welcome back, <span className="italic text-primary">{displayName}</span>.
          </h1>
          <p className="text-xs sm:text-sm text-muted font-light">
            Here is a summary of your dining experiences, active food orders, and billing invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/customer/explore">
            <Button variant="primary" size="md" className="gap-2">
              <Compass className="w-4 h-4" />
              <span>Explore Menus</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card elevation="glass" className="space-y-3">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs uppercase tracking-wider font-medium">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-primary" />
          </div>
          <div className="font-serif text-3xl font-medium text-foreground">
            {isLoading ? '—' : totalOrdersCount}
          </div>
          <p className="text-[11px] text-muted">Lifetime culinary reservations</p>
        </Card>

        <Card elevation="glass" className="space-y-3">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs uppercase tracking-wider font-medium">Active Orders</span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <div className="font-serif text-3xl font-medium text-foreground text-warning">
            {isLoading ? '—' : activeOrders.length}
          </div>
          <p className="text-[11px] text-muted">Currently preparing in kitchen</p>
        </Card>

        <Card elevation="glass" className="space-y-3">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs uppercase tracking-wider font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="font-serif text-3xl font-medium text-foreground text-success">
            {isLoading ? '—' : completedOrders.length}
          </div>
          <p className="text-[11px] text-muted">Fulfilled culinary services</p>
        </Card>

        <Card elevation="glass" className="space-y-3">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs uppercase tracking-wider font-medium">Active Bills</span>
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <div className="font-serif text-3xl font-medium text-foreground">
            {isLoading ? '—' : totalBillsCount}
          </div>
          <p className="text-[11px] text-muted">Formal receipts with tax breakdown</p>
        </Card>
      </div>

      {/* Active Orders Highlight */}
      {activeOrders.length > 0 && (
        <div className="p-6 rounded-2xl bg-surface border border-primary/40 shadow-gold-glow space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
              <h3 className="font-serif text-2xl font-normal text-foreground">Active Order in Kitchen</h3>
            </div>
            <Link to="/customer/orders">
              <span className="text-xs text-primary hover:underline flex items-center gap-1">
                View Tracking <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((ord) => (
              <div key={ord.id} className="p-4 rounded-xl bg-surface-secondary border border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary">{ord.id}</span>
                    <OrderStatusBadge status={ord.order_status} />
                  </div>
                  <p className="text-xs text-foreground mt-1 font-medium">{ord.branch_name || 'Dining Hall'}</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {ord.items.map((i) => `${i.quantity}x ${i.menu_name}`).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {formatCurrency(ord.total_amount)}
                  </span>
                  <p className="text-[10px] text-muted mt-0.5">{formatDate(ord.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-normal text-foreground">Recent Dining Activity</h2>
          <Link to="/customer/orders">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-surface-secondary/60 text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Order ID</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Branch Location</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Dishes</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Total</th>
                  <th className="px-3.5 py-3 font-medium whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted text-xs">
                      Loading activity...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted font-serif italic">
                      No orders placed yet. Peruse our menus to create your first order.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-3.5 py-2.5 font-mono text-xs font-semibold text-primary whitespace-nowrap">
                        {order.id}
                      </td>
                      <td className="px-3.5 py-2.5 text-xs text-foreground font-medium whitespace-nowrap">
                        {order.branch_name || 'Dining Hall'}
                      </td>
                      <td className="px-3.5 py-2.5 text-xs text-muted max-w-[200px] truncate">
                        {order.items.map((i) => `${i.quantity}x ${i.menu_name}`).join(', ')}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <OrderStatusBadge status={order.order_status} />
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-3.5 py-2.5 text-[11px] text-muted whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

