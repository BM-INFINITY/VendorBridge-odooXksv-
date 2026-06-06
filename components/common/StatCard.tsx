import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  className?: string;
  trend?: {
    value: number;
    label: string;
  };
}

// KPI stat card for the Dashboard. Displays a metric with optional icon and trend.
export function StatCard({ title, value, icon, description, className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm p-6", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && (
          <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
