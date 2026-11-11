"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  UtensilsCrossed,
  GitBranch,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { restaurantService } from "@/services/restaurant.service";
import { branchService } from "@/services/branch.service";
import { RestaurantItem } from "@/types/restaurant";
import { BranchItem } from "@/types/branch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, RoleBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";
import { RestaurantDialog } from "@/components/dialogs/restaurant-dialog";
import { BranchDialog } from "@/components/dialogs/branch-dialog";

export default function DashboardPage() {
  const {
    user,
    roles,
    currentTenant,
    canCreateRestaurant,
    canCreateBranch,
    setCurrentRestaurant,
  } = useAuth();

  const [loading, setLoading] = useState(true);
  const [totalRestaurants, setTotalRestaurants] = useState<number>(0);
  const [totalBranches, setTotalBranches] = useState<number>(0);
  const [recentRestaurants, setRecentRestaurants] = useState<RestaurantItem[]>([]);
  const [recentBranches, setRecentBranches] = useState<BranchItem[]>([]);

  // Dialog states
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!currentTenant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch restaurants for current tenant
      const restRes = await restaurantService.getRestaurants({
        page: 1,
        limit: 5,
        tenant_id: currentTenant.tenant_id,
      });
      setTotalRestaurants(restRes.pagination.total_records);
      setRecentRestaurants(restRes.data);

      // 2. Fetch branches for current tenant
      const branchRes = await branchService.getBranches({
        page: 1,
        limit: 5,
        tenant_id: currentTenant.tenant_id,
      });
      setTotalBranches(branchRes.pagination.total_records);
      setRecentBranches(branchRes.data);
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Admin Overview
            </h1>
            {roles[0] && <RoleBadge role={roles[0]} />}
          </div>
          <p className="text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-800">{user?.email || user?.username}</span>. Here is what is happening across your restaurants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={loading}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {canCreateRestaurant && currentTenant && (
            <Button
              size="sm"
              onClick={() => setIsRestaurantModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Restaurant</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Active Tenant Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tenant Organization
            </CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900 truncate">
              {currentTenant?.tenant_name || "No Active Tenant"}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="emerald" className="text-[10px]">
                ACTIVE
              </Badge>
              <span className="text-xs text-slate-500 truncate">
                Created {formatDate(currentTenant?.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Restaurants Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Restaurants
            </CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : totalRestaurants}
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
              <span>Brands under current tenant</span>
              <a
                href="/restaurants"
                className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-0.5"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Total Branches Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Branches
            </CardTitle>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <GitBranch className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : totalBranches}
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
              <span>Operational outlets</span>
              <a
                href="/branches"
                className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-0.5"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Recently Created Restaurants & Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Restaurants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Recent Restaurants
              </CardTitle>
              <CardDescription>
                Recently registered restaurant entities
              </CardDescription>
            </div>
            <a
              href="/restaurants"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Manage
            </a>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Spinner size="sm" label="Fetching restaurants..." />
            ) : recentRestaurants.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No restaurants created yet.</p>
                {canCreateRestaurant && currentTenant && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setIsRestaurantModalOpen(true)}
                  >
                    Create First Restaurant
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {recentRestaurants.map((rest) => (
                  <div
                    key={rest.restaurant_id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {rest.restaurant_name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {rest.description || "No description provided"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        {formatDate(rest.created_at)}
                      </span>
                      <a
                        href={`/branches?restaurant_id=${encodeURIComponent(rest.restaurant_id)}`}
                        onClick={() => setCurrentRestaurant(rest)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        Branches
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Branches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Recent Branches
              </CardTitle>
              <CardDescription>
                Latest operational branch locations
              </CardDescription>
            </div>
            <a
              href="/branches"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Manage
            </a>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Spinner size="sm" label="Fetching branches..." />
            ) : recentBranches.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No branches created yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Create a restaurant first, then add branches.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBranches.map((branch) => (
                  <div
                    key={branch.branch_id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {branch.branch_name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {branch.city}, {branch.state}
                        </span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[11px] text-slate-400">
                        {formatDate(branch.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Dialog for Restaurant Creation from Dashboard */}
      {currentTenant && (
        <RestaurantDialog
          isOpen={isRestaurantModalOpen}
          onClose={() => setIsRestaurantModalOpen(false)}
          tenantId={currentTenant.tenant_id}
          onSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
}

