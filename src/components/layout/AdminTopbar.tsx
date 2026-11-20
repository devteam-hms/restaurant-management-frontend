import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { Store } from 'lucide-react';
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
    <header className="min-h-[5.25rem] py-4 px-4 sm:px-6 lg:px-8 border-b border-border/80 bg-surface/80 backdrop-blur-md sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 transition-colors">
      <div className="py-1 min-w-0">
        <h1 className="font-serif text-xl sm:text-2xl font-normal text-foreground tracking-wide leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-3.5 ml-auto">
        {actions}

        {actions && (
          <div className="hidden sm:block h-6 w-px bg-border/80 mx-0.5" />
        )}

        {/* Dynamic Tenant status pill */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-secondary border border-border/80 text-xs text-muted shadow-sm hover:border-primary/40 transition-colors">
          <Store className="w-3.5 h-3.5 text-primary shrink-0" />
          <span
            className="text-foreground font-medium truncate max-w-[150px] lg:max-w-[200px]"
            title={tenant?.tenant_name || user?.tenant_name || undefined}
          >
            {tenant?.tenant_name || user?.tenant_name || 'Restaurant Business'}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-primary/90 font-semibold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 shrink-0">
            Multi-Branch
          </span>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle size="sm" />
      </div>
    </header>
  );
};

