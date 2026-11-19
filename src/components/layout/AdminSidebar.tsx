import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Store,
  BookOpen,
  ClipboardList,
  Receipt,
  Users,
  Percent,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export const AdminSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Restaurants', path: '/admin/restaurants', icon: Store },
    { label: 'Branches', path: '/admin/branches', icon: UtensilsCrossed },
    { label: 'Menus', path: '/admin/menus', icon: BookOpen },
    { label: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { label: 'Bills & Invoicing', path: '/admin/bills', icon: Receipt },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Tax Configuration', path: '/admin/taxes', icon: Percent },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'relative bg-surface border-r border-border h-screen flex flex-col transition-all duration-300 z-30 sticky top-0 shrink-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-border/80 flex items-center justify-between shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-xs font-bold text-primary font-serif tracking-wider flex items-center justify-center w-7 h-7 rounded-full border border-primary/40 shrink-0">
              RMS
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-lg tracking-[0.15em] uppercase text-foreground leading-none font-medium truncate">
                RMS
              </h2>
              <span
                className="text-[9px] uppercase tracking-[0.15em] text-primary/90 font-medium block truncate max-w-[150px]"
                title={tenant?.tenant_name || user?.tenant_name || 'Admin Console'}
              >
                {tenant?.tenant_name || user?.tenant_name || 'Admin Console'}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <span className="text-xs font-bold text-primary font-serif tracking-wider flex items-center justify-center w-7 h-7 rounded-full border border-primary/40">
              RMS
            </span>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-secondary transition-colors',
            collapsed && 'hidden sm:block absolute -right-3.5 top-6 bg-surface border border-border rounded-full'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 text-primary" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/30 shadow-sm font-semibold'
                  : 'text-muted hover:text-foreground hover:bg-surface-secondary/70 border border-transparent',
                collapsed && 'justify-center px-0'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Switch to Dining Portal shortcut */}
      <div className="px-3 pb-3 shrink-0">
        <button
          onClick={() => navigate('/customer')}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted hover:text-primary hover:bg-surface-secondary border border-border/40 transition-colors',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Customer Portal' : undefined}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {!collapsed && <span>Customer Portal</span>}
        </button>
      </div>

      {/* User profile & Logout footer */}
      <div className="p-3 border-t border-border/80 bg-surface-secondary/40 shrink-0">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center flex-col')}>
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-bold text-xs shrink-0">
            {(user?.name || user?.email || 'A')[0].toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {user?.name || user?.email?.split('@')[0]}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block shrink-0" />
                <p className="text-[10px] text-muted uppercase tracking-wider truncate">
                  {user?.roles?.[0] || 'OWNER'} {tenant?.tenant_id ? `• ${tenant.tenant_id}` : (user?.tenant_id ? `• ${user.tenant_id}` : '')}
                </p>
              </div>
            </div>
          )}
          <ThemeToggle size="sm" />
          <button
            onClick={handleLogout}
            className="p-1.5 text-muted hover:text-danger rounded-md hover:bg-surface transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

