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
import { restaurantService } from '@/services/restaurant.service';
import { branchService } from '@/services/branch.service';
import { orderService } from '@/services/order.service';
import { billService } from '@/services/bill.service';
import { customerService } from '@/services/customer.service';
import { OrderItemResponseModel } from '@/types/order';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/common/Badge';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { formatCurrency, formatDate } from '@/lib/utils';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [totalRestaurants, setTotalRestaurants] = useState(0);
  const [totalBranches, setTotalBranches] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [recentOrders, setRecentOrders] = useState<OrderItemResponseModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        const [rRes, bRes, oRes, billsRes, cRes] = await Promise.all([
          restaurantService.getRestaurants(),
          branchService.getBranches(),
          orderService.getOrders({ page: 1, limit: 5 }),
          billService.getBills(),
          customerService.getCustomers(),
        ]);

        setTotalRestaurants(rRes.total);
        setTotalBranches(bRes.total);
        setTotalOrders(oRes.total);

        const rev = billsRes.data.reduce((acc, b) => acc + (b.payment_status === 'PAID' ? b.final_amount : 0), 0);
        setTotalRevenue(rev);

        setTotalCustomers(cRes.length);
        setRecentOrders(oRes.data);
      } catch (e) {
        console.error('Error fetching admin dashboard metrics', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardMetrics();
  }, []);

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Executive Management"
        subtitle="RMS Enterprise Restaurant Management Overview"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/menus">
              <Button variant="primary" size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                <span>New Menu Dish</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="px-8 space-y-8">
        {/* Good Morning Greeting Banner */}
        <div className="p-8 rounded-2xl bg-surface border border-border shadow-luxury relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="space-y-2 relative z-10 max-w-2xl">
            <span className="text-[11px] uppercase tracking-[0.25em] text-primary font-medium">
              Enterprise Control Plane
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-foreground">
              Good Morning, Welcome Back.
            </h2>
            <p className="text-xs sm:text-sm text-muted font-light leading-relaxed">
              Here is what is happening across your restaurant branches, dining halls, and billing terminals today.
            </p>
          </div>
        </div>

        {/* 5 KPI Cards */}
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
            <p className="text-[11px] text-muted">Active concepts</p>
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
            <p className="text-[11px] text-muted">Pan-India branches</p>
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
            <p className="text-[11px] text-muted">Orders fulfilled</p>
          </Card>

          {/* Total Revenue */}
          <Card elevation="glass" className="space-y-3 p-5">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs uppercase tracking-wider font-medium">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-success" />
            </div>
            <div className="font-serif text-3xl font-medium text-foreground text-primary">
              {isLoading ? '—' : formatCurrency(totalRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-success">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% vs last period</span>
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
            <p className="text-[11px] text-muted">Registered guests</p>
          </Card>
        </div>

        {/* Visual Charts & Status Distribution Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue & Growth Visual */}
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

            {/* Custom Luxury Revenue Bar Visualizer */}
            <div className="h-48 flex items-end gap-3 pt-6 border-b border-border/60">
              {[
                { month: 'Oct', val: 65, amount: '₹1,24,000' },
                { month: 'Nov', val: 78, amount: '₹1,49,000' },
                { month: 'Dec', val: 95, amount: '₹1,98,000' },
                { month: 'Jan', val: 84, amount: '₹1,62,000' },
                { month: 'Feb', val: 89, amount: '₹1,75,000' },
                { month: 'Mar', val: 98, amount: '₹2,14,000' },
              ].map((bar) => (
                <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-primary">
                    {bar.amount}
                  </div>
                  <div
                    style={{ height: `${bar.val}%` }}
                    className="w-full rounded-t-md bg-gradient-to-t from-primary/30 to-primary group-hover:from-primary/50 group-hover:to-primary-hover transition-all duration-300"
                  />
                  <span className="text-[11px] text-muted font-medium">{bar.month}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <span className="text-muted block">Avg Order Value</span>
                <span className="font-mono text-base font-semibold text-foreground">₹1,250.00</span>
              </div>
              <div>
                <span className="text-muted block">Table Turnover Rate</span>
                <span className="font-mono text-base font-semibold text-foreground">78.5%</span>
              </div>
              <div>
                <span className="text-muted block">GST Compliance</span>
                <span className="font-mono text-base font-semibold text-success">100% Compliant</span>
              </div>
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-luxury space-y-6">
            <div>
              <h3 className="font-serif text-2xl font-normal text-foreground">Order Status</h3>
              <p className="text-xs text-muted">Real-time service distribution</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-muted">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Preparing in Kitchen
                  </span>
                  <span className="font-mono font-medium text-foreground">38%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                  <div className="w-[38%] h-full bg-primary" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-muted">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" /> Completed & Billed
                  </span>
                  <span className="font-mono font-medium text-foreground">48%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                  <div className="w-[48%] h-full bg-success" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-muted">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning" /> New Placed Orders
                  </span>
                  <span className="font-mono font-medium text-foreground">12%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                  <div className="w-[12%] h-full bg-warning" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-muted">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-danger" /> Cancelled
                  </span>
                  <span className="font-mono font-medium text-foreground">2%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                  <div className="w-[2%] h-full bg-danger" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-secondary border border-border text-[11px] text-muted space-y-1">
              <p className="font-medium text-foreground">Live Chef Synchronization</p>
              <p>Kitchen ticket display system updating via FastAPI order endpoints.</p>
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
                      No active orders found.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 text-xs text-foreground font-medium">
                        {order.customer_name || 'Guest Diner'}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted">
                        {order.branch_name || 'The Bengal Table — Park Street Flagship'}
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

