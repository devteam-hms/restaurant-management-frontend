"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Building2,
  GitBranch,
  Eye,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
  DollarSign,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { restaurantService } from "@/services/restaurant.service";
import { branchService } from "@/services/branch.service";
import { menuService } from "@/services/menu.service";
import { RestaurantItem } from "@/types/restaurant";
import { BranchItem } from "@/types/branch";
import { MenuItem } from "@/types/menu";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, RoleBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { MenuDialog } from "@/components/dialogs/menu-dialog";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/context/toast-context";
import { extractErrorMessage } from "@/services/api";
import { formatDate } from "@/lib/utils";

export default function MenuManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const {
    currentTenant,
    roles,
    canCreateMenu,
    canUpdateMenu,
    canDeleteMenu,
  } = useAuth();

  // Hierarchy Selection States
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Menu items list state
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // "ALL", "1", "0"
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [menuToEdit, setMenuToEdit] = useState<MenuItem | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuToView, setMenuToView] = useState<MenuItem | null>(null);

  // Initial URL params
  const paramRestaurantId = searchParams.get("restaurant_id");
  const paramBranchId = searchParams.get("branch_id");

  // 1. Fetch Restaurants for the current tenant
  useEffect(() => {
    if (!currentTenant) return;

    let isMounted = true;
    async function fetchRestaurants() {
      setLoadingRestaurants(true);
      try {
        const res = await restaurantService.getRestaurants({
          page: 1,
          limit: 100,
          tenant_id: currentTenant?.tenant_id,
        });

        if (!isMounted) return;
        setRestaurants(res.data);

        // Auto-select restaurant from URL or default to first
        if (paramRestaurantId && res.data.some((r) => r.restaurant_id === paramRestaurantId)) {
          setSelectedRestaurantId(paramRestaurantId);
        } else if (res.data.length > 0 && !selectedRestaurantId) {
          setSelectedRestaurantId(res.data[0].restaurant_id);
        }
      } catch (err) {
        console.error("Failed to load restaurants:", err);
      } finally {
        if (isMounted) setLoadingRestaurants(false);
      }
    }

    fetchRestaurants();
    return () => {
      isMounted = false;
    };
  }, [currentTenant, paramRestaurantId]);

  // 2. Fetch Branches when selected restaurant changes
  useEffect(() => {
    if (!selectedRestaurantId) {
      setBranches([]);
      setSelectedBranchId("");
      return;
    }

    let isMounted = true;
    async function fetchBranches() {
      setLoadingBranches(true);
      try {
        const res = await branchService.getBranches({
          restaurant_id: selectedRestaurantId,
          page: 1,
          limit: 100,
        });

        if (!isMounted) return;
        setBranches(res.data);

        // Auto-select branch from URL or default to first
        if (paramBranchId && res.data.some((b) => b.branch_id === paramBranchId)) {
          setSelectedBranchId(paramBranchId);
        } else if (res.data.length > 0) {
          setSelectedBranchId(res.data[0].branch_id);
        } else {
          setSelectedBranchId("");
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
        if (isMounted) setBranches([]);
      } finally {
        if (isMounted) setLoadingBranches(false);
      }
    }

    fetchBranches();
    return () => {
      isMounted = false;
    };
  }, [selectedRestaurantId, paramBranchId]);

  // 3. Fetch Menus for the selected branch
  const fetchMenus = useCallback(async () => {
    if (!selectedBranchId) {
      setMenus([]);
      setTotalRecords(0);
      setTotalPages(1);
      return;
    }

    setLoadingMenus(true);
    setErrorMessage(null);

    const statusParam =
      statusFilter === "1" ? 1 : statusFilter === "0" ? 0 : undefined;

    try {
      const res = await menuService.getMenusByBranch(selectedBranchId, {
        page,
        limit,
        status: statusParam,
      });

      setMenus(res.data);
      setTotalRecords(res.pagination.total_records);
      setTotalPages(res.pagination.total_pages);
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      setErrorMessage(msg);
      setMenus([]);
    } finally {
      setLoadingMenus(false);
    }
  }, [selectedBranchId, page, limit, statusFilter]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  // Handle Restaurant Change
  const handleRestaurantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRestId = e.target.value;
    setSelectedRestaurantId(newRestId);
    setSelectedBranchId("");
    setPage(1);
  };

  // Handle Branch Change
  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBranchId(e.target.value);
    setPage(1);
  };

  // Handle Menu Delete
  const handleDeleteMenu = async () => {
    if (!menuToDelete || !selectedBranchId) return;

    setIsDeleting(true);
    try {
      await menuService.deleteMenu(selectedBranchId, menuToDelete.id);
      toast.success(
        `Menu item "${menuToDelete.menu_name}" was successfully deleted.`,
        "Item Deleted"
      );
      setMenuToDelete(null);
      await fetchMenus();
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      toast.error(msg, "Cannot Delete Menu Item");
    } finally {
      setIsDeleting(false);
    }
  };

  // Real statistics based on fetched records
  const availableCount = useMemo(
    () => menus.filter((m) => m.status === 1).length,
    [menus]
  );
  const unavailableCount = useMemo(
    () => menus.filter((m) => m.status === 0).length,
    [menus]
  );

  // Filtered menus for search query
  const filteredMenus = useMemo(() => {
    if (!searchQuery.trim()) return menus;
    const query = searchQuery.toLowerCase();
    return menus.filter(
      (m) =>
        m.menu_name.toLowerCase().includes(query) ||
        m.short_description.toLowerCase().includes(query) ||
        m.long_description.toLowerCase().includes(query)
    );
  }, [menus, searchQuery]);

  const currentBranchName = useMemo(() => {
    return branches.find((b) => b.branch_id === selectedBranchId)?.branch_name;
  }, [branches, selectedBranchId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Menu Management
            </h1>
            {roles[0] && <RoleBadge role={roles[0]} />}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create, update, and manage branch-level culinary offerings, pricing, and availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMenus}
            isLoading={loadingMenus}
            disabled={!selectedBranchId}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {/* Create Menu Button: Only for OWNER & MANAGER */}
          {canCreateMenu && (
            <Button
              size="sm"
              disabled={!selectedBranchId}
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Menu Item</span>
            </Button>
          )}
        </div>
      </div>

      {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

      {/* Hierarchy Selector Card (Restaurant -> Branch) */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-sm shrink-0">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Select Location:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {/* Restaurant Dropdown */}
            <div className="relative">
              <select
                value={selectedRestaurantId}
                onChange={handleRestaurantChange}
                disabled={loadingRestaurants || restaurants.length === 0}
                className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
              >
                <option value="">
                  {loadingRestaurants
                    ? "Loading restaurants..."
                    : restaurants.length === 0
                    ? "No restaurants registered"
                    : "-- Select Restaurant --"}
                </option>
                {restaurants.map((rest) => (
                  <option key={rest.restaurant_id} value={rest.restaurant_id}>
                    {rest.restaurant_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Dropdown */}
            <div className="relative">
              <select
                value={selectedBranchId}
                onChange={handleBranchChange}
                disabled={
                  loadingBranches ||
                  !selectedRestaurantId ||
                  branches.length === 0
                }
                className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
              >
                <option value="">
                  {!selectedRestaurantId
                    ? "-- Select Restaurant First --"
                    : loadingBranches
                    ? "Loading branches..."
                    : branches.length === 0
                    ? "No branches found for this restaurant"
                    : "-- Select Branch Outlet --"}
                </option>
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name} ({b.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Overview Cards (Branch Level) */}
      {selectedBranchId && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Menu Items
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {totalRecords}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Available Items
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {availableCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Unavailable / Sold Out
                </p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {unavailableCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter, Search & View Toggle Bar */}
      {selectedBranchId && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search dish by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="w-full sm:w-44">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <option value="ALL">All Items</option>
                <option value="1">Available (Active)</option>
                <option value="0">Unavailable (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing {filteredMenus.length} of {totalRecords} items
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid Cards View"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table View"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!selectedRestaurantId || !selectedBranchId ? (
        <Card className="p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Please Select a Location
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5">
            Menus are managed per operational branch outlet. Choose a restaurant brand and branch outlet from the dropdown above to load its menu catalog.
          </p>
        </Card>
      ) : loadingMenus ? (
        <div className="py-20 text-center">
          <Spinner size="lg" label="Loading branch menu items..." />
        </div>
      ) : filteredMenus.length === 0 ? (
        <Card className="p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            No Menu Items Found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5 mb-6">
            {searchQuery || statusFilter !== "ALL"
              ? "No dishes matched your active search query or availability filter."
              : `Branch "${currentBranchName}" does not have any dishes listed yet.`}
          </p>
          {canCreateMenu && !searchQuery && (
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              <span>Add First Dish</span>
            </Button>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        /* ==================== Grid View ==================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredMenus.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden flex flex-col justify-between group hover:shadow-lg transition-all duration-200 border-slate-200/80 dark:border-slate-800"
              >
                {/* Image Header with Price & Status Badge */}
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.menu_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback placeholder
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60";
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <Badge
                      variant={item.status === 1 ? "emerald" : "rose"}
                      className="shadow-sm font-semibold text-[11px]"
                    >
                      {item.status === 1 ? "Available" : "Sold Out"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-xs text-white font-bold text-sm shadow-md">
                    ₹{item.price.toFixed(2)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate mb-1">
                      {item.menu_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.short_description}
                    </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Updated {formatDate(item.updated_at)}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMenuToView(item)}
                        title="View Dish Details"
                        className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {/* Edit Button: OWNER & MANAGER only */}
                      {canUpdateMenu && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMenuToEdit(item)}
                          title="Edit Dish"
                          className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Delete Button: OWNER & MANAGER only */}
                      {canDeleteMenu && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMenuToDelete(item)}
                          title="Delete Dish"
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Page <span className="font-semibold">{page}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ==================== Table View ==================== */
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dish</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMenus.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.menu_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60";
                          }}
                        />
                      </div>
                      <span className="truncate max-w-[180px]">{item.menu_name}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                    {item.short_description}
                  </TableCell>

                  <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                    ₹{item.price.toFixed(2)}
                  </TableCell>

                  <TableCell>
                    <Badge variant={item.status === 1 ? "emerald" : "rose"}>
                      {item.status === 1 ? "Available" : "Sold Out"}
                    </Badge>
                  </TableCell>

                  <TableCell className="hidden md:table-cell text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(item.updated_at)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMenuToView(item)}
                        title="View Details"
                        className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {canUpdateMenu && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMenuToEdit(item)}
                          title="Edit Item"
                          className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}

                      {canDeleteMenu && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMenuToDelete(item)}
                          title="Delete Item"
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Page <span className="font-semibold">{page}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Create / Edit Menu Dialog */}
      {selectedBranchId && (
        <MenuDialog
          isOpen={isCreateOpen || !!menuToEdit}
          onClose={() => {
            setIsCreateOpen(false);
            setMenuToEdit(null);
          }}
          branchId={selectedBranchId}
          branchName={currentBranchName}
          menuToEdit={menuToEdit}
          onSuccess={fetchMenus}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!menuToDelete}
        onClose={() => setMenuToDelete(null)}
        onConfirm={handleDeleteMenu}
        title="Delete Menu Item?"
        message={`Are you sure you want to delete "${menuToDelete?.menu_name}"? This action permanently removes the item from branch ${currentBranchName}.`}
        confirmText="Confirm & Delete"
        variant="destructive"
        isLoading={isDeleting}
      />

      {/* View Item Details Modal */}
      {menuToView && (
        <Dialog
          isOpen={!!menuToView}
          onClose={() => setMenuToView(null)}
          title={menuToView.menu_name}
          description={`Branch: ${currentBranchName || menuToView.branch_id}`}
          maxWidth="lg"
        >
          <div className="space-y-4 pt-2">
            <div className="relative h-56 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={menuToView.image}
                alt={menuToView.menu_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60";
                }}
              />
              <div className="absolute top-3 left-3">
                <Badge
                  variant={menuToView.status === 1 ? "emerald" : "rose"}
                  className="shadow-sm font-semibold"
                >
                  {menuToView.status === 1 ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-xs text-white font-bold text-base shadow-md">
                ₹{menuToView.price.toFixed(2)}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Summary
              </h4>
              <p className="text-sm text-slate-800 dark:text-slate-200">
                {menuToView.short_description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Full Description
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {menuToView.long_description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Item ID: {menuToView.id}</span>
              <span>Updated: {formatDate(menuToView.updated_at)}</span>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
