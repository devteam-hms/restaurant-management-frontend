import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Spinner({ className, size = "md", label }: SpinnerProps) {
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4">
      <Loader2
        className={cn("animate-spin text-emerald-600", sizeClass, className)}
      />
      {label && <p className="text-xs text-slate-500 font-medium">{label}</p>}
    </div>
  );
}

