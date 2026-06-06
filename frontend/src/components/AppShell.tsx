import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  CheckSquare,
  ShoppingCart,
  Receipt,
  BarChart3,
  Activity,
  Building2,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Role-aware nav config
// Matches the spec exactly:
//   PROCUREMENT_OFFICER → RFQs, Quotations, Purchase Orders, Invoices
//   VENDOR              → RFQs (read), Quotations, Purchase Orders
//   MANAGER             → Approvals, Purchase Orders, Reports
//   ADMIN               → everything + Users, Vendors, Activity Logs
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"],
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  // Admin manages users and approves vendor registrations (PENDING → ACTIVE)
  {
    href: "/users",
    label: "Users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    href: "/vendors",
    label: "Vendors",
    icon: Building2,
    roles: ["ADMIN"],
  },

  // ── Officer: RFQ creation → quotation comparison → triggers approval ─────
  {
    href: "/rfqs",
    label: "RFQs",
    icon: FileText,
    roles: ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"],
  },
  {
    href: "/quotations",
    label: "Quotations",
    icon: ClipboardList,
    roles: ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"],
  },

  // ── Manager: sees Approvals + monitors POs + analytics ───────────────────
  {
    href: "/approvals",
    label: "Approvals",
    icon: CheckSquare,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/purchase-orders",
    label: "Purchase Orders",
    icon: ShoppingCart,
    roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"],
  },

  // ── Invoices: Officer generates, Admin/Manager view, Vendor sees own ──────
  {
    href: "/invoices",
    label: "Invoices",
    icon: Receipt,
    roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"],
  },

  // ── Analytics ────────────────────────────────────────────────────────────
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/activity",
    label: "Activity Logs",
    icon: Activity,
    roles: ["ADMIN"],
  },
];

// Human-friendly role label
const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  PROCUREMENT_OFFICER: "Procurement Officer",
  MANAGER: "Manager / Approver",
  VENDOR: "Vendor",
};

// Role accent colour for the sidebar badge
const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-violet-500/15 text-violet-600 border-violet-200",
  PROCUREMENT_OFFICER: "bg-blue-500/15 text-blue-600 border-blue-200",
  MANAGER: "bg-amber-500/15 text-amber-700 border-amber-200",
  VENDOR: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
};


interface AppShellProps { children: React.ReactNode; }

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  const allowedNav = NAV_ITEMS.filter(item => item.roles.includes(user.role));
  const roleLabel = ROLE_LABEL[user.role] ?? user.role;
  const roleColor = ROLE_COLOR[user.role] ?? "bg-muted text-muted-foreground";

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r bg-card transition-transform duration-300 md:static md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-foreground tracking-tight">VendorBridge</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">ERP System</p>
            </div>
          </div>
          <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 pt-3 pb-2">
          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border tracking-wide", roleColor)}>
            {roleLabel}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {allowedNav.map(item => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />}
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b bg-card px-6 h-16 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Welcome back, <span className="font-semibold text-foreground">{user.firstName}</span>
            </p>
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              className="flex items-center justify-center rounded-full bg-primary text-primary-foreground h-9 w-9 font-semibold text-sm hover:opacity-90 transition-opacity"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              {initials}
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-60 rounded-xl border bg-card shadow-xl z-20 overflow-hidden">
                  <div className="px-4 py-3.5 border-b bg-muted/30">
                    <p className="text-sm font-bold text-foreground">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                    <span className={cn("inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold border", roleColor)}>
                      {roleLabel}
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-accent transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};
