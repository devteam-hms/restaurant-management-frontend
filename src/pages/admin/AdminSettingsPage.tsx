import React, { useState } from 'react';
import { Settings, ShieldCheck, Key, Database, Server, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';
import { API_BASE_URL } from '@/services/api';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [tenantName, setTenantName] = useState('RMS Hospitality Group');
  const [tenantDescription, setTenantDescription] = useState(
    'Leading Indian fine dining and hospitality conglomerate operating premier restaurant brands across Kolkata, New Delhi, Mumbai, and Bengaluru.'
  );
  const [isSaving, setIsSaving] = useState(false);
  const { success } = useToast();

  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      success('Tenant Settings Saved', 'Organization information updated successfully.');
    }, 500);
  };

  return (
    <div className="space-y-8">
      <AdminTopbar
        title="Settings & System Architecture"
        subtitle="Tenant identity parameters, Keycloak RBAC status, and backend connectivity"
      />

      <div className="px-8 space-y-8 max-w-5xl">
        {/* Tenant Profile Settings */}
        <form
          onSubmit={handleSaveTenant}
          className="rounded-2xl border border-border bg-surface p-8 shadow-luxury space-y-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border/80">
            <span className="text-xs font-bold text-primary font-serif tracking-wider flex items-center justify-center w-8 h-8 rounded-full border border-primary/40 shrink-0">
              RMS
            </span>
            <div>
              <h3 className="font-serif text-2xl font-normal text-foreground">
                Organization & Tenant Profile
              </h3>
              <p className="text-xs text-muted">Business identity reflected on customer invoices and menus</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Tenant Business Name"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider font-medium text-muted">
                Executive Overview & Description
              </label>
              <textarea
                className="w-full bg-surface-secondary text-foreground text-sm rounded-lg p-3 border border-border focus:border-primary focus:outline-none"
                rows={3}
                value={tenantDescription}
                onChange={(e) => setTenantDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Save Organization Changes
            </Button>
          </div>
        </form>

        {/* Security & Authentication Info */}
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-luxury space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border/80">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-serif text-2xl font-normal text-foreground">
                Security & Keycloak IAM Integration
              </h3>
              <p className="text-xs text-muted">Bearer token authorization & role-based access control</p>
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
              <p className="text-[11px] text-muted">Configured via VITE_API_BASE_URL</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-secondary/60 border border-border text-xs text-muted space-y-1">
            <span className="font-semibold text-foreground block">Active Authenticated Principal:</span>
            <p>User Email: <span className="text-foreground">{user?.email || 'owner@rms.com'}</span></p>
            <p>Assigned Roles: <span className="text-primary font-mono">{user?.roles.join(', ') || 'OWNER, TENANT_ADMIN'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

