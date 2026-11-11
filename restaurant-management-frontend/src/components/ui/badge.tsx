import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors tracking-wide",
  {
    variants: {
      variant: {
        default:
          "border border-slate-200 bg-slate-100 text-slate-800",
        emerald:
          "border border-emerald-200 bg-emerald-50 text-emerald-700",
        blue:
          "border border-blue-200 bg-blue-50 text-blue-700",
        amber:
          "border border-amber-200 bg-amber-50 text-amber-700",
        purple:
          "border border-purple-200 bg-purple-50 text-purple-700",
        rose:
          "border border-rose-200 bg-rose-50 text-rose-700",
        navy:
          "border border-slate-700 bg-slate-900 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export function RoleBadge({ role }: { role: string }) {
  const normalized = role.toUpperCase();
  let variant: VariantProps<typeof badgeVariants>["variant"] = "default";

  if (normalized === "SUPER_ADMIN" || normalized === "SUPERADMIN") {
    variant = "purple";
  } else if (normalized === "OWNER") {
    variant = "emerald";
  } else if (normalized === "MANAGER") {
    variant = "blue";
  } else if (normalized === "STAFF") {
    variant = "amber";
  }

  return (
    <Badge variant={variant} className="font-semibold uppercase text-[10px] tracking-wider">
      {role}
    </Badge>
  );
}

