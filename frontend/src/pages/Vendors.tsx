import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Loader2, Plus, Mail, Phone, Building, Search, X,
  ArrowLeft, Edit, Tag, Hash, ChevronDown
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { cn } from "../utils";

type VendorStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "BLOCKED";

interface Vendor {
  id: string;
  vendorName: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  address: string | null;
  category: string | null;
  gstNumber: string | null;
  status: VendorStatus;
  createdAt: string;
}

type ViewMode = "list" | "detail" | "add" | "edit";

const STATUS_TABS: { label: string; value: VendorStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Pending", value: "PENDING" },
  { label: "Blocked", value: "BLOCKED" },
  { label: "Inactive", value: "INACTIVE" },
];

const STATUS_COLORS: Record<VendorStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600",
  PENDING: "bg-amber-500/10 text-amber-600",
  BLOCKED: "bg-rose-500/10 text-rose-600",
  INACTIVE: "bg-slate-500/10 text-slate-500",
};

const emptyForm = {
  vendorName: "",
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  category: "",
  gstNumber: "",
  status: "ACTIVE" as VendorStatus,
};

export const Vendors: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "ALL">("ALL");

  // Form states
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const canWrite = ["ADMIN", "PROCUREMENT_OFFICER"].includes(user?.role || "");

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await apiFetch(`/api/vendors?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setVendors(data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, statusFilter, searchQuery]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const resetForm = () => setForm(emptyForm);

  const handleOpenAdd = () => {
    resetForm();
    setViewMode("add");
  };

  const handleOpenEdit = (vendor: Vendor) => {
    setForm({
      vendorName: vendor.vendorName,
      companyName: vendor.companyName,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone || "",
      address: vendor.address || "",
      category: vendor.category || "",
      gstNumber: vendor.gstNumber || "",
      status: vendor.status,
    });
    setSelectedVendor(vendor);
    setViewMode("edit");
  };

  const handleViewDetail = async (id: string) => {
    setDetailLoading(true);
    setViewMode("detail");
    try {
      const res = await apiFetch(`/api/vendors/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedVendor(data.data);
      } else {
        toast.error(data.error || "Failed to load vendor");
        setViewMode("list");
      }
    } catch {
      toast.error("Error loading vendor details");
      setViewMode("list");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendorName || !form.companyName || !form.contactPerson || !form.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = viewMode === "edit" && selectedVendor;
      const url = isEdit ? `/api/vendors/${selectedVendor!.id}` : "/api/vendors";
      const method = isEdit ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...form,
          phone: form.phone || undefined,
          address: form.address || undefined,
          category: form.category || undefined,
          gstNumber: form.gstNumber || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? "Vendor updated successfully" : "Vendor registered successfully");
        setViewMode("list");
        resetForm();
        fetchVendors();
      } else {
        toast.error(data.error || "Failed to save vendor");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error saving vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveVendor = async (vendor: Vendor) => {
    const confirmApprove = window.confirm(`Approve sign in for ${vendor.companyName}?`);
    if (!confirmApprove) return;
    
    try {
      const res = await apiFetch(`/api/vendors/${vendor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: vendor.vendorName,
          companyName: vendor.companyName,
          contactPerson: vendor.contactPerson,
          email: vendor.email,
          phone: vendor.phone || undefined,
          address: vendor.address || undefined,
          category: vendor.category || undefined,
          gstNumber: vendor.gstNumber || undefined,
          status: "ACTIVE",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Vendor approved successfully! They can now sign in.");
        fetchVendors();
      } else {
        toast.error(data.error || "Failed to approve vendor");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error approving vendor");
    }
  };

  // ---- FORM VIEW (Add / Edit) ----
  if (viewMode === "add" || viewMode === "edit") {
    const isEdit = viewMode === "edit";
    return (
      <div className="space-y-6">
        <button
          onClick={() => { setViewMode("list"); resetForm(); }}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vendors
        </button>

        <PageHeader
          title={isEdit ? "Edit Vendor" : "Register New Vendor"}
          subtitle={isEdit ? "Update supplier profile information" : "Add a new supplier to your vendor registry"}
        />

        <div className="bg-card border rounded-xl p-6 shadow-sm max-w-3xl">
          <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
            {/* Row 1 */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Contact Person *</label>
              <input
                type="text" required
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="John Doe"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Company Name *</label>
              <input
                type="text" required
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="Tech Supplies Pvt Ltd"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </div>

            {/* Row 2 */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Vendor / Account Name *</label>
              <input
                type="text" required
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="Infra Supplies PVT Ltd"
                value={form.vendorName}
                onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address *</label>
              <input
                type="email" required
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="contact@techsupplies.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Row 3 */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</label>
              <input
                type="text"
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="+1 234 567 890"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Category</label>
              <input
                type="text"
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. Construction, IT, Logistics"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>

            {/* Row 4 */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">GST Number</label>
              <input
                type="text"
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="27AAPFU0939F1ZV"
                value={form.gstNumber}
                onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
              <div className="relative mt-1">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as VendorStatus })}
                  className="w-full bg-background border rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Address - full width */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Address</label>
              <input
                type="text"
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="123 Industrial Parkway, Suite A"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2 border-t mt-2">
              <button
                type="button"
                onClick={() => { setViewMode("list"); resetForm(); }}
                className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-accent transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Register Vendor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---- DETAIL VIEW ----
  if (viewMode === "detail") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setViewMode("list")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vendors
        </button>

        {detailLoading || !selectedVendor ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {selectedVendor.companyName[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedVendor.companyName}</h2>
                      <p className="text-sm text-muted-foreground">{selectedVendor.vendorName}</p>
                    </div>
                  </div>
                  <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold", STATUS_COLORS[selectedVendor.status])}>
                    {selectedVendor.status}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Contact Person</p>
                    <p className="font-medium text-foreground mt-1">{selectedVendor.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Email</p>
                    <p className="font-medium text-foreground mt-1 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedVendor.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Phone</p>
                    <p className="font-medium text-foreground mt-1 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedVendor.phone || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Category</p>
                    <p className="font-medium text-foreground mt-1 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedVendor.category || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">GST Number</p>
                    <p className="font-medium text-foreground mt-1 flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedVendor.gstNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Address</p>
                    <p className="font-medium text-foreground mt-1">{selectedVendor.address || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Registered</p>
                    <p className="font-medium text-foreground mt-1">{new Date(selectedVendor.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            {canWrite && (
              <div className="space-y-4">
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-3">
                  <h3 className="text-base font-bold text-foreground border-b pb-3">Vendor Actions</h3>
                  <button
                    onClick={() => handleOpenEdit(selectedVendor)}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Vendor
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---- LIST VIEW ----
  const statusCounts = vendors.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        subtitle="Manage supplier profiles and registrations"
        action={
          canWrite ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Vendor
            </button>
          ) : undefined
        }
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, GST number, category..."
          className="w-full bg-card border rounded-xl pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all shadow-sm"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => { setSearchInput(""); setSearchQuery(""); }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const count = tab.value === "ALL" ? vendors.length : (statusCounts[tab.value] || 0);
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
              )}
            >
              {tab.label}
              <span className={cn(
                "inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 rounded text-[10px] font-bold",
                isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Vendors Table */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Vendor Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">GST No.</th>
                  <th className="px-6 py-4">Contact No.</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-foreground">
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-muted-foreground">
                      <Building className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      {searchQuery ? `No vendors found matching "${searchQuery}"` : "No vendors registered yet."}
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <Building className="h-4 w-4 text-primary flex-shrink-0" />
                          {vendor.companyName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 pl-6">{vendor.vendorName}</div>
                      </td>
                      <td className="px-6 py-4 capitalize">
                        {vendor.category ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-xs font-medium">
                            <Tag className="h-3 w-3" />
                            {vendor.category}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {vendor.gstNumber || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {vendor.phone ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {vendor.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                          STATUS_COLORS[vendor.status]
                        )}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {canWrite && (vendor.status === "INACTIVE" || vendor.status === "PENDING") && (
                            <button
                              onClick={() => handleApproveVendor(vendor)}
                              className="text-emerald-600 hover:text-emerald-700 font-semibold text-xs transition-colors flex items-center gap-1"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleViewDetail(vendor.id)}
                            className="text-primary hover:text-primary/80 font-semibold text-xs transition-colors"
                          >
                            View
                          </button>
                          {canWrite && (
                            <button
                              onClick={() => handleOpenEdit(vendor)}
                              className="text-muted-foreground hover:text-foreground font-semibold text-xs transition-colors flex items-center gap-1"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
