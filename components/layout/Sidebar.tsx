"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  CheckSquare,
  ShoppingCart,
  Receipt,
  BarChart3,
  Activity,
  Building2,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendors", label: "Vendors", icon: Building2 },
  { href: "/rfqs", label: "RFQs", icon: FileText },
  { href: "/quotations", label: "Quotations", icon: ClipboardList },
  { href: "/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/activity", label: "Activity", icon: Activity },
];

// Sidebar navigation with active route highlighting.
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">VendorBridge</p>
          <p className="text-xs text-muted-foreground">ERP System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
