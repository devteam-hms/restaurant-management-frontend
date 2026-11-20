import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Key,
  Server,
  Building2,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { toast } from '@/utils/toast';
import { extractErrorMessage } from '@/utils/apiError';
import { API_BASE_URL } from '@/services/api';
import { formatDate } from '@/lib/utils';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { tenant, tenantId, isLoading, error, refreshTenant, updateTenant } = useTenant();

  const [tenantName, setTenantName] = useState('');
  const [tenantDescription, setTenantDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync form inputs when authenticated tenant record is loaded or updated
  useEffect(() => {
    if (tenant) {
      setTenantName(tenant.tenant_name || '');
      setTenantDescription(tenant.description || '');
    }
  }, [tenant]);

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) {
      toast.warning('Validation Warning', 'Restaurant or business name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      await updateTenant({
        tenant_name: tenantName.trim(),
        description: tenantDescription.trim() ? tenantDescription.trim() : null,
      });
      toast.success(
        'Organization Settings Saved',
        `Tenant details for "${tenantName.trim()}" have been updated successfully.`
      );
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to save organization changes');
      toast.error('Update Failed', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    tenant &&
    (tenantName.trim() !== (tenant.tenant_name || '').trim() ||
      tenantDescription.trim() !== (tenant.description || '').trim());

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Settings & Organization Profile"
        subtitle="Manage enterprise tenant parameters, Keycloak RBAC identity, and multi-tenant scoping"
      />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto w-full">
        {/* 1. TENANT ORGANIZATION PROFILE CARD */}
        {isLoading && !tenant ? (
          /* Loading Skeleton - avoids showing any misleading default tenant name */
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-luxury space-y-6 animate-pulse">
            <div className="flex items-center gap-3 pb-4 border-b border-border/80">
              <div className="w-10 h-10 rounded-full bg-surface-secondary" />
              <div className="space-y-2">
                <div className="w-48 h-5 bg-surface-secondary rounded" />
                <div className="w-64 h-3 bg-surface-secondary rounded" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-full h-10 bg-surface-secondary rounded-lg" />
              <div className="w-full h-24 bg-surface-secondary rounded-lg" />
            </div>
          </div>
        ) : error && !tenant ? (
          /* Error State */
          <div className="rounded-2xl border border-danger/30 bg-danger/10 p-8 shadow-luxury text-danger space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif text-xl font-medium">Unable to Load Tenant Organization</h3>
                <p className="text-xs opacity-90 mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refreshTenant()} className="gap-2">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Loading Profile</span>
            </Button>
          </div>
        ) : (
          /* Actual Authenticated Tenant Form */
          <form
            onSubmit={handleSaveTenant}
            className="rounded-2xl border border-border bg-surface p-8 shadow-luxury space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/80 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-primary font-serif tracking-wider flex items-center justify-center w-9 h-9 rounded-full border border-primary/40 bg-primary/10 shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </span>
                <div>
                  <h3 className="font-serif text-2xl font-normal text-foreground">
                    Organization & Tenant Profile
                  </h3>
                  <p className="text-xs text-muted">
                    Multi-tenant business identity reflected on menus, customer invoices, and bills
                  </p>
                </div>
              </div>

              {/* Verified Tenant Scope Badge */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary border border-border text-xs">
                  <span className="text-muted text-[11px]">Tenant ID:</span>
                  <span className="font-mono text-primary font-medium">
                    {tenant?.tenant_id || tenantId || 'Not Assigned'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Tenant Business Name"
                placeholder="e.g., Royal Thali House"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                helperText="Official restaurant organization registered with RMS and Keycloak RBAC"
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-medium text-muted">
                  Executive Overview & Description
                </label>
                <textarea
                  className="w-full bg-surface-secondary text-foreground text-sm rounded-lg p-3 border border-border focus:border-primary focus:outline-none transition-colors"
                  rows={3}
                  placeholder="Describe your restaurant enterprise, culinary specialty, and heritage..."
                  value={tenantDescription}
                  onChange={(e) => setTenantDescription(e.target.value)}
                />
              </div>

              {tenant?.created_at && (
                <div className="flex items-center gap-4 text-[11px] text-muted pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary/70" />
                    Created: {formatDate(tenant.created_at)}
                  </span>
                  {tenant.updated_at && (
                    <span>• Last Modified: {formatDate(tenant.updated_at)}</span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border/80">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (tenant) {
                    setTenantName(tenant.tenant_name || '');
                    setTenantDescription(tenant.description || '');
                  }
                }}
                disabled={!hasChanges || isSaving}
              >
                Discard Changes
              </Button>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                disabled={!hasChanges || isSaving}
              >
                Save Organization Changes
              </Button>
            </div>
          </form>
        )}

        {/* 2. AUTHENTICATED USER PROFILE (Separated from Tenant Profile) */}
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-luxury space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border/80">
            <span className="text-xs font-bold text-primary font-serif tracking-wider flex items-center justify-center w-9 h-9 rounded-full border border-primary/40 bg-primary/10 shrink-0">
              <UserCheck className="w-4 h-4 text-primary" />
            </span>
            <div>
              <h3 className="font-serif text-2xl font-normal text-foreground">
                Logged-In User Profile
              </h3>
              <p className="text-xs text-muted">
                Personal credentials and permissions for the active session operator
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-1.5">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Operator Name</span>
              <p className="font-semibold text-foreground text-sm">
                {user?.name || user?.username || 'Executive Operator'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-1.5">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Account Email</span>
              <p className="font-mono text-foreground text-sm truncate">
                {user?.email || 'N/A'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-1.5">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Assigned Keycloak Roles</span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {user?.roles && user.roles.length > 0 ? (
                  user.roles.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono text-[11px]"
                    >
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-muted font-mono">OWNER, TENANT_ADMIN</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-1.5">
              <span className="text-muted block text-[11px] uppercase tracking-wider">User Subject Identifier</span>
              <p className="font-mono text-muted text-[11px] truncate">
                {user?.id || user?.keycloak_id || 'Verified Keycloak Principal'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. SECURITY & KEYCLOAK IAM INTEGRATION */}
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-luxury space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border/80">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-serif text-2xl font-normal text-foreground">
                Security & Keycloak IAM Integration
              </h3>
              <p className="text-xs text-muted">Bearer token authorization & multi-tenant data isolation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Key className="w-4 h-4 text-primary" />
                <span>Identity Provider</span>
              </div>
              <p className="text-muted">Keycloak Realm: <span className="font-mono text-primary">rms-realm</span></p>
              <p className="text-muted">Token Scope: <span className="font-mono text-foreground">openid email profile roles</span></p>
            </div>

            <div className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Server className="w-4 h-4 text-primary" />
                <span>FastAPI Base URL</span>
              </div>
              <p className="font-mono text-foreground">{API_BASE_URL}</p>
              <p className="text-[11px] text-muted">Scoping: Automatic per-tenant membership validation</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-secondary/60 border border-border text-xs text-muted space-y-1">
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Tenant Data Isolation Active:</span>
            </div>
            <p className="text-foreground/80 leading-relaxed text-[11px]">
              Every database operation is securely bound to{' '}
              <strong className="text-primary font-mono">{tenant?.tenant_id || tenantId || 'Authenticated Tenant'}</strong>. Cross-tenant queries are rejected by the backend with HTTP 403 Forbidden.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
