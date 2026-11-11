"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Building2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { restaurantService } from "@/services/restaurant.service";
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
import { RestaurantDialog } from "@/components/dialogs/restaurant-dialog";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { useToast } from "@/context/toast-context";
import { extractErrorMessage } from "@/services/api";

export default function RestaurantsPage() {
  const router = useRouter();
  const toast = useToast();
  const {
    currentTenant,
    roles,
    canCreateRestaurant,
    canUpdateRestaurant,
    canDeleteRestaurant,
    setCurrentRestaurant,
  } = useAuth();

  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search filter (client-side search filter over current page)
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [restaurantToEdit, setRestaurantToEdit] = useState<RestaurantItem | null>(null);
  const [restaurantToDelete, setRestaurantToDelete] = useState<RestaurantItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewDetailsModal, setViewDetailsModal] = useState<RestaurantItem | null>(null);

  const fetchRestaurants = useCallback(async () => {
    if (!currentTenant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await restaurantService.getRestaurants({
        page,
        limit,
        tenant_id: currentTenant.tenant_id,
      });
      setRestaurants(res.data);
      setTotalRecords(res.pagination.total_records);
      setTotalPages(res.pagination.total_pages);
    } catch (err) {
      const msg = extractErrorMessage(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [currentTenant, page, limit]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleDelete = async () => {
    if (!restaurantToDelete) return;
    setIsDeleting(true);
    try {
      await restaurantService.deleteRestaurant(restaurantToDelete.restaurant_id);
      toast.success(
        `Restaurant "${restaurantToDelete.restaurant_name}" was successfully removed.`,
        "Restaurant Deleted"
      );
      setRestaurantToDelete(null);
      await fetchRestaurants();
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      // Handles 409 Conflict if dependent branches exist
      toast.error(msg, "Cannot Delete Restaurant");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleManageBranches = (restaurant: RestaurantItem) => {
    setCurrentRestaurant(restaurant);
    router.push(`/branches?restaurant_id=${encodeURIComponent(restaurant.restaurant_id)}`);
  };

  const filteredRestaurants = restaurants.filter((r) =>
    r.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Restaurant Brands
            </h1>
            {roles[0] && <RoleBadge role={roles[0]} />}
          </div>
          <p className="text-sm text-slate-500">
            Manage restaurant concepts under{" "}
            <span className="font-semibold text-slate-800">
              {currentTenant?.tenant_name || "your organization"}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRestaurants}
            isLoading={loading}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {canCreateRestaurant && currentTenant && (
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Restaurant</span>
            </Button>
          )}
        </div>
      </div>

      {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredRestaurants.length} of {totalRecords} total
        </div>
      </div>

      {/* Restaurants Table Card */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16">
            <Spinner size="lg" label="Loading restaurants from database..." />
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              No Restaurants Registered
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              {searchQuery
                ? "No restaurants matched your search criteria."
                : "Get started by registering your first restaurant brand under this tenant."}
            </p>
            {canCreateRestaurant && currentTenant && !searchQuery && (
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                <span>Create First Restaurant</span>
              </Button>
            )}
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Created Date</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.map((restaurant) => (
                  <TableRow key={restaurant.restaurant_id}>
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                          {restaurant.restaurant_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{restaurant.restaurant_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono sm:hidden">
                            ID: {restaurant.restaurant_id}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell max-w-xs truncate text-slate-500 text-xs">
                      {restaurant.description || "—"}
                    </TableCell>

                    <TableCell className="hidden sm:table-cell text-xs text-slate-500">
                      {formatDate(restaurant.created_at)}
                    </TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleManageBranches(restaurant)}
                        className="gap-1.5 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 h-8"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Manage Branches</span>
                      </Button>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewDetailsModal(restaurant)}
                          title="View Details"
                          className="h-8 w-8 text-slate-500 hover:text-slate-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {canUpdateRestaurant && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRestaurantToEdit(restaurant)}
                            title="Edit Restaurant"
                            className="h-8 w-8 text-slate-500 hover:text-slate-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}

                        {canDeleteRestaurant && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRestaurantToDelete(restaurant)}
                            title="Delete Restaurant"
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

      {/* Create Modal Dialog */}
      {currentTenant && (
        <RestaurantDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          tenantId={currentTenant.tenant_id}
          onSuccess={fetchRestaurants}
        />
      )}

      {/* Edit Modal Dialog */}
      {currentTenant && restaurantToEdit && (
        <RestaurantDialog
          isOpen={!!restaurantToEdit}
          onClose={() => setRestaurantToEdit(null)}
          tenantId={currentTenant.tenant_id}
          restaurantToEdit={restaurantToEdit}
          onSuccess={fetchRestaurants}
        />
      )}

      {/* View Details Modal */}
      {viewDetailsModal && (
        <ConfirmDialog
          isOpen={!!viewDetailsModal}
          onClose={() => setViewDetailsModal(null)}
          onConfirm={() => {
            handleManageBranches(viewDetailsModal);
            setViewDetailsModal(null);
          }}
          title={viewDetailsModal.restaurant_name}
          message={`ID: ${viewDetailsModal.restaurant_id}\nTenant ID: ${viewDetailsModal.tenant_id}\nCreated: ${formatDate(viewDetailsModal.created_at)}\nDescription: ${viewDetailsModal.description || "None"}`}
          confirmText="Manage Branches"
          cancelText="Close"
          variant="primary"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!restaurantToDelete}
        onClose={() => setRestaurantToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Restaurant?"
        message={`Are you sure you want to delete "${restaurantToDelete?.restaurant_name}"? If any dependent branches are associated with it, the backend will reject this action with HTTP 409 Conflict.`}
        confirmText="Confirm & Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}

