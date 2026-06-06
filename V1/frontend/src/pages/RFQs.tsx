import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatCurrency } from "../utils";
import { toast } from "sonner";
import { 
  Loader2, Plus, ArrowLeft, Send, Check, X, Calendar, 
  List, Building, ExternalLink, Award, AlertCircle, Edit 
} from "lucide-react";

interface RFQItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string | null;
}

interface VendorAssignment {
  vendorId: string;
  vendor: {
    id: string;
    companyName: string;
    vendorName: string;
  };
}

interface QuotationItem {
  id: string;
  rfqItemId: string;
  unitPrice: number;
  quantity: number;
  taxPercentage: number;
  totalAmount: number;
}

interface Quotation {
  id: string;
  vendorId: string;
  deliveryTimeline: string | null;
  notes: string | null;
  totalAmount: number;
  status: "DRAFT" | "SUBMITTED" | "SELECTED" | "REJECTED";
  submittedAt: string | null;
  vendor: {
    companyName: string;
    vendorName: string;
  };
  items: QuotationItem[];
}

interface RFQ {
  id: string;
  rfqNumber: string;
  title: string;
  description: string | null;
  category: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  deadline: string | null;
  createdAt: string;
  items: RFQItem[];
  vendors?: VendorAssignment[];
  quotations?: Quotation[];
}

interface VendorList {
  id: string;
  companyName: string;
}

