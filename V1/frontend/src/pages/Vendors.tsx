import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Loader2, Plus, Mail, Phone, Building } from "lucide-react";

interface Vendor {
  id: string;
  vendorName: string;
  companyName: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export const Vendors: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [vendorName, setVendorName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchVendors = async () => {
    try {
      const res = await apiFetch("/api/vendors");
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
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !companyName || !email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/vendors", {
        method: "POST",
        body: JSON.stringify({
          vendorName,
          companyName,
          email,
          phone: phone || undefined,
          address: address || undefined,
          status: "ACTIVE",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Vendor added successfully");
        setShowAddForm(false);
        setVendorName("");
        setCompanyName("");
        setEmail("");
        setPhone("");
        setAddress("");
        fetchVendors();
      } else {
        toast.error(data.error || "Failed to add vendor");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error creating vendor");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Double role check protection (for safety, though routes are guarded too)
  const canWrite = ["ADMIN", "PROCUREMENT_OFFICER"].includes(user?.role || "");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage external supplier registry</p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Vendor
          </button>
        )}
      </div>

      {/* Add Vendor Form Drawer/Modal */}
      {showAddForm && (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Register New Supplier</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Contact Person *</label>
              <input
                type="text"
                required
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="John Doe"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Company Name *</label>
              <input
                type="text"
                required
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="Tech Supplies Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address *</label>
              <input
                type="email"
                required
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="contact@techsupplies.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</label>
              <input
                type="text"
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="+1 234 567 890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Address</label>
              <input
                type="text"
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                placeholder="123 Industrial Parkway, Suite A"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-accent transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Vendor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vendors Table */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-foreground">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No vendors registered yet.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary" />
                        {vendor.companyName}
                      </div>
                    </td>
                    <td className="px-6 py-4">{vendor.vendorName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {vendor.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {vendor.phone ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {vendor.phone}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        vendor.status === "ACTIVE" 
                          ? "bg-emerald-500/10 text-emerald-600" 
                          : "bg-rose-500/10 text-rose-600"
                      }`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
