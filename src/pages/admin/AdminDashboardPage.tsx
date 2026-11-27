import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  UtensilsCrossed,
  ShoppingBag,
  DollarSign,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { OrderItemResponseModel } from '@/types/order';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/common/Badge';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { BranchQRManagerCard } from '@/components/qr/BranchQRManagerCard';
import { formatCurrency, formatDate, parseUtcDate, getTimeBasedGreeting } from '@/lib/utils';
import { useAppDispatch } from '@/store/hooks';
import { fetchRestaurants } from '@/store/slices/restaurantSlice';
import { fetchBranches } from '@/store/slices/branchSlice';
import { fetchOrders } from '@/store/slices/orderSlice';
import { fetchBills } from '@/store/slices/billSlice';
import { fetchCustomers } from '@/store/slices/customerSlice';

export const AdminDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [totalRestaurants, setTotalRestaurants] = useState<number>(0);
  const [totalBranches, setTotalBranches] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<OrderItemResponseModel[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<{
    preparing: { count: number; pct: number };
    completed: { count: number; pct: number };
    placed: { count: number; pct: number };
    cancelled: { count: number; pct: number };
  }>({
    preparing: { count: 0, pct: 0 },
    completed: { count: 0, pct: 0 },
    placed: { count: 0, pct: 0 },
    cancelled: { count: 0, pct: 0 },
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState<
    Array<{ month: string; amount: number; pct: number }>
  >([]);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(0);
  const [fulfillmentRate, setFulfillmentRate] = useState<number>(0);
  const [taxCollected, setTaxCollected] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchDashboardMetrics = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [rSettled, bSettled, oSettled, billsSettled, cSettled] = await Promise.allSettled([
        dispatch(fetchRestaurants({ page: 1, limit: 100 })).unwrap(),
        dispatch(fetchBranches({ limit: 100 })).unwrap(),
        dispatch(fetchOrders({ limit: 100 })).unwrap(),
        dispatch(fetchBills({ limit: 100 })).unwrap(),
        dispatch(fetchCustomers()).unwrap(),
      ]);

      const rRes = rSettled.status === 'fulfilled' ? rSettled.value : { data: [], total: 0 };
      const bRes = bSettled.status === 'fulfilled' ? bSettled.value : { data: [], total: 0 };
      const oRes = oSettled.status === 'fulfilled' ? oSettled.value : { data: [], total: 0 };
      const billsRes = billsSettled.status === 'fulfilled' ? billsSettled.value : { data: [], total: 0 };
      const cRes = cSettled.status === 'fulfilled' ? cSettled.value : [];

      // Normalize accurate record counts across backend pagination metadata and response arrays
      const restCount =
        (rRes as any).pagination?.total_records ?? rRes.total ?? rRes.data?.length ?? 0;
      const branchCount =
        (bRes as any).pagination?.total_records ?? bRes.total ?? bRes.data?.length ?? 0;
      const allOrders = oRes.data || [];
      const orderCount =
        (oRes as any).pagination?.total_records ?? oRes.total ?? allOrders.length;
      const allBills = billsRes.data || [];

      setTotalRestaurants(restCount);
      setTotalBranches(branchCount);
      setTotalOrders(orderCount);
      setTotalCustomers(Array.isArray(cRes) ? cRes.length : 0);

      // 1. Dynamic Total Revenue:
      // Orders that are active and not cancelled contribute directly to operational revenue.
      // Verified settlement bills with PAID status are accounted for.
      const validOrders = allOrders.filter((o) => o.order_status !== 'CANCELLED');
      const orderVolume = validOrders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
      const paidBillsRev = allBills
        .filter((b) => b.payment_status === 'PAID' && b.bill_status !== 'CANCELLED')
        .reduce((acc, b) => acc + (Number(b.final_amount) || 0), 0);

      // Whenever an order is created or status updated, total revenue changes dynamically!
      const dynamicRevenue = Math.max(orderVolume, paidBillsRev);
      setTotalRevenue(dynamicRevenue);

      // 2. Average Order Value (AOV)
      const aov = validOrders.length > 0 ? dynamicRevenue / validOrders.length : 0;
      setAvgOrderValue(aov);

      // 3. Fulfillment Rate (Completed orders / Total valid orders)
      const completedCount = allOrders.filter((o) => o.order_status === 'COMPLETED').length;
      const rate = allOrders.length > 0 ? Math.round((completedCount / allOrders.length) * 100) : 0;
      setFulfillmentRate(rate);

      // 4. Statutory GST & Tax Generated (calculated dynamically from actual orders)
      const totalTax = validOrders.reduce((sum, o) => {
        const tax = o.tax_amount ?? (o.total_amount ? o.total_amount * 0.05 : 0);
        return sum + (Number(tax) || 0);
      }, 0);
      setTaxCollected(totalTax);

      // 5. Dynamic Real-Time Status Distribution from active kitchen orders
      const totalO = allOrders.length;
      const prepCount = allOrders.filter(
        (o) => o.order_status === 'PREPARING' || o.order_status === 'READY'
      ).length;
      const compCount = allOrders.filter((o) => o.order_status === 'COMPLETED').length;
      const placedCount = allOrders.filter(
        (o) => o.order_status === 'PLACED' || o.order_status === 'CONFIRMED'
      ).length;
      const cancelCount = allOrders.filter((o) => o.order_status === 'CANCELLED').length;

      setStatusDistribution({
        preparing: {
          count: prepCount,
          pct: totalO > 0 ? Math.round((prepCount / totalO) * 100) : 0,
        },
        completed: {
          count: compCount,
          pct: totalO > 0 ? Math.round((compCount / totalO) * 100) : 0,
        },
        placed: {
          count: placedCount,
          pct: totalO > 0 ? Math.round((placedCount / totalO) * 100) : 0,
        },
        cancelled: {
          count: cancelCount,
          pct: totalO > 0 ? Math.round((cancelCount / totalO) * 100) : 0,
        },
      });

      // 6. Dynamic Monthly Revenue Trajectory (last 6 months dynamically generated from actual order dates)
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const now = new Date();
      const monthsArr: Array<{ month: string; amount: number; pct: number }> = [];

      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mIdx = targetDate.getMonth();
        const yNum = targetDate.getFullYear();
        const label = monthNames[mIdx];

        const monthOrders = validOrders.filter((o) => {
          if (!o.created_at) return false;
          const od = parseUtcDate(o.created_at) || new Date(o.created_at);
          return od.getMonth() === mIdx && od.getFullYear() === yNum;
        });

        const monthTotal = monthOrders.reduce(
          (sum, o) => sum + (Number(o.total_amount) || 0),
          0
        );
        monthsArr.push({
          month: label,
          amount: monthTotal,
          pct: 0,
        });
      }

      // Compute proportional bar heights for rendering
      const maxMonthAmount = Math.max(...monthsArr.map((m) => m.amount), 1);
      monthsArr.forEach((m) => {
        m.pct = m.amount > 0 ? Math.max(16, Math.round((m.amount / maxMonthAmount) * 100)) : 8;
      });
      setMonthlyRevenue(monthsArr);

      // Build real branch lookup map
      const branchMap = new Map<string, string>();
      (bRes.data || []).forEach((b) => {
        if (b.branch_id && b.branch_name) {
          branchMap.set(b.branch_id, `${b.branch_name}${b.city ? ` — ${b.city}` : ''}`);
        }
      });

      // 7. Recent Orders sorted chronologically (most recent first) with real branch names
      const sorted = [...allOrders]
        .sort((a, b) => {
          const tB = parseUtcDate(b.created_at)?.getTime() ?? 0;
          const tA = parseUtcDate(a.created_at)?.getTime() ?? 0;
          return tB - tA;
        })
        .map((o) => ({
          ...o,
          branch_name: branchMap.get(o.branch_id) || o.branch_name || o.branch_id,
        }));
      setRecentOrders(sorted.slice(0, 6));
    } catch (e) {
      console.error('Error fetching admin dashboard metrics', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Executive Management"
        subtitle="RMS Enterprise Restaurant Management Overview"
        actions={
          <Link to="/admin/menus">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-gold-glow">
              <Plus className="w-4 h-4" />
              <span>New Menu Dish</span>
            </Button>
          </Link>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Good Morning Greeting Banner */}
        <div className="p-8 rounded-2xl bg-surface border border-border shadow-luxury relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="space-y-2 relative z-10 max-w-2xl">
            <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-medium">
              Enterprise Control Plane
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-foreground">
              {getTimeBasedGreeting()}, Welcome Back.
            </h2>
            <p className="text-xs sm:text-sm text-muted font-light leading-relaxed">
              Here is what is happening across your restaurant branches, dining halls, and billing terminals today.
            </p>
          </div>
        </div>

        {/* 5 KPI Cards - 100% Dynamic from live Backend Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Total Restaurants */}
          <Card elevation="glass" className="space-y-3 p-5">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs uppercase tracking-wider font-medium">Restaurants</span>
              <Store className="w-4 h-4 text-primary" />
            </div>
            <div className="font-serif text-3xl font-medium text-foreground">
              {isLoading ? '—' : totalRestaurants}
            </div>
            <p className="text-[11px] text-muted">
              {totalRestaurants} active concept{totalRestaurants === 1 ? '' : 's'}
            </p>
          </Card>

          {/* Total Branches */}
          <Card elevation="glass" className="space-y-3 p-5">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs uppercase tracking-wider font-medium">Branches</span>
              <UtensilsCrossed className="w-4 h-4 text-primary" />
            </div>
            <div className="font-serif text-3xl font-medium text-foreground">
              {isLoading ? '—' : totalBranches}
            </div>
            <p className="text-[11px] text-muted">
              {totalBranches} pan-India branch{totalBranches === 1 ? '' : 'es'}
            </p>
          </Card>

          {/* Total Orders */}
          <Card elevation="glass" className="space-y-3 p-5">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs uppercase tracking-wider font-medium">Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-warning" />
            </div>
            <div className="font-serif text-3xl font-medium text-foreground">
              {isLoading ? '—' : totalOrders}
            </div>
            <p className="text-[11px] text-muted">
              {totalOrders} order{totalOrders === 1 ? '' : 's'} placed
            </p>
          </Card>

          {/* Total Revenue - Reacts dynamically to every order placed */}
          <Card elevation="glass" className="space-y-3 p-5">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs uppercase tracking-wider font-medium">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-success" />
            </div>
            <div className="font-serif text-3xl font-medium text-foreground text-primary">
              {isLoading ? '—' : formatCurrency(totalRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-success font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Live Order Volume</span>
            </div>
          </Card>

          {/* Total Customers */}
          <Card elevation="glass" className="space-y-3 p-5">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs uppercase tracking-wider font-medium">Customers</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="font-serif text-3xl font-medium text-foreground">
              {isLoading ? '—' : totalCustomers}
            </div>
            <p className="text-[11px] text-muted">
              {totalCustomers} registered guest{totalCustomers === 1 ? '' : 's'}
            </p>
          </Card>
        </div>

        {/* Branch QR Code & Digital Menu Management Section */}
        <BranchQRManagerCard />

        {/* Visual Charts & Status Distribution Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue & Growth Visual - 100% Dynamic Monthly Aggregation */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-surface border border-border shadow-luxury space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl font-normal text-foreground">Revenue Trajectory</h3>
                <p className="text-xs text-muted">Monthly restaurant dining receipts & banquet performance</p>
              </div>
              <span className="text-xs font-mono text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                FY 2026 Live
              </span>
            </div>

            {/* Custom Luxury Revenue Bar Visualizer from actual order transactions */}
            <div className="h-48 flex items-end gap-3 pt-6 border-b border-border/60">
              {monthlyRevenue.map((bar) => (
                <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-primary whitespace-nowrap">
                    {formatCurrency(bar.amount)}
                  </div>
                  <div
                    style={{ height: `${bar.pct}%` }}
                    className="w-full rounded-t-md bg-gradient-to-t from-primary/30 to-primary group-hover:from-primary/50 group-hover:to-primary-hover transition-all duration-300"
                    title={`${bar.month}: ${formatCurrency(bar.amount)}`}
                  />
                  <span className="text-[11px] text-muted font-medium">{bar.month}</span>
                </div>
              ))}
            </div>

            {/* Dynamic Metric Indicators */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <span className="text-muted block">Avg Order Value</span>
                <span className="font-mono text-base font-semibold text-foreground">
                  {formatCurrency(avgOrderValue)}
                </span>
              </div>
              <div>
                <span className="text-muted block">Order Fulfillment Rate</span>
                <span className="font-mono text-base font-semibold text-foreground">
                  {fulfillmentRate}%
                </span>
              </div>
              <div>
                <span className="text-muted block">GST / Tax Generated</span>
                <span className="font-mono text-base font-semibold text-foreground">
                  {formatCurrency(taxCollected)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Status Distribution - 100% Dynamic from actual orders */}
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-luxury flex flex-col justify-between">
            <div className="pb-1">
              <h3 className="font-serif text-2xl font-normal text-foreground">Order Status</h3>
              <p className="text-xs text-muted mt-0.5">Real-time service distribution across {totalOrders} orders</p>
            </div>

            <div className="flex-1 flex flex-col justify-around py-2 min-h-[220px] text-xs">
              {/* Preparing / Ready */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-muted">
                  <span className="flex items-center gap-2 text-foreground/90 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Preparing in Kitchen
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {statusDistribution.preparing.count} ({statusDistribution.preparing.pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-secondary overflow-hidden">
                  <div
                    style={{ width: `${statusDistribution.preparing.pct}%` }}
                    className="h-full bg-primary rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Completed */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-muted">
                  <span className="flex items-center gap-2 text-foreground/90 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Completed & Billed
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {statusDistribution.completed.count} ({statusDistribution.completed.pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-secondary overflow-hidden">
                  <div
                    style={{ width: `${statusDistribution.completed.pct}%` }}
                    className="h-full bg-primary rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Placed / Confirmed */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-muted">
                  <span className="flex items-center gap-2 text-foreground/90 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-warning" /> New Placed Orders
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {statusDistribution.placed.count} ({statusDistribution.placed.pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-secondary overflow-hidden">
                  <div
                    style={{ width: `${statusDistribution.placed.pct}%` }}
                    className="h-full bg-warning rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Cancelled */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-muted">
                  <span className="flex items-center gap-2 text-foreground/90 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-danger" /> Cancelled
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {statusDistribution.cancelled.count} ({statusDistribution.cancelled.pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-secondary overflow-hidden">
                  <div
                    style={{ width: `${statusDistribution.cancelled.pct}%` }}
                    className="h-full bg-danger rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl font-normal text-foreground">Recent Authorized Orders</h3>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-luxury">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-secondary/60 text-xs uppercase tracking-wider text-muted">
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Branch Location</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Order Status</th>
                  <th className="px-6 py-4 font-medium">Payment</th>
                  <th className="px-6 py-4 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted text-xs">
                      Loading orders...
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted font-serif italic">
                      No active orders found. Click "+ Create New Order" in Orders page to dispatch dining tickets.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 text-xs text-foreground font-medium">
                        {order.customer_name || order.customer_id || 'Dining Guest'}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted">
                        {order.branch_name || order.branch_id}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <OrderStatusBadge status={order.order_status} />
                      </td>
                      <td className="px-6 py-4">
                        <PaymentStatusBadge status={order.payment_status} />
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-muted">
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

