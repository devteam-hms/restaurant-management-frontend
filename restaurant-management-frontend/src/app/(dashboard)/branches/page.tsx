"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  GitBranch,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Mail,
  Phone,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { branchService } from "@/services/branch.service";
import { restaurantService } from "@/services/restaurant.service";
import { BranchItem } from "@/types/branch";
import { RestaurantItem } from "@/types/restaurant";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, RoleBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { BranchDialog } from "@/components/dialogs/branch-dialog";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { useToast } from "@/context/toast-context";
import { extractErrorMessage } from "@/services/api";

function BranchesContent() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const queryRestaurantId = searchParams.get("restaurant_id");

  const {
    currentTenant,
    roles,
    canCreateBranch,
    canUpdateBranch,
    canDeleteBranch,
    currentRestaurant,
    setCurrentRestaurant,
  } = useAuth();

  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<BranchItem | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<BranchItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewBranch, setViewBranch] = useState<BranchItem | null>(null);

  // 1. Fetch available restaurants under current tenant
  useEffect(() => {
    async function fetchAllRestaurants() {
      if (!currentTenant) return;
      setLoadingRestaurants(true);
      try {
        const res = await restaurantService.getRestaurants({
          page: 1,
          limit: 100,
          tenant_id: currentTenant.tenant_id,
        });
        setRestaurants(res.data);

        // Determine active restaurant ID
        if (queryRestaurantId) {
          setSelectedRestaurantId(queryRestaurantId);
          const matched = res.data.find((r) => r.restaurant_id === queryRestaurantId);
          if (matched) setCurrentRestaurant(matched);
        } else if (currentRestaurant) {
          setSelectedRestaurantId(currentRestaurant.restaurant_id);
        } else if (res.data.length > 0) {
          setSelectedRestaurantId(res.data[0].restaurant_id);
          setCurrentRestaurant(res.data[0]);
        }
      } catch (err) {
        console.error("Error loading restaurants list:", err);
      } finally {
        setLoadingRestaurants(false);
      }
    }

    fetchAllRestaurants();
  }, [currentTenant, queryRestaurantId, currentRestaurant, setCurrentRestaurant]);

  // 2. Fetch branches for selected restaurant
  const fetchBranches = useCallback(async () => {
    if (!selectedRestaurantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await branchService.getBranches({
        page,
        limit,
        restaurant_id: selectedRestaurantId,
      });
      setBranches(res.data);
      setTotalRecords(res.pagination.total_records);
      setTotalPages(res.pagination.total_pages);
    } catch (err) {
      const msg = extractErrorMessage(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedRestaurantId, page, limit]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleRestaurantChange = (newRestId: string) => {
    setSelectedRestaurantId(newRestId);
    setPage(1);
    const matched = restaurants.find((r) => r.restaurant_id === newRestId);
    setCurrentRestaurant(matched || null);
    router.replace(`/branches?restaurant_id=${encodeURIComponent(newRestId)}`);
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;
    setIsDeleting(true);
    try {
      await branchService.deleteBranch(branchToDelete.branch_id);
      toast.success(
        `Branch "${branchToDelete.branch_name}" was successfully deleted.`,
        "Branch Deleted"
      );
      setBranchToDelete(null);
      await fetchBranches();
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      // Handles 409 Conflict if users are assigned to branch
      toast.error(msg, "Cannot Delete Branch");
    } finally {
      setIsDeleting(false);
    }
  };

  const currentRestObj = restaurants.find(
    (r) => r.restaurant_id === selectedRestaurantId
  );

  const filteredBranches = branches.filter((b) =>
    b.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Branch Outlets
            </h1>
            {roles[0] && <RoleBadge role={roles[0]} />}
          </div>
          <p className="text-sm text-slate-500">
            Manage operational physical branch locations for{" "}
            <span className="font-semibold text-slate-800">
              {currentRestObj?.restaurant_name || "selected restaurant"}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBranches}
            isLoading={loading}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {canCreateBranch && selectedRestaurantId && (
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Branch</span>
            </Button>
          )}
        </div>
      </div>

      {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

      {/* Restaurant Selector & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
            <span>Select Restaurant:</span>
          </label>
          {loadingRestaurants ? (
            <div className="text-xs text-slate-400">Loading restaurants...</div>
          ) : restaurants.length === 0 ? (
            <div className="text-xs text-amber-700 font-medium">
              No restaurants created yet.{" "}
              <a href="/restaurants" className="underline font-bold">
                Create a restaurant first
              </a>
            </div>
          ) : (
            <select
              value={selectedRestaurantId}
              onChange={(e) => handleRestaurantChange(e.target.value)}
              className="h-10 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {restaurants.map((r) => (
                <option key={r.restaurant_id} value={r.restaurant_id}>
                  {r.restaurant_name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      {/* Branches Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16">
            <Spinner size="lg" label="Loading branches for this restaurant..." />
          </div>
        ) : !selectedRestaurantId ? (
          <div className="text-center py-16 px-4">
            <UtensilsCrossed className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-slate-600">
              Please select or create a restaurant to view its branches.
            </p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <GitBranch className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              No Branches Created
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              {searchQuery
                ? "No branches matched your search filter."
                : `No branch locations have been added yet under "${currentRestObj?.restaurant_name}".`}
            </p>
            {canCreateBranch && !searchQuery && (
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                <span>Create Branch Location</span>
              </Button>
            )}
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="hidden md:table-cell">Contact Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((branch) => (
                  <TableRow key={branch.branch_id}>
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 font-bold text-xs">
                          {branch.branch_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{branch.branch_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono sm:hidden">
                            ID: {branch.branch_id}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-slate-600">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-800">
                            {branch.city}, {branch.state}
                          </div>
                          <div className="text-slate-400 truncate max-w-xs">
                            {branch.address}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {branch.email}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-xs text-slate-500">
                      {formatDate(branch.created_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewBranch(branch)}
                          title="View Details"
                          className="h-8 w-8 text-slate-500 hover:text-slate-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {canUpdateBranch && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setBranchToEdit(branch)}
                            title="Edit Branch"
                            className="h-8 w-8 text-slate-500 hover:text-slate-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}

                        {canDeleteBranch && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setBranchToDelete(branch)}
                            title="Delete Branch"
                            className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
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
              <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="text-xs text-slate-500">
                  Page <span className="font-semibold">{page}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-8 px-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Create Branch Modal */}
      {selectedRestaurantId && (
        <BranchDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          restaurantId={selectedRestaurantId}
          restaurantName={currentRestObj?.restaurant_name}
          onSuccess={fetchBranches}
        />
      )}

      {/* Edit Branch Modal */}
      {selectedRestaurantId && branchToEdit && (
        <BranchDialog
          isOpen={!!branchToEdit}
          onClose={() => setBranchToEdit(null)}
          restaurantId={selectedRestaurantId}
          restaurantName={currentRestObj?.restaurant_name}
          branchToEdit={branchToEdit}
          onSuccess={fetchBranches}
        />
      )}

      {/* View Branch Details */}
      {viewBranch && (
        <ConfirmDialog
          isOpen={!!viewBranch}
          onClose={() => setViewBranch(null)}
          onConfirm={() => setViewBranch(null)}
          title={viewBranch.branch_name}
          message={`Branch ID: ${viewBranch.branch_id}\nAddress: ${viewBranch.address}, ${viewBranch.city}, ${viewBranch.state}\nEmail: ${viewBranch.email}\nCreated: ${formatDate(viewBranch.created_at)}`}
          confirmText="Done"
          cancelText="Close"
          variant="primary"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!branchToDelete}
        onClose={() => setBranchToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Branch Location?"
        message={`Are you sure you want to delete "${branchToDelete?.branch_name}"? If users are assigned to this branch, the backend will reject this action with HTTP 409 Conflict.`}
        confirmText="Confirm & Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function BranchesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16">
          <Spinner size="lg" label="Loading branches view..." />
        </div>
      }
    >
      <BranchesContent />
    </Suspense>
  );
}

