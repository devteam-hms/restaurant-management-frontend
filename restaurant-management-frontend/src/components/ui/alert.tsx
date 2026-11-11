import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "destructive";
  title?: string;
}

export function Alert({
  variant = "info",
  title,
  children,
  className,
  ...props
}: AlertProps) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    destructive: "bg-rose-50 border-rose-200 text-rose-900",
  }[variant];

  const icons = {
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    destructive: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
  }[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 p-4 rounded-xl border text-sm transition-all",
        styles,
        className
      )}
      {...props}
    >
      <div className="mt-0.5">{icons}</div>
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-1 text-slate-900">{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

