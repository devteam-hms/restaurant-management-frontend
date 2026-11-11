"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbNameMap: Record<string, string> = {
    dashboard: "Dashboard",
    tenant: "My Tenant",
    restaurants: "Restaurants",
    branches: "Branches",
    settings: "Settings",
  };

  return (
    <nav className="flex items-center text-xs text-slate-500 font-medium space-x-1.5 overflow-hidden">
      <a
        href="/dashboard"
        className="flex items-center gap-1 hover:text-slate-800 transition-colors"
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">Home</span>
      </a>

      {segments.map((segment, index) => {
        const url = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const displayName =
          breadcrumbNameMap[segment] ||
          segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <React.Fragment key={url}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            {isLast ? (
              <span className="text-slate-900 font-semibold truncate max-w-[150px] sm:max-w-xs">
                {displayName}
              </span>
            ) : (
              <a
                href={url}
                className="hover:text-slate-800 transition-colors truncate max-w-[120px]"
              >
                {displayName}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

