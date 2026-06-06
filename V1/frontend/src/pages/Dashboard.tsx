import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils";
import { 
  FileText, 
  CheckSquare, 
  Users, 
  TrendingUp, 
  Activity, 
  ArrowUpRight, 
  Loader2,
  ShoppingCart,
  Receipt
} from "lucide-react";
import { toast } from "sonner";

interface DashboardData {
  activeRFQs: number;
  pendingApprovals: number;
  vendorCount: number;
  totalSpend: number;
}

interface ActivityLog {
  id: string;
  action: string;
  module: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const Dashboard: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  
  // Vendor specific counts
  const [vendorStats, setVendorStats] = useState({
    rfqs: 0,
    quotations: 0,
    orders: 0,
    invoices: 0
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        if (user?.role === "VENDOR") {
          // Fetch vendor stats
          const [rfqsRes, quotesRes, poRes, invRes] = await Promise.all([
            apiFetch("/api/rfqs"),
            apiFetch("/api/quotations"),
            apiFetch("/api/purchase-orders"),
            apiFetch("/api/invoices")
          ]);

          const [rfqs, quotes, pos, invs] = await Promise.all([
            rfqsRes.json(),
            quotesRes.json(),
            poRes.json(),
            invRes.json()
          ]);

          setVendorStats({
            rfqs: rfqs.data?.length || 0,
            quotations: quotes.data?.length || 0,
            orders: pos.data?.length || 0,
            invoices: invs.data?.length || 0
          });
        } else {
          // Fetch admin/procurement/manager stats
          const statsRes = await apiFetch("/api/reports/dashboard");
          const stats = await statsRes.json();
          if (stats.success) {
            setData(stats.data);
          }

          // Fetch activities for Admin
          if (user?.role === "ADMIN") {
            const actRes = await apiFetch("/api/activity-logs?pageSize=5");
            const act = await actRes.json();
            if (act.success) {
              setActivities(act.data.logs || []);
            }
          }
        }
      } catch (error: any) {
        console.error(error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, apiFetch]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-slate-900 text-white p-6 shadow-md border border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold">
          Welcome back, {user?.firstName} {user?.lastName}!
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Role: <span className="font-semibold text-primary capitalize">{user?.role.replace(/_/g, " ").toLowerCase()}</span>
        </p>
      </div>

      {/* KPI Cards */}
      {user?.role === "VENDOR" ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned RFQs</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{vendorStats.rfqs}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Quotations</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{vendorStats.quotations}</h3>
            </div>
            <div className="p-3 bg-violet-500/10 text-violet-600 rounded-lg">
              <CheckSquare className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purchase Orders</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{vendorStats.orders}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoices</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{vendorStats.invoices}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg">
              <Receipt className="h-6 w-6" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active RFQs</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{data?.activeRFQs || 0}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Approvals</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{data?.pendingApprovals || 0}</h3>
            </div>
            <div className="p-3 bg-violet-500/10 text-violet-600 rounded-lg">
              <CheckSquare className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Vendors</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{data?.vendorCount || 0}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Spend</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{formatCurrency(data?.totalSpend || 0)}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* Admin Specific Activities List */}
      {user?.role === "ADMIN" && activities.length > 0 && (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b pb-3">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Recent System Activities</h2>
          </div>
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, idx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {idx !== activities.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-accent flex items-center justify-center ring-8 ring-card">
                          <ArrowUpRight className="h-4 w-4 text-primary" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-foreground">
                            <span className="font-semibold">{activity.user.firstName} {activity.user.lastName}</span>{" "}
                            triggered <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-primary">{activity.action}</code>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                            Module: {activity.module.toLowerCase()}
                          </p>
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
