"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
  Mail,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { userService } from "@/services/user.service";
import { UserItem } from "@/types/user";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, RoleBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { InviteUserDialog } from "@/components/dialogs/invite-user-dialog";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { useToast } from "@/context/toast-context";
import { extractErrorMessage } from "@/services/api";

export default function UsersPage() {
  const toast = useToast();
  const { currentTenant, roles, isOwner, canInviteUsers } = useAuth();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!currentTenant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await userService.getUsers({
        page,
        limit,
        tenant_id: currentTenant.tenant_id,
        role: roleFilter || undefined,
      });
      setUsers(res.data);
      setTotalRecords(res.pagination.total_records);
      setTotalPages(res.pagination.total_pages);
    } catch (err) {
      const msg = extractErrorMessage(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [currentTenant, page, limit, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await userService.deleteUser(userToDelete.user_id);
      toast.success(
        `User ${userToDelete.name} has been removed.`,
        "User Deleted"
      );
      setUserToDelete(null);
      await fetchUsers();
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      toast.error(msg, "Cannot Delete User");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Team & Users
            </h1>
            {roles[0] && <RoleBadge role={roles[0]} />}
          </div>
          <p className="text-sm text-slate-500">
            Manage organization members, role permissions, and branch assignments for{" "}
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
            onClick={fetchUsers}
            isLoading={loading}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {/* Role-based Invite Button: visible only to authorized callers (OWNER / MANAGER) */}
          {canInviteUsers && currentTenant && (
            <Button
              size="sm"
              onClick={() => setIsInviteOpen(true)}
              className="gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite User</span>
            </Button>
          )}
        </div>
      </div>

      {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredUsers.length} of {totalRecords} members
        </div>
      </div>

      {/* Users Table Card */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16">
            <Spinner size="lg" label="Loading team members..." />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              No Team Members Found
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              {searchQuery || roleFilter
                ? "No users matched your search criteria."
                : "You haven't invited any managers or operational staff members yet."}
            </p>
            {canInviteUsers && currentTenant && !searchQuery && (
              <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
                <UserPlus className="w-4 h-4" />
                <span>Invite First Team Member</span>
              </Button>
            )}
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Joined Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                          {member.name ? member.name.charAt(0) : "U"}
                        </div>
                        <span className="truncate max-w-[180px]">{member.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-slate-600 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[200px]">{member.email}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <RoleBadge role={member.role} />
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={member.status === "ACTIVE" ? "emerald" : "default"}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(member.created_at)}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {isOwner && member.role !== "OWNER" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setUserToDelete(member)}
                          title="Remove User"
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
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
        )}
      </Card>

      {/* Invite User Dialog */}
      {currentTenant && (
        <InviteUserDialog
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          tenantId={currentTenant.tenant_id}
          onSuccess={fetchUsers}
        />
      )}

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Remove Team Member"
        message={`Are you sure you want to remove "${userToDelete?.name}" (${userToDelete?.email}) from this tenant? This user will lose access immediately.`}
        confirmText="Remove User"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}

