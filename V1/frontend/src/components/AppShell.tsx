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
  LogOut,
  Menu,
  X
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"] },
  { href: "/vendors", label: "Vendors", icon: Building2, roles: ["ADMIN", "PROCUREMENT_OFFICER"] },
  { href: "/rfqs", label: "RFQs", icon: FileText, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"] },
  { href: "/quotations", label: "Quotations", icon: ClipboardList, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"] },
  { href: "/approvals", label: "Approvals", icon: CheckSquare, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"] },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"] },
  { href: "/invoices", label: "Invoices", icon: Receipt, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
  { href: "/activity", label: "Activity Logs", icon: Activity, roles: ["ADMIN"] },
];

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const allowedNavItems = navItems.filter((item) => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r bg-card transition-transform duration-300 md:static md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">VendorBridge</p>
              <p className="text-xs text-muted-foreground font-semibold">ERP System</p>
            </div>
          </div>
          <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allowedNavItems.map((item) => {
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

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b bg-card px-6 h-16">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Welcome back,{" "}
              <span className="font-semibold text-foreground">{user.firstName}</span>
            </p>
          </div>

          <div className="relative">
            <button 
              className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground h-9 w-9 items-center justify-center font-semibold text-sm hover:opacity-90 transition-opacity"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              {getInitials(user.firstName, user.lastName)}
            </button>

            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-md border bg-card text-card-foreground shadow-md z-20">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium">{`${user.firstName} ${user.lastName}`}</p>
                    <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
                    <p className="text-xs text-primary font-semibold capitalize mt-1">
                      {user.role.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-destructive hover:bg-accent focus:bg-accent transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};
