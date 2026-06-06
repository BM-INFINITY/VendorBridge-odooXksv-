import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatCurrency } from "../utils";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Check, X, ShieldCheck, ShieldX, MessageSquare, AlertCircle } from "lucide-react";

interface RFQItem {
  id: string;
  itemName: string;
  quantity: number;
}

interface RFQ {
  id: string;
  rfqNumber: string;
  title: string;
  description: string | null;
  items: RFQItem[];
}

interface QuotationItem {
  id: string;
  unitPrice: number;
  quantity: number;
  taxPercentage: number;
  totalAmount: number;
  rfqItemId: string;
}

interface Quotation {
  id: string;
  totalAmount: number;
  deliveryTimeline: string | null;
  notes: string | null;
  vendor: {
    companyName: string;
    vendorName: string;
    email: string;
  };
  items: QuotationItem[];
}

interface Approval {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks: string | null;
  createdAt: string;
  reviewedAt: string | null;
  quotation: Quotation;
  rfq: RFQ;
  reviewedBy?: {
    firstName: string;
    lastName: string;
  } | null;
}

export const Approvals: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation/Detail views
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  
  // Action state
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchApprovals = async () => {
    try {
      const res = await apiFetch("/api/approvals");
      const data = await res.json();
      if (data.success) {
        setApprovals(data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleViewDetails = async (approvalId: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/approvals/${approvalId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedApproval(data.data);
        setRemarks(data.data.remarks || "");
        setViewMode("detail");
      } else {
        toast.error(data.error || "Failed to load approval details");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading approval details");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision: "approve" | "reject") => {
    if (!selectedApproval) return;
    
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/approvals/${selectedApproval.id}/${decision}`, {
        method: "POST",
        body: JSON.stringify({ remarks })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(decision === "approve" ? "Request Approved & Purchase Order generated!" : "Request Rejected");
        setViewMode("list");
        setSelectedApproval(null);
        fetchApprovals();
      } else {
        toast.error(data.error || `Failed to ${decision} request`);
      }
    } catch (error) {
      console.error(error);
      toast.error(`Error during ${decision} action`);
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

  const isReviewer = ["ADMIN", "MANAGER"].includes(user?.role || "");

  return (
    <div className="space-y-6">
      {/* ----------------- LIST VIEW ----------------- */}
      {viewMode === "list" && (
        <>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Approvals Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Review procurement approvals queue</p>
          </div>

          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">RFQ Number / Title</th>
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Request Date</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-foreground">
                  {approvals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No approvals in queue.
                      </td>
                    </tr>
                  ) : (
                    approvals.map((approval) => (
                      <tr key={approval.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-primary">{approval.rfq.rfqNumber}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{approval.rfq.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold">{approval.quotation.vendor.companyName}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-foreground">
                          {formatCurrency(approval.quotation.totalAmount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            approval.status === "PENDING" 
                              ? "bg-amber-500/10 text-amber-600" 
                              : approval.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}>
                            {approval.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatDate(approval.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(approval.id)}
                            className="text-primary hover:text-primary/80 font-semibold text-xs flex items-center gap-1 transition-colors"
                          >
                            Review Request
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
      {viewMode === "detail" && selectedApproval && (
        <div className="space-y-6">
          <button 
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to queue
          </button>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column: Bid and RFQ specs */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {selectedApproval.rfq.rfqNumber}
                    </span>
                    <h2 className="text-xl font-bold mt-2">{selectedApproval.rfq.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted by: <strong className="text-foreground">{selectedApproval.quotation.vendor.companyName}</strong> ({selectedApproval.quotation.vendor.vendorName})
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedApproval.status === "PENDING" 
                      ? "bg-amber-500/10 text-amber-600" 
                      : selectedApproval.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-rose-500/10 text-rose-600"
                  }`}>
                    {selectedApproval.status}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase">Requested Deadline</span>
                    <p className="font-semibold text-foreground">{formatDate(selectedApproval.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase">Vendor Delivery Timeline</span>
                    <p className="font-semibold text-foreground">{selectedApproval.quotation.deliveryTimeline || "Not specified"}</p>
                  </div>
                </div>

                {selectedApproval.quotation.notes && (
                  <div className="bg-muted/30 p-3 rounded border text-sm italic text-muted-foreground mt-2">
                    Vendor Notes: &ldquo;{selectedApproval.quotation.notes}&rdquo;
                  </div>
                )}
              </div>

              {/* Quotation items */}
              <div className="bg-card border rounded-xl p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Quoted Line Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                        <th className="px-4 py-2">Item Description</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Price Unit</th>
                        <th className="px-4 py-2 text-right">Tax</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedApproval.quotation.items.map((item) => {
                        const rfqItem = selectedApproval.rfq.items.find((r) => r.id === item.rfqItemId);
                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-3 font-semibold">{rfqItem?.itemName || "Procurement Item"}</td>
                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-right">{item.taxPercentage}%</td>
                            <td className="px-4 py-3 text-right font-bold text-foreground">
                              {formatCurrency(item.totalAmount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase">Grand Total Amount</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(selectedApproval.quotation.totalAmount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Decisions & Remarks */}
            <div className="space-y-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-foreground border-b pb-3 flex items-center gap-1.5">
                  <MessageSquare className="h-4.5 w-4.5 text-muted-foreground" />
                  Decision & Remarks
                </h3>

                {selectedApproval.status === "PENDING" ? (
                  isReviewer ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Remarks / Reason</label>
                        <textarea
                          rows={3}
                          placeholder="e.g. Price is within budget constraints. Shipping timelines acceptable."
                          className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          onClick={() => handleDecision("approve")}
                          disabled={submitting}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold text-sm transition-all shadow-sm"
                        >
                          <Check className="h-4 w-4" /> Approve & Issue PO
                        </button>
                        <button
                          onClick={() => handleDecision("reject")}
                          disabled={submitting}
                          className="w-full flex items-center justify-center gap-2 border border-destructive/20 text-destructive hover:bg-destructive/10 py-2 rounded-lg font-semibold text-sm transition-all"
                        >
                          <X className="h-4 w-4" /> Reject Request
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/40 p-4 rounded-lg border text-sm text-center text-muted-foreground flex flex-col items-center gap-1">
                      <AlertCircle className="h-5 w-5" />
                      Pending Approval
                      <p className="text-xs font-normal mt-1">Only Managers or Admins can review and approve this request.</p>
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                      selectedApproval.status === "APPROVED" 
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                    }`}>
                      {selectedApproval.status === "APPROVED" ? (
                        <ShieldCheck className="h-5 w-5" />
                      ) : (
                        <ShieldX className="h-5 w-5" />
                      )}
                      Request {selectedApproval.status}
                    </div>

                    {selectedApproval.remarks && (
                      <div className="text-sm">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Reviewer Remarks</p>
                        <p className="bg-muted/40 border p-3 rounded mt-1 italic text-muted-foreground">&ldquo;{selectedApproval.remarks}&rdquo;</p>
                      </div>
                    )}

                    {selectedApproval.reviewedBy && (
                      <div className="text-xs text-muted-foreground">
                        Reviewed by: <span className="font-semibold text-foreground">{selectedApproval.reviewedBy.firstName} {selectedApproval.reviewedBy.lastName}</span>
                        {selectedApproval.reviewedAt && ` on ${new Date(selectedApproval.reviewedAt).toLocaleDateString()}`}
                      </div>
                    )}
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
