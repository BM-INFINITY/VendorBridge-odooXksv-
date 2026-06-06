import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils";
import {
  FileText,
  CheckSquare,
  Users,
  TrendingUp,
  Loader2,
  ShoppingCart,
  Receipt,
  Plus,
  Building,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BarChart3,
  Package,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { cn } from "../utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface DashboardData {
  activeRFQs: number;
  pendingApprovals: number;
  vendorCount: number;
  totalSpend: number;
}

interface RecentPO {
  id: string;
  poNumber: string;
  vendor: { companyName: string };
  items: { totalAmount: number }[];
  status: string;
  issueDate: string;
}

interface RecentApproval {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  rfq: { rfqNumber: string; title: string };
  quotation: { totalAmount: number; vendor: { companyName: string } };
}

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  grandTotal: number;
  issuedAt: string;
  vendor: { companyName: string };
}

interface SpendTrend {
  month: number;
  total: number;
  name?: string;
}

interface VendorStats {
  rfqs: number;
  quotations: number;
  orders: number;
  invoices: number;
  recentInvoices: RecentInvoice[];
  recentRFQs: { id: string; rfqNumber: string; title: string; status: string; deadline: string | null }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PO_STATUS_COLORS: Record<string, string> = {
  ISSUED: "bg-blue-500/10 text-blue-600 border-blue-200",
  ACKNOWLEDGED: "bg-amber-500/10 text-amber-600 border-amber-200",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  GENERATED: "bg-slate-100 text-slate-600 border-slate-200",
  SENT: "bg-blue-50 text-blue-600 border-blue-200",
  PAID: "bg-emerald-50 text-emerald-600 border-emerald-200",
  OVERDUE: "bg-rose-50 text-rose-600 border-rose-200",
};

const APPROVAL_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-600 border-rose-200",
};

