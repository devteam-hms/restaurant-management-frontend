"use client";

import React from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  UtensilsCrossed,
  GitBranch,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Store,
  Users,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { RoleBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, roles, currentTenant, logout, isOwner, isManager } = useAuth();

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
      show: true,
    },
    {
      title: "My Tenant",
      href: "/tenant",
      icon: Building2,
      description: "Organization Profile",
      show: true,
    },
    {
      title: "Restaurants",
      href: "/restaurants",
      icon: Store,
      description: "Brands & Outlets",
      show: true,
    },
    {
      title: "Branches",
      href: "/branches",
      icon: GitBranch,
      description: "Locations & Outlets",
      show: true,
    },
    {
      title: "Menu Management",
      href: "/menu",
      icon: UtensilsCrossed,
      description: "Dishes & Pricing",
      show: true,
    },
    {
      title: "Order Management",
      href: "/orders",
      icon: ClipboardList,
      description: "Live Orders & Status",
      show: true,
    },
    {
      title: "Team & Users",
      href: "/users",
      icon: Users,
      description: "Members & Invitations",
      show: true,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-950/40">
            <Store className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
              RMS Pro
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                SaaS
              </span>
            </span>
            <span className="text-xs text-slate-400 font-medium truncate max-w-[140px]">
              {currentTenant?.tenant_name || "Enterprise Admin"}
            </span>
          </div>
        </div>

        {/* Current Tenant Banner */}
        <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-medium">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Active Tenant
            </span>
            {roles[0] && <RoleBadge role={roles[0]} />}
          </div>
          <p className="text-sm font-semibold text-white truncate">
            {currentTenant?.tenant_name || "No tenant selected"}
          </p>
          {currentTenant?.tenant_id && (
            <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
              ID: {currentTenant.tenant_id}
            </p>
          )}
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Main Navigation
          </div>

          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-950/30"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        "w-5 h-5 shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-emerald-400"
                      )}
                    />
                    <div className="truncate">
                      <div className="leading-snug">{item.title}</div>
                      <div
                        className={cn(
                          "text-[11px] font-normal leading-none transition-colors",
                          isActive
                            ? "text-emerald-100"
                            : "text-slate-400 group-hover:text-slate-300"
                        )}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 shrink-0 transition-transform",
                      isActive
                        ? "text-emerald-200 translate-x-0.5"
                        : "text-slate-500 opacity-0 group-hover:opacity-100"
                    )}
                  />
                </a>
              );
            })}
        </div>

        {/* User status & Logout footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase border border-emerald-500/30">
              {user?.email?.charAt(0) || user?.username?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.email || user?.username || "Authenticated"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-[10px] text-slate-400 truncate uppercase font-medium">
                  {roles[0] || "USER"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-600/20 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

