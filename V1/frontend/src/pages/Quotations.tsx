import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatCurrency } from "../utils";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Send, Calendar } from "lucide-react";

interface RFQItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string | null;
}

interface RFQ {
  id: string;
  rfqNumber: string;
  title: string;
  category: string | null;
  deadline: string | null;
  items: RFQItem[];
  createdAt?: string;
  status?: string;
}

interface QuotationItem {
  id: string;
  rfqItemId: string;
  unitPrice: number;
  quantity: number;
  taxPercentage: number;
  totalAmount: number;
  rfqItem?: {
    itemName: string;
    unit: string | null;
  };
}

interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  deliveryTimeline: string | null;
  notes: string | null;
  totalAmount: number;
  status: "DRAFT" | "SUBMITTED" | "SELECTED" | "REJECTED";
  submittedAt: string | null;
  rfq: RFQ;
  vendor: {
    companyName: string;
    vendorName: string;
  };
  items: QuotationItem[];
}

export const Quotations: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [publishedRfqs, setPublishedRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation/View Mode
  const [viewMode, setViewMode] = useState<"list" | "create" | "detail">("list");
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  
  // Form States (for creating a quotation)
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [deliveryTimeline, setDeliveryTimeline] = useState("");
  const [notes, setNotes] = useState("");
  const [quoteItems, setQuoteItems] = useState<{ rfqItemId: string; unitPrice: number; taxPercentage: number; quantity: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const qRes = await apiFetch("/api/quotations");
      const qData = await qRes.json();
      if (qData.success) {
        setQuotations(qData.data);
      }

      if (user?.role === "VENDOR") {
        // Vendors need to see published RFQs so they can create quotations
        const rfqRes = await apiFetch("/api/rfqs?status=PUBLISHED");
        const rfqData = await rfqRes.json();
        if (rfqData.success) {
          setPublishedRfqs(rfqData.data);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load quotations data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectRfqForQuote = (rfqId: string) => {
    const rfq = publishedRfqs.find((r) => r.id === rfqId);
    if (!rfq) return;

    setSelectedRfq(rfq);
    setDeliveryTimeline("");
    setNotes("");
    
    // Initialize items with requested quantities
    setQuoteItems(
      rfq.items.map((item) => ({
        rfqItemId: item.id,
        unitPrice: 0,
        taxPercentage: 0,
        quantity: item.quantity
      }))
    );
    setViewMode("create");
  };

  const handleItemPriceChange = (rfqItemId: string, field: "unitPrice" | "taxPercentage", val: number) => {
    setQuoteItems(
      quoteItems.map((item) => {
        if (item.rfqItemId === rfqItemId) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const handleSaveQuotation = async (status: "DRAFT" | "SUBMITTED") => {
    if (!selectedRfq) return;

    if (quoteItems.some((item) => item.unitPrice <= 0)) {
      toast.error("Please enter a unit price greater than 0 for all items");
      return;
    }

    setSubmitting(true);
    const url = status === "DRAFT" ? "/api/quotations/draft" : "/api/quotations/submit";

    try {
      const res = await apiFetch(url, {
        method: "POST",
        body: JSON.stringify({
          rfqId: selectedRfq.id,
          deliveryTimeline: deliveryTimeline || undefined,
          notes: notes || undefined,
          items: quoteItems
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(status === "DRAFT" ? "Quotation saved as draft" : "Quotation submitted successfully!");
        setViewMode("list");
        setSelectedRfq(null);
        fetchData();
      } else {
        toast.error(data.error || "Failed to save quotation");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error saving quotation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (quoteId: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/quotations/${quoteId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedQuote(data.data);
        setViewMode("detail");
      } else {
        toast.error(data.error || "Failed to load quotation details");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading quotation details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isVendor = user?.role === "VENDOR";

  // Calculate live total for quote creation
  const liveTotal = quoteItems.reduce((sum, item) => {
    const subtotal = item.unitPrice * item.quantity;
    const tax = (subtotal * item.taxPercentage) / 100;
    return sum + subtotal + tax;
  }, 0);

  return (
    <div className="space-y-6">
      {/* ----------------- LIST VIEW ----------------- */}
      {viewMode === "list" && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isVendor ? "Draft and submit bids for active RFQ campaigns" : "Review bids received from suppliers"}
              </p>
            </div>
          </div>

          {/* Vendors: Show published RFQs assigned to them to bid on */}
          {isVendor && publishedRfqs.length > 0 && (
            <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground">Active RFQ Invitations</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {publishedRfqs
                  // Filter out RFQs that already have a quotation
                  .filter((rfq) => !quotations.some((q) => q.rfqId === rfq.id))
                  .map((rfq) => (
                    <div key={rfq.id} className="border rounded-lg p-4 flex flex-col justify-between hover:border-primary transition-all">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {rfq.rfqNumber}
                          </span>
                          <span className="text-xs text-muted-foreground">{rfq.category || "General"}</span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground mt-2">{rfq.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Deadline: {formatDate(rfq.deadline)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSelectRfqForQuote(rfq.id)}
                        className="w-full bg-primary text-primary-foreground text-xs py-2 rounded font-semibold mt-4 hover:opacity-90 transition-opacity"
                      >
                        Prepare Bid
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Quotations List */}
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">RFQ Number</th>
                    {!isVendor && <th className="px-6 py-4">Vendor</th>}
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-foreground">
                  {quotations.length === 0 ? (
                    <tr>
                      <td colSpan={isVendor ? 6 : 7} className="px-6 py-12 text-center text-muted-foreground">
                        No quotations created yet.
                      </td>
                    </tr>
                  ) : (
                    quotations.map((quote) => (
                      <tr key={quote.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-primary">
                          {quote.rfq.rfqNumber}
                        </td>
                        {!isVendor && (
                          <td className="px-6 py-4">
                            <div className="font-semibold">{quote.vendor.companyName}</div>
                            <div className="text-xs text-muted-foreground">{quote.vendor.vendorName}</div>
                          </td>
                        )}
                        <td className="px-6 py-4 font-bold text-foreground">
                          {formatCurrency(quote.totalAmount)}
                        </td>
                        <td className="px-6 py-4">{quote.deliveryTimeline || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            quote.status === "DRAFT" 
                              ? "bg-slate-500/10 text-slate-600" 
                              : quote.status === "SUBMITTED"
                              ? "bg-blue-500/10 text-blue-600"
                              : quote.status === "SELECTED"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatDate(quote.submittedAt || quote.rfq.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(quote.id)}
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

      {/* ----------------- CREATE/PREPARE BID VIEW ----------------- */}
      {viewMode === "create" && selectedRfq && (
        <div className="space-y-6">
          <button 
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to quotations list
          </button>

          <div className="bg-card border rounded-xl p-6 shadow-sm max-w-4xl mx-auto space-y-6">
            <div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {selectedRfq.rfqNumber}
              </span>
              <h2 className="text-xl font-bold text-foreground mt-2">Submit Bid: {selectedRfq.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Deadline: <span className="font-semibold text-foreground">{formatDate(selectedRfq.deadline)}</span>
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Delivery Timeline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10 Days, 2 Weeks"
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                  value={deliveryTimeline}
                  onChange={(e) => setDeliveryTimeline(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Enter any additional conditions, shipping costs inclusions, etc."
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Line Items Pricing */}
            <div className="border-t pt-5">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">Pricing Details</h3>
              <div className="space-y-4">
                {selectedRfq.items.map((item) => {
                  const quoteItem = quoteItems.find((qi) => qi.rfqItemId === item.id);
                  const price = quoteItem?.unitPrice || 0;
                  const tax = quoteItem?.taxPercentage || 0;
                  const itemTotal = (price * item.quantity) + ((price * item.quantity * tax) / 100);

                  return (
                    <div key={item.id} className="grid gap-3 sm:grid-cols-12 items-center border p-4 rounded-lg bg-muted/10">
                      <div className="sm:col-span-5">
                        <p className="font-semibold text-sm">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">Requested: {item.quantity} {item.unit || "pcs"}</p>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Unit Price ($) *</label>
                        <input
                          type="number"
                          required
                          min={0.01}
                          step={0.01}
                          placeholder="0.00"
                          className="w-full bg-background border rounded-lg px-3 py-1.5 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                          value={price || ""}
                          onChange={(e) => handleItemPriceChange(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Tax %</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0"
                          className="w-full bg-background border rounded-lg px-3 py-1.5 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                          value={tax || ""}
                          onChange={(e) => handleItemPriceChange(item.id, "taxPercentage", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <p className="text-xs text-muted-foreground uppercase">Total</p>
                        <p className="font-bold text-sm text-foreground mt-1">{formatCurrency(itemTotal)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total and actions */}
            <div className="border-t pt-5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Estimated Quotation Total</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(liveTotal)}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSaveQuotation("DRAFT")}
                  disabled={submitting}
                  className="flex items-center gap-1.5 border hover:bg-accent px-4 py-2 rounded-lg font-medium text-sm transition-all"
                >
                  <Save className="h-4 w-4" /> Save Draft
                </button>
                <button
                  onClick={() => handleSaveQuotation("SUBMITTED")}
                  disabled={submitting}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-all shadow-sm"
                >
                  <Send className="h-4 w-4" /> Submit Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- DETAIL VIEW ----------------- */}
      {viewMode === "detail" && selectedQuote && (
        <div className="space-y-6">
          <button 
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to quotations list
          </button>

          <div className="bg-card border rounded-xl p-6 shadow-sm max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {selectedQuote.rfq.rfqNumber}
                </span>
                <h2 className="text-xl font-bold mt-2">{selectedQuote.rfq.title}</h2>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <span>Vendor: <strong className="text-foreground">{selectedQuote.vendor.companyName}</strong></span>
                  <span>•</span>
                  <span>Contact: {selectedQuote.vendor.vendorName}</span>
                </p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                selectedQuote.status === "DRAFT" 
                  ? "bg-slate-500/10 text-slate-600" 
                  : selectedQuote.status === "SUBMITTED"
                  ? "bg-blue-500/10 text-blue-600"
                  : selectedQuote.status === "SELECTED"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-rose-500/10 text-rose-600"
              }`}>
                {selectedQuote.status}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Delivery Timeline</p>
                <p className="font-medium">{selectedQuote.deliveryTimeline || "Not specified"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Date Processed</p>
                <p className="font-medium">{formatDate(selectedQuote.submittedAt || selectedQuote.rfq.createdAt)}</p>
              </div>
              {selectedQuote.notes && (
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Notes / Remarks</p>
                  <p className="bg-muted/30 p-3 rounded border italic text-muted-foreground">&ldquo;{selectedQuote.notes}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Quoted Line Items</h3>
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
                    {selectedQuote.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-semibold">{item.rfqItem?.itemName || "RFQ Line Item"}</td>
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
            </div>

            {/* Total summary */}
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase">Grand Total Amount</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(selectedQuote.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
