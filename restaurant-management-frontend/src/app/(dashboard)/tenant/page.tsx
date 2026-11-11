"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Calendar,
  Clock,
  Hash,
  ShieldCheck,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileText,
  UtensilsCrossed,
  Layers,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { tenantService } from "@/services/tenant.service";
import { restaurantService } from "@/services/restaurant.service";
import { TenantItem } from "@/types/tenant";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, RoleBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { TenantEditDialog } from "@/components/dialogs/tenant-edit-dialog";
import { InviteUserDialog } from "@/components/dialogs/invite-user-dialog";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { useToast } from "@/context/toast-context";
import { extractErrorMessage } from "@/services/api";

export default function TenantPage() {
  const toast = useToast();
  const {
    user,
    roles,
    currentTenant,
    setCurrentTenant,
    canUpdateTenant,
    canDeleteTenant,
    canInviteUsers,
    logout,
  } = useAuth();

  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantCount, setRestaurantCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await tenantService.getTenants(1, 20);
      setTenants(res.data);
      if (res.data.length > 0) {
        // If current tenant is not in list or not selected, pick first
        const active =
          res.data.find((t) => t.tenant_id === currentTenant?.tenant_id) ||
          res.data[0];
        setCurrentTenant(active);

        // Fetch count of restaurants for dependency info
        try {
          const restRes = await restaurantService.getRestaurants({
            page: 1,
            limit: 1,
            tenant_id: active.tenant_id,
          });
          setRestaurantCount(restRes.pagination.total_records);
        } catch {
          // Non-fatal
        }
      }
    } catch (err) {
      const msg = extractErrorMessage(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.tenant_id, setCurrentTenant]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleDeleteTenant = async () => {
    if (!currentTenant) return;
    setIsDeleting(true);
    try {
      await tenantService.deleteTenant(currentTenant.tenant_id);
      toast.success(
        `Business "${currentTenant.tenant_name}" has been deleted.`,
        "Tenant Deleted"
      );
      setIsDeleteDialogOpen(false);
      // Since the tenant is deleted, refresh or logout
      await fetchTenants();
      if (tenants.length <= 1) {
        logout();
      }
    } catch (err) {
      const msg = extractErrorMessage(err);
      toast.error(msg, "Delete Operation Rejected");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tenant Organization
            </h1>
            {roles[0] && <RoleBadge role={roles[0]} />}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View and manage your registered multi-tenant business entity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTenants}
            isLoading={loading}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {canInviteUsers && currentTenant && (
            <Button
              size="sm"
              onClick={() => setIsInviteDialogOpen(true)}
              className="gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Member</span>
            </Button>
          )}

          {canUpdateTenant && currentTenant && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
              className="gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Edit Details</span>
            </Button>
          )}

          {canDeleteTenant && currentTenant && (
            <Button
              size="sm"
              variant="destructiveOutline"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Tenant</span>
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive">{errorMessage}</Alert>
      )}

      {loading ? (
        <div className="py-16">
          <Spinner size="lg" label="Loading tenant profile..." />
        </div>
      ) : !currentTenant ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              No Tenant Record Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Your account currently does not belong to any active restaurant business tenant.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Tenant Details Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl shadow-xs">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-900 dark:text-slate-100 font-bold">
                        {currentTenant.tenant_name}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        ID: {currentTenant.tenant_id}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="emerald" className="font-semibold">
                    ACTIVE
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Description & Overview
                  </h4>
                  <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50/80 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    {currentTenant.description || (
                      <span className="italic text-slate-400 dark:text-slate-500">
                        No description provided. Click &apos;Edit Details&apos; to add information about your restaurant group.
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 transition-colors">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Registration Date</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatDate(currentTenant.created_at)}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 transition-colors">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Last Updated</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatDate(currentTenant.updated_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dependency Warning Card */}
            <div className="rounded-2xl border border-amber-300/70 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/25 p-4 flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                <span className="font-bold text-amber-900 dark:text-amber-300">
                  Tenant Integrity & Safety Rules:{" "}
                </span>
                The backend enforces strict database cascading safeguards. You cannot delete a business tenant if it contains active restaurants or branches (currently {restaurantCount} restaurant{restaurantCount === 1 ? "" : "s"}). All child resources must be cleared first.
              </div>
            </div>
          </div>

          {/* Sidebar / Quick Stats & Memberships */}
          <div className="space-y-6">
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tenant Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <UtensilsCrossed className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Registered Restaurants
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {restaurantCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Your Access Level
                    </span>
                  </div>
                  <span className="text-xs font-semibold uppercase text-slate-900 dark:text-slate-100">
                    {roles[0] || "MEMBER"}
                  </span>
                </div>

                <div className="pt-2">
                  <a
                    href="/restaurants"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Manage Restaurants</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Tenant Dialog */}
      <TenantEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        tenant={currentTenant}
        onSuccess={(updated) => {
          setCurrentTenant(updated);
          fetchTenants();
        }}
      />

      {/* Invite User Dialog */}
      {currentTenant && (
        <InviteUserDialog
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          tenantId={currentTenant.tenant_id}
          onSuccess={() => {
            fetchTenants();
          }}
        />
      )}

      {/* Delete Tenant Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteTenant}
        title="Delete Business Tenant?"
        message={`Are you sure you want to delete "${currentTenant?.tenant_name}"? This action cannot be undone. Note: The backend will reject deletion if any dependent restaurants or branches exist.`}
        confirmText="Confirm & Delete Tenant"
        isLoading={isDeleting}
      />
    </div>
  );
}

