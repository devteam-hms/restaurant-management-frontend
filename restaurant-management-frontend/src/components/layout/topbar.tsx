"use client";

import React, { useState } from "react";
import { Menu, Building2, Utensils, ChevronDown, LogOut, UserCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RoleBadge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, roles, currentTenant, currentRestaurant, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg lg:hidden hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        {/* Context indicators */}
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs">
          {currentTenant && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate max-w-[120px]">{currentTenant.tenant_name}</span>
            </div>
          )}
          {currentRestaurant && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
              <Utensils className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[120px]">
                {currentRestaurant.restaurant_name}
              </span>
            </div>
          )}
        </div>

        {/* Theme mode toggle */}
        <ThemeToggle />

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase shadow-xs">
              {user?.email?.charAt(0) || "U"}
            </div>
            <div className="hidden sm:flex flex-col text-xs leading-none">
              <span className="font-semibold text-slate-900 truncate max-w-[130px]">
                {user?.email?.split("@")[0] || user?.username || "User"}
              </span>
              <span className="text-[10px] text-slate-500 capitalize mt-0.5">
                {roles[0]?.toLowerCase() || "User"}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {user?.email || user?.username}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {roles[0] && <RoleBadge role={roles[0]} />}
                  </div>
                </div>

                <div className="py-1">
                  <a
                    href="/tenant"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>Tenant Profile</span>
                  </a>
                  <a
                    href="/restaurants"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Utensils className="w-4 h-4 text-slate-400" />
                    <span>Manage Restaurants</span>
                  </a>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

