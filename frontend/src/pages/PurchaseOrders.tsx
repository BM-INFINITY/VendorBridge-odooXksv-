import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatCurrency } from "../utils";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShoppingCart, Calendar, Building, List, Receipt, ChevronDown } from "lucide-react";
import { PageHeader } from "../components/PageHeader";

interface POItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  taxPercentage: number;
  totalAmount: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: "ISSUED" | "ACKNOWLEDGED" | "COMPLETED";
  issueDate: string;
  createdAt: string;
  vendor: {
    companyName: string;
    vendorName: string;
    email: string;
  };
  rfq: {
    rfqNumber: string;
    title: string;
  };
  items: POItem[];
}

export const PurchaseOrders: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation/Detail state
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPOs = async () => {
    try {
      const res = await apiFetch("/api/purchase-orders");
      const data = await res.json();
      if (data.success) {
        setPurchaseOrders(data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load Purchase Orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const handleViewDetails = async (poId: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/purchase-orders/${poId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedPo(data.data);
        setViewMode("detail");
      } else {
        toast.error(data.error || "Failed to load Purchase Order details");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading Purchase Order details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedPo) return;
    
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/purchase-orders/${selectedPo.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`PO status updated to ${newStatus}`);
        // Refresh details
        handleViewDetails(selectedPo.id);
        fetchPOs();
      } else {
        toast.error(data.error || "Failed to update PO status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedPo) return;

    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/purchase-orders/${selectedPo.id}/invoice`, {
        method: "POST"
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Invoice generated successfully!");
        // Refresh details
        handleViewDetails(selectedPo.id);
      } else {
        toast.error(data.error || "Failed to generate invoice");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error generating invoice");
    } finally {
      setActionLoading(false);
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
          <PageHeader
            title="Purchase Orders (POs)"
            subtitle="Manage and track issued purchase orders"
          />

          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">PO Number</th>
                    <th className="px-6 py-4">RFQ Number / Title</th>
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Issue Date</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-foreground">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No purchase orders found.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => (
                      <tr key={po.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-primary">
                          {po.poNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{po.rfq.rfqNumber}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{po.rfq.title}</div>
                        </td>
                        <td className="px-6 py-4 font-medium">{po.vendor.companyName}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            po.status === "ISSUED" 
                              ? "bg-blue-500/10 text-blue-600" 
                              : po.status === "ACKNOWLEDGED"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-emerald-500/10 text-emerald-600"
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatDate(po.issueDate)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(po.id)}
                            className="text-primary hover:text-primary/80 font-semibold text-xs flex items-center gap-1 transition-colors"
                          >
                            View Details
                            <ArrowLeft className="h-3 w-3 rotate-180" />
                          </button>
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

      {/* ----------------- DETAIL VIEW ----------------- */}
      {viewMode === "detail" && selectedPo && (
        <div className="space-y-6">
          <button 
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to POs list
          </button>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column: PO metadata and items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{selectedPo.poNumber}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Related Campaign: <strong className="text-foreground">{selectedPo.rfq.rfqNumber}</strong> — {selectedPo.rfq.title}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedPo.status === "ISSUED" 
                      ? "bg-blue-500/10 text-blue-600" 
                      : selectedPo.status === "ACKNOWLEDGED"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-emerald-500/10 text-emerald-600"
                  }`}>
                    {selectedPo.status}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase">Supplier Company</span>
                    <p className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {selectedPo.vendor.companyName}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase">PO Issue Date</span>
                    <p className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(selectedPo.issueDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* PO Items */}
              <div className="bg-card border rounded-xl p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <List className="h-4 w-4 text-muted-foreground" />
                  Order Line Items
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                        <th className="px-4 py-2">Item Description</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Tax</th>
                        <th className="px-4 py-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedPo.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-semibold">{item.itemName}</td>
                          <td className="px-4 py-3 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-right">{item.taxPercentage}%</td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">
                            {formatCurrency(item.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase">Estimated Order Total</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedPo.items.reduce((s, i) => s + i.totalAmount, 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="space-y-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-foreground border-b pb-3">Order Controls</h3>

                {isProcurement ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Update Order Status</label>
                      <div className="relative mt-1">
                        <select
                          disabled={actionLoading}
                          value={selectedPo.status}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="w-full bg-background border rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                        >
                          <option value="ISSUED">ISSUED</option>
                          <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateInvoice}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm disabled:opacity-50"
                    >
                      <Receipt className="h-4 w-4" />
                      Generate Invoice
                    </button>
                  </div>
                ) : (
                  <div className="bg-muted/40 p-4 rounded-lg border text-sm text-center">
                    <p className="text-muted-foreground">
                      This purchase order has been issued to you by the procurement team. Please execute shipments and invoices accordingly.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
