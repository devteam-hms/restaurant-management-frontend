import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { Store, Bell, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export interface AdminTopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({ title, subtitle, actions }) => {
  const { user } = useAuth();
  const { tenant } = useTenant();

  return (
    <header className="h-18 px-8 border-b border-border bg-surface/70 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
      <div>
        <h1 className="font-serif text-2xl font-normal text-foreground tracking-wide">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {actions}

        {/* Dynamic Tenant status pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-secondary border border-border text-xs text-muted">
          <Store className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[200px]" title={tenant?.tenant_name || user?.tenant_name || undefined}>
            {tenant?.tenant_name || user?.tenant_name || 'Restaurant Business'}
          </span>
          <span className="text-[10px] text-muted shrink-0">• Multi-Branch</span>
        </div>

        {/* Keycloak Verified Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-[11px] text-primary">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Keycloak RBAC Active</span>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle size="sm" />

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
};

