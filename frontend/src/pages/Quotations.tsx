import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  Send,
  Save,
  FileText,
  ChevronRight,
  Star,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart2,
  ClipboardList,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { cn } from "../utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types (mirrors Prisma schema)
// ─────────────────────────────────────────────────────────────────────────────
interface RFQItem { id: string; itemName: string; quantity: number; unit: string | null; }
interface RFQ { id: string; rfqNumber: string; title: string; category: string | null; deadline: string | null; status: string; items: RFQItem[]; }

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
  rfqId: string;
  vendorId: string;
  deliveryTimeline: string | null;
  notes: string | null;
  totalAmount: number;
  status: "DRAFT" | "SUBMITTED" | "SELECTED" | "REJECTED";
  submittedAt: string | null;
  rfq: RFQ;
  vendor?: { companyName: string; vendorName: string; id?: string; };
  items: QuotationItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  SUBMITTED: "bg-blue-50 text-blue-600 border-blue-200",
  SELECTED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-600 border-rose-200",
};

// ─────────────────────────────────────────────────────────────────────────────
// Screen 6 — Submit Quotation Form
// Connected to: POST /api/quotations/submit  |  POST /api/quotations/draft
// Body: { rfqId, deliveryTimeline, notes, items: [{rfqItemId, unitPrice, quantity, taxPercentage}] }
// ─────────────────────────────────────────────────────────────────────────────
const SubmitQuotationForm: React.FC<{
  rfq: RFQ;
  existing: Quotation | null;
  onBack: () => void;
  onSaved: () => void;
}> = ({ rfq, existing, onBack, onSaved }) => {
  const { apiFetch } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [gstPercent, setGstPercent] = useState(18);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [deliveryTimeline] = useState(existing?.deliveryTimeline ?? "");
  const [lineItems, setLineItems] = useState(() =>
    rfq.items.map(it => {
      const ex = existing?.items.find(ei => ei.rfqItemId === it.id);
      return {
        rfqItemId: it.id,
        itemName: it.itemName,
        quantity: it.quantity,
        unit: it.unit ?? "pcs",
        unitPrice: ex?.unitPrice ?? 0,
        deliveryDays: deliveryTimeline ? parseInt(deliveryTimeline) || 7 : 7,
      };
    })
  );

  const updateItem = (rfqItemId: string, field: string, value: number) =>
    setLineItems(prev => prev.map(it => it.rfqItemId === rfqItemId ? { ...it, [field]: value } : it));

  const subtotal = useMemo(() => lineItems.reduce((s, it) => s + it.unitPrice * it.quantity, 0), [lineItems]);
  const gstAmount = useMemo(() => Math.round((subtotal * gstPercent) / 100), [subtotal, gstPercent]);
  const grandTotal = subtotal + gstAmount;

  const handleSave = async (draft: boolean) => {
    if (!draft && lineItems.some(it => it.unitPrice <= 0)) {
      toast.error("Enter unit prices for all items");
      return;
    }
    setSubmitting(true);
    try {
      const maxDeliveryDays = Math.max(...lineItems.map(it => it.deliveryDays));
      const body = {
        rfqId: rfq.id,
        deliveryTimeline: String(maxDeliveryDays),
        notes: notes || undefined,
        items: lineItems.map(it => ({
          rfqItemId: it.rfqItemId,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          taxPercentage: gstPercent,
        })),
      };
      const endpoint = draft ? "/api/quotations/draft" : "/api/quotations/submit";
      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(draft ? "Draft saved!" : "Quotation submitted successfully!");
        onSaved();
      } else {
        toast.error(data.error || "Failed");
      }
    } catch { toast.error("An error occurred"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Quotations
      </button>

      <PageHeader
        title="Submit Quotations"
        subtitle={`RFQ: ${rfq.title}${rfq.deadline ? ` – deadline ${new Date(rfq.deadline).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}` : ""}`}
      />

      {/* RFQ Summary */}
      <div className="bg-muted/40 border rounded-xl px-5 py-3.5 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-1">RFQ Summary</p>
        <p>{rfq.items.map(it => `${it.itemName} × ${it.quantity}`).join(", ")}{rfq.category ? ` – category ${rfq.category}` : ""}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: table + fields */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Your Quotation</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/20 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">Item</th>
                    <th className="px-5 py-3 text-center">Qty</th>
                    <th className="px-5 py-3 text-right">Unit Price (₹)</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-center">Delivery (days)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.map(item => {
                    const lineTotal = item.unitPrice * item.quantity;
                    return (
                      <tr key={item.rfqItemId}>
                        <td className="px-5 py-3 font-medium text-foreground">{item.itemName}</td>
                        <td className="px-5 py-3 text-center text-muted-foreground">{item.quantity}</td>
                        <td className="px-5 py-3">
                          <input type="number" min={0} step={0.01} value={item.unitPrice || ""}
                            placeholder="0"
                            onChange={e => updateItem(item.rfqItemId, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="w-28 ml-auto block bg-background border rounded-lg px-3 py-1.5 text-right text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                        </td>
                        <td className="px-5 py-3 text-right font-semibold">
                          {lineTotal > 0 ? `₹${formatINR(lineTotal)}` : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <input type="number" min={1} value={item.deliveryDays}
                            onChange={e => updateItem(item.rfqItemId, "deliveryDays", parseInt(e.target.value) || 1)}
                            className="w-16 mx-auto block bg-background border rounded-lg px-2 py-1.5 text-center text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tax / GST %</label>
              <input type="number" min={0} max={100} value={gstPercent}
                onChange={e => setGstPercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-background border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note / Terms</label>
              <textarea rows={3} placeholder="Payment terms: 20 days net..." value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-background border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 outline-none resize-none" />
            </div>
          </div>
        </div>

        {/* Right: price summary */}
        <div>
          <div className="bg-card border rounded-xl p-5 shadow-sm sticky top-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b pb-3 uppercase tracking-wider">Price Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{subtotal > 0 ? `₹${formatINR(subtotal)}` : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST ({gstPercent}%)</span>
                <span className="font-semibold">{gstAmount > 0 ? `₹${formatINR(gstAmount)}` : "—"}</span></div>
              <div className="flex justify-between border-t pt-3 text-base">
                <span className="font-bold">Grand Total</span>
                <span className="font-bold text-primary text-lg">{grandTotal > 0 ? `₹${formatINR(grandTotal)}` : "—"}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 pt-2 border-t">
              <button onClick={() => handleSave(false)} disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm disabled:opacity-60">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Quotation
              </button>
              <button onClick={() => handleSave(true)} disabled={submitting}
                className="w-full flex items-center justify-center gap-2 border border-border hover:bg-accent text-foreground px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60">
                <Save className="h-4 w-4" /> Save Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Screen 7 — Quotation Comparison
// GET /api/quotations?rfqId=X → compare all submitted quotations for one RFQ
// POST /api/quotations/:id/select → select winner
// ─────────────────────────────────────────────────────────────────────────────
const QuotationComparison: React.FC<{
  rfqId: string;
  rfqTitle: string;
  quotations: Quotation[];
  onBack: () => void;
  onSelected: () => void;
}> = ({ rfqTitle, quotations, onBack, onSelected }) => {
  const { apiFetch } = useAuth();
  const [selecting, setSelecting] = useState<string | null>(null);

  const lowestId = useMemo(
    () => [...quotations].sort((a, b) => a.totalAmount - b.totalAmount)[0]?.id ?? null,
    [quotations]
  );

  const handleSelect = async (id: string) => {
    setSelecting(id);
    try {
      const res = await apiFetch(`/api/quotations/${id}/select`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Quotation selected! Approval workflow triggered.");
        onSelected();
      } else toast.error(data.error || "Failed to select");
    } catch { toast.error("An error occurred"); }
    finally { setSelecting(null); }
  };

  const criteria: { label: string; format: (q: Quotation) => React.ReactNode }[] = [
    { label: "Grand Total", format: q => <span className="font-bold">₹{formatINR(q.totalAmount)}</span> },
    { label: "GST %", format: q => <span>{q.items[0]?.taxPercentage ?? "—"}</span> },
    { label: "Delivery (days)", format: q => <span>{q.deliveryTimeline ?? "—"}</span> },
    { label: "Vendor Rating", format: () => <span className="flex items-center justify-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />N/A</span> },
    { label: "Payment Terms", format: q => <span className="text-xs">{q.notes ?? "—"}</span> },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Quotations
      </button>
      <PageHeader title="Quotation Comparison" subtitle={`RFQ: ${rfqTitle}`} />

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-4 bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider w-36">Criteria</th>
                {quotations.map(q => (
                  <th key={q.id} className={cn("px-6 py-4 text-center font-bold text-sm",
                    q.id === lowestId ? "bg-emerald-500 text-white" : "bg-muted/20 text-foreground")}>
                    {q.vendor?.companyName ?? "Vendor"}
                    {q.id === lowestId && <span className="block text-[10px] font-normal mt-0.5">(Lowest)</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {criteria.map(({ label, format }) => (
                <tr key={label} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-xs font-semibold text-muted-foreground bg-muted/10 uppercase tracking-wider">{label}</td>
                  {quotations.map(q => (
                    <td key={q.id} className={cn("px-6 py-4 text-center",
                      q.id === lowestId ? "bg-emerald-500/10 text-emerald-700 font-semibold" : "text-foreground")}>
                      {format(q)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2">
                <td className="px-6 py-5 bg-muted/10" />
                {quotations.map(q => (
                  <td key={q.id} className="px-6 py-5 text-center">
                    {q.status === "SELECTED" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 className="h-4 w-4" /> Selected
                      </span>
                    ) : (
                      <button onClick={() => handleSelect(q.id)} disabled={!!selecting}
                        className={cn("px-5 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-60",
                          q.id === lowestId
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                            : "border border-border hover:bg-accent text-foreground")}>
                        {selecting === q.id ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : q.id === lowestId ? "Select & Approve" : "Select"}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t bg-muted/10">
          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            Green = lowest price. Selecting a vendor initiates the approval workflow.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Quotations List View
// GET /api/quotations → shows submitted bids (vendor) or all quotations (admin/officer)
// GET /api/rfqs?status=PUBLISHED → open RFQs available for vendor to bid on
// ─────────────────────────────────────────────────────────────────────────────
const QuotationsListView: React.FC<{
  onSubmitFor: (rfq: RFQ, existing: Quotation | null) => void;
  onCompare: (rfqId: string, rfqTitle: string, quotations: Quotation[]) => void;
}> = ({ onSubmitFor, onCompare }) => {
  const { apiFetch, user } = useAuth();
  const [myQuotations, setMyQuotations] = useState<Quotation[]>([]);
  const [openRFQs, setOpenRFQs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const isVendor = user?.role === "VENDOR";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, rfqRes] = await Promise.all([
        apiFetch("/api/quotations"),
        apiFetch("/api/rfqs"),
      ]);
      const [qData, rfqData] = await Promise.all([qRes.json(), rfqRes.json()]);
      if (qData.success) setMyQuotations(qData.data);
      if (rfqData.success) {
        // For vendors: show PUBLISHED rfqs they haven't submitted to yet
        const all: RFQ[] = rfqData.data;
        if (isVendor) {
          const submittedRfqIds = new Set((qData.data as Quotation[]).map(q => q.rfqId));
          setOpenRFQs(all.filter(r => r.status === "PUBLISHED" && !submittedRfqIds.has(r.id)));
        }
      }
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  }, [apiFetch, isVendor]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group quotations by rfqId for comparison (admin view)
  const rfqGroups = useMemo(() => {
    const map = new Map<string, { rfqTitle: string; quotations: Quotation[] }>();
    myQuotations.forEach(q => {
      if (!map.has(q.rfqId)) map.set(q.rfqId, { rfqTitle: q.rfq?.title ?? "—", quotations: [] });
      map.get(q.rfqId)!.quotations.push(q);
    });
    return map;
  }, [myQuotations]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        subtitle="Manage bids and compare vendor submissions"
        action={
          !isVendor && rfqGroups.size > 0 ? (
            <button onClick={() => {
              const [rfqId, { rfqTitle, quotations }] = [...rfqGroups.entries()][0];
              onCompare(rfqId, rfqTitle, quotations);
            }} className="flex items-center gap-2 border border-primary/40 text-primary hover:bg-primary/5 px-4 py-2 rounded-xl font-semibold text-sm transition-all">
              <BarChart2 className="h-4 w-4" /> Compare Quotations
            </button>
          ) : (
            <button onClick={fetchData} className="flex items-center gap-2 border border-border text-muted-foreground hover:bg-accent px-4 py-2 rounded-xl font-semibold text-sm transition-all">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          )
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* Open RFQ invitations for vendors */}
          {isVendor && openRFQs.length > 0 && (
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold text-foreground">Open RFQ Invitations — Action Required</h2>
              </div>
              <div className="divide-y">
                {openRFQs.map(rfq => (
                  <div key={rfq.id} className="px-5 py-4 flex items-center justify-between hover:bg-accent/30 transition-colors">
                    <div>
                      <p className="font-bold text-primary text-sm">{rfq.rfqNumber}</p>
                      <p className="text-sm text-foreground mt-0.5">{rfq.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {rfq.deadline ? `Deadline: ${new Date(rfq.deadline).toLocaleDateString("en-US", { day: "numeric", month: "short" })}` : "No deadline"} · {rfq.category ?? "—"}
                      </p>
                    </div>
                    <button onClick={() => onSubmitFor(rfq, null)}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl font-semibold text-xs transition-all shadow-sm flex-shrink-0 ml-4">
                      <Send className="h-3.5 w-3.5" /> Prepare Bid
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My quotations table */}
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground">{isVendor ? "My Submitted Quotations" : "All Quotations"}</h2>
            </div>
            {myQuotations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <FileText className="h-8 w-8 opacity-30" />
                <p className="text-sm">No quotations yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4">RFQ</th>
                      {!isVendor && <th className="px-6 py-4">Vendor</th>}
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Delivery</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Submitted</th>
                      {!isVendor && <th className="px-6 py-4">Compare</th>}
                      {isVendor && <th className="px-6 py-4">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {myQuotations.map(q => (
                      <tr key={q.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-primary">{q.rfq?.rfqNumber ?? "—"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-40">{q.rfq?.title ?? "—"}</p>
                        </td>
                        {!isVendor && <td className="px-6 py-4 font-medium text-foreground">{q.vendor?.companyName ?? "—"}</td>}
                        <td className="px-6 py-4 font-bold text-foreground">₹{formatINR(q.totalAmount)}</td>
                        <td className="px-6 py-4 text-muted-foreground">{q.deliveryTimeline ? `${q.deliveryTimeline} days` : "—"}</td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", STATUS_STYLE[q.status])}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {q.submittedAt ? new Date(q.submittedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                        {!isVendor && (
                          <td className="px-6 py-4">
                            <button onClick={() => {
                              const group = rfqGroups.get(q.rfqId);
                              if (group) onCompare(q.rfqId, group.rfqTitle, group.quotations);
                            }} className="flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-xs transition-colors">
                              Compare <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                        {isVendor && (
                          <td className="px-6 py-4">
                            {q.status === "SELECTED" ? (
                              <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                              </span>
                            ) : q.status === "REJECTED" ? (
                              <span className="flex items-center gap-1 text-rose-600 text-xs font-semibold">
                                <XCircle className="h-3.5 w-3.5" /> Rejected
                              </span>
                            ) : q.status === "DRAFT" ? (
                              <button onClick={() => onSubmitFor(q.rfq, q)}
                                className="flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-xs transition-colors">
                                Edit <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            ) : <span className="text-xs text-muted-foreground">Submitted</span>}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
type View = "list" | "submit" | "compare";

export const Quotations: React.FC = () => {
  const [view, setView] = useState<View>("list");
  const [activeRFQ, setActiveRFQ] = useState<RFQ | null>(null);
  const [existingQuotation, setExistingQuotation] = useState<Quotation | null>(null);
  const [compareState, setCompareState] = useState<{ rfqId: string; rfqTitle: string; quotations: Quotation[] } | null>(null);

  if (view === "submit" && activeRFQ) {
    return <SubmitQuotationForm rfq={activeRFQ} existing={existingQuotation}
      onBack={() => setView("list")} onSaved={() => { setView("list"); setActiveRFQ(null); }} />;
  }

  if (view === "compare" && compareState) {
    return <QuotationComparison {...compareState} onBack={() => setView("list")} onSelected={() => setView("list")} />;
  }

  return (
    <QuotationsListView
      onSubmitFor={(rfq, existing) => { setActiveRFQ(rfq); setExistingQuotation(existing); setView("submit"); }}
      onCompare={(rfqId, rfqTitle, quotations) => { setCompareState({ rfqId, rfqTitle, quotations }); setView("compare"); }}
    />
  );
};