export const RFQs: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "create" | "detail" | "edit">("list");
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create RFQ form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [items, setItems] = useState<{ itemName: string; quantity: number; unit: string }[]>([
    { itemName: "", quantity: 1, unit: "pcs" }
  ]);
  const [vendorsList, setVendorsList] = useState<VendorList[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchRfqs = async () => {
    try {
      const res = await apiFetch("/api/rfqs");
      const data = await res.json();
      if (data.success) {
        setRfqs(data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await apiFetch("/api/vendors");
      const data = await res.json();
      if (data.success) {
        setVendorsList(data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRfqs();
    if (["ADMIN", "PROCUREMENT_OFFICER"].includes(user?.role || "")) {
      fetchVendors();
    }
  }, []);

  const handleViewDetail = async (rfqId: string) => {
    setDetailLoading(true);
    setSelectedRfqId(rfqId);
    setViewMode("detail");
    try {
      const res = await apiFetch(`/api/rfqs/${rfqId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedRfq(data.data);
      } else {
        toast.error(data.error || "Failed to load RFQ details");
        setViewMode("list");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading RFQ details");
      setViewMode("list");
    } finally {
      setDetailLoading(false);
    }
  };

  // RFQ Creation item helpers
  const handleAddItemRow = () => {
    setItems([...items, { itemName: "", quantity: 1, unit: "pcs" }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  const handleVendorCheckboxChange = (vendorId: string) => {
    if (selectedVendors.includes(vendorId)) {
      setSelectedVendors(selectedVendors.filter((id) => id !== vendorId));
    } else {
      setSelectedVendors([...selectedVendors, vendorId]);
    }
  };

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || selectedVendors.length === 0 || items.some((it) => !it.itemName)) {
      toast.error("Please complete all required fields and add at least one item and vendor");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/rfqs", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || undefined,
          category: category || undefined,
          deadline: deadline || undefined,
          vendorIds: selectedVendors,
          items,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("RFQ created successfully as DRAFT");
        setViewMode("list");
        setTitle("");
        setDescription("");
        setCategory("");
        setDeadline("");
        setSelectedVendors([]);
        setItems([{ itemName: "", quantity: 1, unit: "pcs" }]);
        fetchRfqs();
      } else {
        toast.error(data.error || "Failed to create RFQ");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error creating RFQ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClickFromList = async (rfqId: string) => {
    setDetailLoading(true);
    setSelectedRfqId(rfqId);
    try {
      const res = await apiFetch(`/api/rfqs/${rfqId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedRfq(data.data);
        // Prefill form states
        setTitle(data.data.title);
        setDescription(data.data.description || "");
        setCategory(data.data.category || "");
        setDeadline(data.data.deadline ? data.data.deadline.split("T")[0] : "");
        setSelectedVendors(data.data.vendors?.map((v: any) => v.vendorId) || []);
        setItems(data.data.items.map((it: any) => ({
          itemName: it.itemName,
          quantity: it.quantity,
          unit: it.unit || "pcs"
        })));
        setViewMode("edit");
      } else {
        toast.error(data.error || "Failed to load RFQ details");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading RFQ details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;
    if (!title || selectedVendors.length === 0 || items.some((it) => !it.itemName)) {
      toast.error("Please complete all required fields and add at least one item and vendor");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/rfqs/${selectedRfq.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          category: category || undefined,
          deadline: deadline || undefined,
          vendorIds: selectedVendors,
          items,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("RFQ updated successfully");
        setViewMode("detail");
        handleViewDetail(selectedRfq.id); // Reload details
      } else {
        toast.error(data.error || "Failed to update RFQ");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating RFQ");
    } finally {
      setSubmitting(false);
    }
  };

  // Publish/Close RFQ Actions
  const handlePublish = async (rfqId: string) => {
    try {
      const res = await apiFetch(`/api/rfqs/${rfqId}/publish`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("RFQ published to vendors successfully");
        handleViewDetail(rfqId);
      } else {
        toast.error(data.error || "Failed to publish RFQ");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error publishing RFQ");
    }
  };

  const handleClose = async (rfqId: string) => {
    try {
      const res = await apiFetch(`/api/rfqs/${rfqId}/close`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("RFQ marked as CLOSED");
        handleViewDetail(rfqId);
      } else {
        toast.error(data.error || "Failed to close RFQ");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error closing RFQ");
    }
  };

  // Quotation Selection/Rejection Actions
  const handleSelectQuotation = async (quotationId: string) => {
    try {
      const res = await apiFetch(`/api/quotations/${quotationId}/select`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Quotation selected! Submitted for approval flow");
        if (selectedRfqId) handleViewDetail(selectedRfqId);
      } else {
        toast.error(data.error || "Failed to select quotation");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error selecting quotation");
    }
  };

  const handleRejectQuotation = async (quotationId: string) => {
    try {
      const res = await apiFetch(`/api/quotations/${quotationId}/reject`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Quotation rejected");
        if (selectedRfqId) handleViewDetail(selectedRfqId);
      } else {
        toast.error(data.error || "Failed to reject quotation");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error rejecting quotation");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isProcurement = ["ADMIN", "PROCUREMENT_OFFICER"].includes(user?.role || "");

  return (
    <div className="space-y-6">
      {/* ----------------- LIST VIEW ----------------- */}
      {viewMode === "list" && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Requests for Quotation (RFQs)</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isProcurement 
                  ? "Manage procurement requests and select winning quotations" 
                  : "View and respond to requested procurement campaigns"
                }
              </p>
            </div>
            {isProcurement && (
              <button
                onClick={() => setViewMode("create")}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Create RFQ
              </button>
            )}
          </div>

          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">RFQ Number</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Deadline</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-foreground">
                  {rfqs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No RFQs found.
                      </td>
                    </tr>
                  ) : (
                    rfqs.map((rfq) => (
                      <tr key={rfq.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-primary">
                          {rfq.rfqNumber}
                        </td>
                        <td className="px-6 py-4 font-medium">{rfq.title}</td>
                        <td className="px-6 py-4 capitalize">{rfq.category || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            rfq.status === "DRAFT" 
                              ? "bg-slate-500/10 text-slate-600" 
                              : rfq.status === "PUBLISHED"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-emerald-500/10 text-emerald-600"
                          }`}>
                            {rfq.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatDate(rfq.deadline)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleViewDetail(rfq.id)}
                              className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                              View Details
                              <ExternalLink className="h-3 w-3" />
                            </button>
                            {rfq.status === "DRAFT" && isProcurement && (
                              <button
                                onClick={() => handleEditClickFromList(rfq.id)}
                                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                              >
                                Edit
                                <Edit className="h-3.5 w-3.5" />
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
          </div>
        </>
      )}

      {/* ----------------- CREATE VIEW ----------------- */}
      {viewMode === "create" && (
        <div className="space-y-6">
          <button 
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to RFQs list
          </button>

          <div className="bg-card border rounded-xl p-6 shadow-sm max-w-4xl mx-auto">
            <h1 className="text-xl font-bold border-b pb-3 mb-6">Create New Request for Quotation</h1>
            
            <form onSubmit={handleCreateRfq} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">RFQ Title *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Procurement of Laptops for Engineering Team"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Category</label>
                  <input
                    type="text"
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                    placeholder="IT Hardware"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Deadline Date</label>
                  <input
                    type="date"
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Description / Scope of Work</label>
                  <textarea
                    rows={3}
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Provide details about specifications, expected shipping times, etc..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t pt-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Line Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Item description (e.g. MacBook Pro M3 16GB)"
                          className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Qty"
                          className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="text"
                          placeholder="Unit (e.g. pcs)"
                          className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={items.length === 1}
                        className="text-destructive hover:bg-rose-500/10 p-2 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendors Assignment */}
              <div className="border-t pt-5">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">Assign Vendors *</h3>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-h-48 overflow-y-auto border p-4 rounded-lg bg-muted/20">
                  {vendorsList.map((vendor) => (
                    <label key={vendor.id} className="flex items-center gap-2 text-sm cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor.id)}
                        onChange={() => handleVendorCheckboxChange(vendor.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="font-medium text-foreground">{vendor.companyName}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
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
                  Create Draft RFQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- DETAIL VIEW ----------------- */}
      {viewMode === "detail" && (
        <div className="space-y-6">
          <button 
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to RFQs list
          </button>

          {detailLoading || !selectedRfq ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column: RFQ metadata & items */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                        {selectedRfq.rfqNumber}
                      </span>
                      <h2 className="text-xl font-bold mt-2 text-foreground">{selectedRfq.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Category: <span className="font-semibold text-foreground">{selectedRfq.category || "General"}</span>
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedRfq.status === "DRAFT" 
                        ? "bg-slate-500/10 text-slate-600" 
                        : selectedRfq.status === "PUBLISHED"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}>
                      {selectedRfq.status}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border">
                    {selectedRfq.description || "No description provided."}
                  </p>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Deadline: <span className="font-semibold text-foreground">{formatDate(selectedRfq.deadline)}</span>
                    </div>
                  </div>
                </div>

                {/* RFQ Items Table */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                    <List className="h-4 w-4 text-muted-foreground" />
                    Requested Items
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="px-4 py-2">Item Description</th>
                          <th className="px-4 py-2 text-right">Quantity</th>
                          <th className="px-4 py-2">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {selectedRfq.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 font-semibold">{item.itemName}</td>
                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 capitalize">{item.unit || "pcs"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* COMPARE QUOTATIONS PANEL (ADMIN & PROCUREMENT ONLY) */}
                {isProcurement && selectedRfq.status !== "DRAFT" && (
                  <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b pb-3">
                      <Award className="h-5 w-5 text-primary" />
                      Quotations Matrix & Evaluation
                    </h3>

                    {!selectedRfq.quotations || selectedRfq.quotations.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center gap-1">
                        <AlertCircle className="h-6 w-6 text-slate-400" />
                        No quotations submitted yet by vendors.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedRfq.quotations.map((quote) => (
                          <div 
                            key={quote.id} 
                            className={`border rounded-lg p-4 transition-all ${
                              quote.status === "SELECTED" 
                                ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500" 
                                : quote.status === "REJECTED"
                                ? "border-slate-200 opacity-60"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                                  <Building className="h-4 w-4 text-primary" />
                                  {quote.vendor.companyName}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Contact: {quote.vendor.vendorName}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-base font-bold text-primary">
                                  {formatCurrency(quote.totalAmount)}
                                </span>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Timeline: {quote.deliveryTimeline || "N/A"}
                                </p>
                              </div>
                            </div>

                            {quote.notes && (
                              <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded border mt-3 italic">
                                Vendor remarks: &ldquo;{quote.notes}&rdquo;
                              </p>
                            )}

                            {/* Quote Action Buttons */}
                            {selectedRfq.status === "PUBLISHED" && (
                              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                                <button
                                  onClick={() => handleRejectQuotation(quote.id)}
                                  className="flex items-center gap-1 border border-destructive/20 text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                >
                                  <X className="h-3 w-3" /> Reject
                                </button>
                                <button
                                  onClick={() => handleSelectQuotation(quote.id)}
                                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                                >
                                  <Check className="h-3 w-3" /> Award Bid
                                </button>
                              </div>
                            )}

                            {quote.status === "SELECTED" && (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-4 pt-2 border-t">
                                <Check className="h-4 w-4 bg-emerald-500 text-white rounded-full p-0.5" />
                                Selected & Submitted for Manager Approval
                              </div>
                            )}

                            {quote.status === "REJECTED" && (
                              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold mt-4 pt-2 border-t">
                                <X className="h-4 w-4 bg-rose-500 text-white rounded-full p-0.5" />
                                Rejected Bid
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Actions panel */}
              <div className="space-y-6">
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-foreground border-b pb-3">Campaign Control</h3>

                  {selectedRfq.status === "DRAFT" && isProcurement && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleEditClickFromList(selectedRfq.id)}
                        className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-lg font-medium text-sm transition-all border border-slate-200"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Draft RFQ
                      </button>
                      <button
                        onClick={() => handlePublish(selectedRfq.id)}
                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm"
                      >
                        <Send className="h-4 w-4" />
                        Publish RFQ to Vendors
                      </button>
                    </div>
                  )}

                  {selectedRfq.status === "PUBLISHED" && isProcurement && (
                    <button
                      onClick={() => handleClose(selectedRfq.id)}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium text-sm transition-all"
                    >
                      <X className="h-4 w-4" />
                      Close RFQ Bidding
                    </button>
                  )}

                  {selectedRfq.status === "CLOSED" && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-4 rounded-lg text-sm font-semibold text-center flex flex-col items-center gap-1">
                      <Check className="h-5 w-5 bg-emerald-600 text-white rounded-full p-0.5" />
                      RFQ CLOSED
                      <p className="text-xs text-muted-foreground font-normal mt-1">Bidding and selection for this campaign is complete.</p>
                    </div>
                  )}

                  {!isProcurement && (
                    <div className="bg-muted/40 p-4 rounded-lg border text-sm text-center">
                      <p className="text-muted-foreground">You are assigned as a vendor to this RFQ campaign. Navigate to the **Quotations** section in the sidebar to submit your bid.</p>
                    </div>
                  )}
                </div>

                {/* Assigned Vendors list (Admin/Procurement only) */}
                {isProcurement && selectedRfq.vendors && (
                  <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-foreground mb-4">Assigned Vendors</h3>
                    <ul className="space-y-3">
                      {selectedRfq.vendors.map((v) => (
                        <li key={v.vendorId} className="flex flex-col border-b pb-2 last:border-b-0 last:pb-0">
                          <span className="font-semibold text-sm">{v.vendor.companyName}</span>
                          <span className="text-xs text-muted-foreground">Contact: {v.vendor.vendorName}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- EDIT VIEW ----------------- */}
      {viewMode === "edit" && (
        <div className="space-y-6">
          <button 
            onClick={() => selectedRfq ? setViewMode("detail") : setViewMode("list")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to details
          </button>

          <div className="bg-card border rounded-xl p-6 shadow-sm max-w-4xl mx-auto">
            <h1 className="text-xl font-bold border-b pb-3 mb-6">Edit Draft Request for Quotation</h1>
            
            <form onSubmit={handleUpdateRfq} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">RFQ Title *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Procurement of Laptops for Engineering Team"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Category</label>
                  <input
                    type="text"
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                    placeholder="IT Hardware"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Deadline Date</label>
                  <input
                    type="date"
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Description / Scope of Work</label>
                  <textarea
                    rows={3}
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Provide details about specifications, expected shipping times, etc..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t pt-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Line Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Item description (e.g. MacBook Pro M3 16GB)"
                          className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="Qty"
                          className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="text"
                          placeholder="Unit (e.g. pcs)"
                          className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={items.length === 1}
                        className="text-destructive hover:bg-rose-500/10 p-2 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendors Assignment */}
              <div className="border-t pt-5">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">Assign Vendors *</h3>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-h-48 overflow-y-auto border p-4 rounded-lg bg-muted/20">
                  {vendorsList.map((vendor) => (
                    <label key={vendor.id} className="flex items-center gap-2 text-sm cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor.id)}
                        onChange={() => handleVendorCheckboxChange(vendor.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="font-medium text-foreground">{vendor.companyName}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => selectedRfq ? setViewMode("detail") : setViewMode("list")}
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