const APPROVAL_STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-3 w-3" />,
  APPROVED: <CheckCircle2 className="h-3 w-3" />,
  REJECTED: <XCircle className="h-3 w-3" />,
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable KPI Card
// ─────────────────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  Icon: React.ElementType;
  href?: string;
}> = ({ label, value, subtext, color, Icon, href }) => {
  const inner = (
    <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all group cursor-default">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-bold mt-1 text-foreground">{value}</h3>
        {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
      </div>
      <div className={`p-3 ${color} rounded-xl transition-all group-hover:scale-110`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const [loading, setLoading] = useState(true);

  // Admin / Officer / Manager state
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentPOs, setRecentPOs] = useState<RecentPO[]>([]);
  const [recentApprovals, setRecentApprovals] = useState<RecentApproval[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [trend, setTrend] = useState<SpendTrend[]>([]);

  // Vendor state
  const [vendorStats, setVendorStats] = useState<VendorStats>({
    rfqs: 0, quotations: 0, orders: 0, invoices: 0, recentInvoices: [], recentRFQs: [],
  });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.role === "VENDOR") {
        const [rfqsRes, quotesRes, poRes, invRes] = await Promise.all([
          apiFetch("/api/rfqs"),
          apiFetch("/api/quotations"),
          apiFetch("/api/purchase-orders"),
          apiFetch("/api/invoices"),
        ]);
        const [rfqs, quotes, pos, invs] = await Promise.all([
          rfqsRes.json(), quotesRes.json(), poRes.json(), invRes.json(),
        ]);
        setVendorStats({
          rfqs: rfqs.data?.length || 0,
          quotations: quotes.data?.length || 0,
          orders: pos.data?.length || 0,
          invoices: invs.data?.length || 0,
          recentInvoices: (invs.data || []).slice(0, 5).map((i: any) => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            status: i.status,
            grandTotal: Number(i.grandTotal),
            issuedAt: i.issuedAt,
            vendor: i.vendor,
          })),
          recentRFQs: (rfqs.data || []).slice(0, 5),
        });
      } else {
        const canSeeReports = user?.role === "ADMIN" || user?.role === "MANAGER";
        const isManager = user?.role === "MANAGER";

        const [statsRes, poRes, trendRes, approvalsRes, invoicesRes] = await Promise.all([
          apiFetch("/api/reports/dashboard").catch(() => null),
          apiFetch("/api/purchase-orders").catch(() => null),
          canSeeReports
            ? apiFetch("/api/reports/spend-trend").catch(() => null)
            : Promise.resolve(null),
          (isManager || user?.role === "ADMIN")
            ? apiFetch("/api/approvals").catch(() => null)
            : Promise.resolve(null),
          apiFetch("/api/invoices").catch(() => null),
        ]);

        const [stats, poData, trendData, approvalsData, invoicesData] = await Promise.all([
          statsRes ? statsRes.json().catch(() => null) : null,
          poRes ? poRes.json().catch(() => null) : null,
          trendRes ? trendRes.json().catch(() => null) : null,
          approvalsRes ? approvalsRes.json().catch(() => null) : null,
          invoicesRes ? invoicesRes.json().catch(() => null) : null,
        ]);

        if (stats?.success) setData(stats.data);

        if (poData?.success) {
          setRecentPOs(poData.data.slice(0, 5));
        }

        if (trendData?.success) {
          setTrend(
            trendData.data.map((item: SpendTrend) => ({
              ...item,
              name: MONTHS[(item.month - 1) % 12] || `M${item.month}`,
            }))
          );
        }

        if (approvalsData?.success) {
          setRecentApprovals(approvalsData.data.slice(0, 5));
        }

        if (invoicesData?.success) {
          setRecentInvoices(invoicesData.data.slice(0, 5).map((i: any) => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            status: i.status,
            grandTotal: Number(i.grandTotal),
            issuedAt: i.issuedAt,
            vendor: i.vendor,
          })));
        }
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user, apiFetch]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const role = user?.role || "";
  const roleLabel = role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome back, ${user?.firstName} ${user?.lastName} — ${roleLabel}'s Overview`}
        />
        <button onClick={fetchDashboard}
          className="flex items-center gap-1.5 text-xs font-semibold border border-border text-muted-foreground hover:bg-accent px-3 py-2 rounded-xl transition-all">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      {role === "VENDOR" ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Assigned RFQs" value={vendorStats.rfqs} color="bg-blue-500/10 text-blue-600" Icon={FileText} href="/rfqs" />
          <KpiCard label="Your Quotations" value={vendorStats.quotations} color="bg-violet-500/10 text-violet-600" Icon={CheckSquare} href="/quotations" />
          <KpiCard label="Purchase Orders" value={vendorStats.orders} color="bg-emerald-500/10 text-emerald-600" Icon={ShoppingCart} href="/purchase-orders" />
          <KpiCard label="Invoices" value={vendorStats.invoices} color="bg-amber-500/10 text-amber-600" Icon={Receipt} href="/invoices" />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Active RFQs" value={data?.activeRFQs ?? 0} color="bg-blue-500/10 text-blue-600" Icon={FileText} href="/rfqs" />
          <KpiCard
            label="Pending Approvals"
            value={data?.pendingApprovals ?? 0}
            color={(data?.pendingApprovals ?? 0) > 0 ? "bg-amber-500/10 text-amber-600" : "bg-violet-500/10 text-violet-600"}
            Icon={CheckSquare}
            href="/approvals"
            subtext={(data?.pendingApprovals ?? 0) > 0 ? "Needs action" : "All clear"}
          />
          <KpiCard label="Active Vendors" value={data?.vendorCount ?? 0} color="bg-emerald-500/10 text-emerald-600" Icon={Users} href="/vendors" />
          <KpiCard label="Total Spend" value={formatCurrency(data?.totalSpend ?? 0)} color="bg-rose-500/10 text-rose-600" Icon={TrendingUp} href="/reports" />
        </div>
      )}

      {/* ── Vendor: Recent RFQs + Invoices ─────────────────────────────────── */}
      {role === "VENDOR" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent RFQs */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-sm font-bold flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> Assigned RFQs</h2>
              <Link to="/rfqs" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {vendorStats.recentRFQs.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                <Package className="h-6 w-6 mx-auto mb-2 opacity-30" />No RFQs assigned yet
              </div>
            ) : (
              <div className="divide-y">
                {vendorStats.recentRFQs.map((rfq) => (
                  <div key={rfq.id} className="flex items-center justify-between px-6 py-3 hover:bg-accent/30 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-primary">{rfq.rfqNumber}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-48">{rfq.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {rfq.deadline && (
                        <span className="text-xs text-muted-foreground">{new Date(rfq.deadline).toLocaleDateString()}</span>
                      )}
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        rfq.status === "PUBLISHED" ? "bg-blue-50 text-blue-600 border-blue-200" :
                        rfq.status === "CLOSED" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        {rfq.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Invoices (vendor) */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-sm font-bold flex items-center gap-2"><Receipt className="h-4 w-4 text-muted-foreground" /> Your Invoices</h2>
              <Link to="/invoices" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {vendorStats.recentInvoices.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                <Mail className="h-6 w-6 mx-auto mb-2 opacity-30" />No invoices yet
              </div>
            ) : (
              <div className="divide-y">
                {vendorStats.recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-6 py-3 hover:bg-accent/30 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-primary">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{new Date(inv.issuedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{formatCurrency(inv.grandTotal)}</span>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        INVOICE_STATUS_COLORS[inv.status] || "bg-muted text-muted-foreground")}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Manager: Pending Approvals Panel ──────────────────────────────── */}
      {(role === "MANAGER" || role === "ADMIN") && recentApprovals.length > 0 && (
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              {role === "MANAGER" ? "Pending Approvals" : "Recent Approvals"}
            </h2>
            <Link to="/approvals" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">RFQ</th>
                  <th className="px-6 py-3">Vendor</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Submitted</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentApprovals.map((a) => (
                  <tr key={a.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-3">
                      <p className="font-bold text-primary">{a.rfq.rfqNumber}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-32">{a.rfq.title}</p>
                    </td>
                    <td className="px-6 py-3 font-medium">{a.quotation.vendor.companyName}</td>
                    <td className="px-6 py-3 text-right font-bold">{formatCurrency(a.quotation.totalAmount)}</td>
                    <td className="px-6 py-3">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        APPROVAL_STATUS_STYLES[a.status])}>
                        {APPROVAL_STATUS_ICONS[a.status]}{a.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3">
                      <Link to="/approvals" className="text-xs font-semibold text-primary hover:text-primary/80">
                        {a.status === "PENDING" ? "Review →" : "View →"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Non-Vendor: Recent POs + Spend Chart ───────────────────────────── */}
      {role !== "VENDOR" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Purchase Orders */}
          <div className="lg:col-span-2 bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" /> Recent Purchase Orders
              </h2>
              <Link to="/purchase-orders" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recentPOs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Clock className="h-6 w-6 opacity-40" />
                <p className="text-sm">No purchase orders yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-3">PO#</th>
                      <th className="px-6 py-3">Vendor</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentPOs.map((po) => {
                      const total = po.items?.reduce((s, i) => s + Number(i.totalAmount), 0) || 0;
                      return (
                        <tr key={po.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-3 font-bold text-primary">{po.poNumber}</td>
                          <td className="px-6 py-3 font-medium flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            {po.vendor.companyName}
                          </td>
                          <td className="px-6 py-3 text-right font-semibold">{formatCurrency(total)}</td>
                          <td className="px-6 py-3">
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                              PO_STATUS_COLORS[po.status] || "bg-muted text-muted-foreground border-border")}>
                              {po.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-xs text-muted-foreground">
                            {new Date(po.issueDate).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Spend Trend Chart */}
          <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-muted-foreground" /> Spending Trends
            </h2>
            {trend.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                <TrendingUp className="h-6 w-6 opacity-30" />
                <p>No spend data yet</p>
              </div>
            ) : (
              <div className="flex-1 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Spend"]} />
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#dashSpend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Non-Vendor: Recent Invoices ─────────────────────────────────────── */}
      {role !== "VENDOR" && recentInvoices.length > 0 && (
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" /> Recent Invoices
            </h2>
            <Link to="/invoices" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Invoice #</th>
                  <th className="px-6 py-3">Vendor</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-3 font-bold text-primary">{inv.invoiceNumber}</td>
                    <td className="px-6 py-3 font-medium flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />{inv.vendor?.companyName ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold">{formatCurrency(inv.grandTotal)}</td>
                    <td className="px-6 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                        INVOICE_STATUS_COLORS[inv.status] || "bg-muted text-muted-foreground border-border")}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Quick Actions ──────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {["ADMIN", "PROCUREMENT_OFFICER"].includes(role) && (
            <>
              <Link to="/rfqs" className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15 px-4 py-2 rounded-lg font-semibold text-sm transition-all">
                <Plus className="h-4 w-4" /> Create RFQ
              </Link>
              <Link to="/quotations" className="flex items-center gap-2 border hover:bg-accent text-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all">
                <CheckSquare className="h-4 w-4" /> Compare Quotations
              </Link>
              <Link to="/purchase-orders" className="flex items-center gap-2 border hover:bg-accent text-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all">
                <ShoppingCart className="h-4 w-4" /> Purchase Orders
              </Link>
              <Link to="/invoices" className="flex items-center gap-2 border hover:bg-accent text-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all">
                <Receipt className="h-4 w-4" /> Invoices
              </Link>
            </>
          )}
          {role === "ADMIN" && (
            <>
              <Link to="/vendors" className="flex items-center gap-2 bg-violet-500/10 border border-violet-400/30 text-violet-700 hover:bg-violet-500/15 px-4 py-2 rounded-lg font-semibold text-sm transition-all">
                <Building className="h-4 w-4" /> Approve Vendors
              </Link>
              <Link to="/activity" className="flex items-center gap-2 border hover:bg-accent text-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all">
                <ArrowRight className="h-4 w-4" /> Activity Logs
              </Link>
            </>
          )}
          {role === "VENDOR" && (
            <>
              <Link to="/quotations" className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15 px-4 py-2 rounded-lg font-semibold text-sm transition-all">
                <FileText className="h-4 w-4" /> Submit Quotation
              </Link>
              <Link to="/rfqs" className="flex items-center gap-2 border hover:bg-accent text-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all">
                <FileText className="h-4 w-4" /> Track RFQ Status
              </Link>
              <Link to="/purchase-orders" className="flex items-center gap-2 border hover:bg-accent text-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all">
                <ShoppingCart className="h-4 w-4" /> View Purchase Orders
              </Link>
              <Link to="/invoices" className="flex items-center gap-2 border hover:bg-accent text-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all">
                <Receipt className="h-4 w-4" /> View Invoices
              </Link>
            </>
          )}
          {role === "MANAGER" && (
            <>
              <Link to="/approvals" className="flex items-center gap-2 bg-amber-500/10 border border-amber-400/30 text-amber-700 hover:bg-amber-500/15 px-4 py-2 rounded-lg font-semibold text-sm transition-all">
                <CheckSquare className="h-4 w-4" /> Approve Quotations
              </Link>
              <Link to="/purchase-orders" className="flex items-center gap-2 border hover:bg-accent text-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all">
                <ShoppingCart className="h-4 w-4" /> Monitor POs
              </Link>
              <Link to="/reports" className="flex items-center gap-2 border hover:bg-accent text-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all">
                <TrendingUp className="h-4 w-4" /> View Analytics
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
