import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils";
import { toast } from "sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { Loader2, Download, BarChart3, TrendingUp, Users, FileText, CheckSquare } from "lucide-react";
import { PageHeader } from "../components/PageHeader";

interface ReportKPIs {
  totalSpend: number;
  activeVendors: number;
  rfqsProcessed: number;
  pendingApprovals: number;
}

interface SpendByCategory {
  category: string;
  total: number;
}

interface TopVendor {
  vendorName: string;
  companyName: string;
  totalSpend: number;
  poCount: number;
}

interface SpendTrend {
  month: number;
  total: number;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const Reports: React.FC = () => {
  const { apiFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<ReportKPIs | null>(null);
  const [categorySpend, setCategorySpend] = useState<SpendByCategory[]>([]);
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [trend, setTrend] = useState<SpendTrend[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchReportData = async () => {
    try {
      const [kpisRes, catRes, vendorRes, trendRes] = await Promise.all([
        apiFetch("/api/reports/kpis"),
        apiFetch("/api/reports/spend-by-category"),
        apiFetch("/api/reports/top-vendors"),
        apiFetch("/api/reports/spend-trend")
      ]);

      const [kpisData, catData, vendorData, trendData] = await Promise.all([
        kpisRes.json(),
        catRes.json(),
        vendorRes.json(),
        trendRes.json()
      ]);

      if (kpisData.success) setKpis(kpisData.data);
      if (catData.success) setCategorySpend(catData.data);
      if (vendorData.success) setTopVendors(vendorData.data);
      
      if (trendData.success) {
        // Map month index (1-12) to short names
        const formattedTrend = trendData.data.map((item: any) => ({
          ...item,
          name: MONTHS[(item.month - 1) % 12] || `M${item.month}`
        }));
        setTrend(formattedTrend);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load analytics reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const res = await apiFetch("/api/reports/export?format=csv");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vendorbridge-spend-report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV report exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export spend CSV");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Insightful procurement performance and spend analysis"
        action={
          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm"
          >
            {exportLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export Spend CSV
          </button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accumulated Spend</p>
          <h3 className="text-2xl font-bold mt-1 text-primary">{formatCurrency(kpis?.totalSpend || 0)}</h3>
          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            Active budget invoices
          </p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Suppliers</p>
          <h3 className="text-2xl font-bold mt-1 text-foreground">{kpis?.activeVendors || 0}</h3>
          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <Users className="h-3 w-3" /> Registered and active
          </p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaigns Completed</p>
          <h3 className="text-2xl font-bold mt-1 text-foreground">{kpis?.rfqsProcessed || 0}</h3>
          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <FileText className="h-3 w-3" /> Closed RFQs
          </p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unresolved Approvals</p>
          <h3 className="text-2xl font-bold mt-1 text-foreground">{kpis?.pendingApprovals || 0}</h3>
          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <CheckSquare className="h-3 w-3 text-amber-500" /> Pending review
          </p>
        </div>
      </div>

      {/* Charts Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spend Trend (AreaChart) */}
        <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
          <h3 className="font-bold text-sm text-foreground mb-4 uppercase tracking-wider">Procurement Spend Trend</h3>
          <div className="flex-1 w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Spend"]} />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Category (PieChart) */}
        <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
          <h3 className="font-bold text-sm text-foreground mb-4 uppercase tracking-wider">Spend Allocation by Category</h3>
          <div className="flex-1 w-full h-[250px] flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpend}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="total"
                  >
                    {categorySpend.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Spend"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {categorySpend.map((entry, index) => (
                <div key={entry.category} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="font-medium text-foreground capitalize truncate max-w-28">{entry.category}:</span>
                  <span className="text-muted-foreground">${entry.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Vendors (Horizontal Bar Chart) */}
        <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[350px] lg:col-span-2">
          <h3 className="font-bold text-sm text-foreground mb-4 uppercase tracking-wider">Top 5 Vendors by Spend</h3>
          <div className="flex-1 w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVendors.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="companyName" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Total Spend"]} />
                <Bar dataKey="totalSpend" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
