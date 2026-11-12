import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Compass,
  ShoppingBag,
  Receipt,
  User,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { isTenantAdmin } from '@/lib/permissions';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export const CustomerSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Overview', path: '/customer', icon: Sparkles, end: true },
    { label: 'Explore Restaurants', path: '/customer/explore', icon: Compass },
    {
      label: 'My Orders',
      path: '/customer/orders',
      icon: ShoppingBag,
      badge: totalCount > 0 ? `${totalCount} active` : undefined,
    },
    { label: 'My Bills', path: '/customer/bills', icon: Receipt },
    { label: 'My Profile', path: '/customer/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showAdminLink = user && isTenantAdmin(user.roles);

  return (
    <aside className="w-64 bg-surface border-r border-border min-h-screen flex flex-col z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-border/80">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary font-serif tracking-wider flex items-center justify-center w-7 h-7 rounded-full border border-primary/40 shrink-0">
            RMS
          </span>
          <div>
            <h2 className="font-serif text-xl tracking-[0.15em] uppercase text-foreground leading-none font-medium">
              RMS
            </h2>
            <span className="text-[9px] uppercase tracking-[0.25em] text-primary/90 font-medium">
              Guest Dining Portal
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium tracking-wide transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/30 font-semibold shadow-sm'
                  : 'text-muted hover:text-foreground hover:bg-surface-secondary/70 border border-transparent'
              )
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Switch to Management shortcut (if authorized) */}
      {showAdminLink && (
        <div className="px-4 pb-3">
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span>Switch to Admin Portal</span>
          </button>
        </div>
      )}

      {/* Customer profile card footer */}
      <div className="p-4 border-t border-border/80 bg-surface-secondary/40">
        <div className="flex items-center gap-3">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || 'Profile'}
              className="w-9 h-9 rounded-full object-cover border border-primary/40 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-bold text-xs shrink-0">
              {(user?.name || user?.email || 'C')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate leading-tight">
              {user?.name || 'Valued Diner'}
            </p>
            <p className="text-[10px] text-primary/80 uppercase tracking-wider truncate">
              RMS Privilege Member
            </p>
          </div>
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

