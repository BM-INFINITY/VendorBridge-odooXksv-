import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  X,
  ChevronRight,
  Star,
  Truck,
  Building2,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Receipt,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { cn } from "../utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types (mirrors Prisma Approval model + includes)
// ─────────────────────────────────────────────────────────────────────────────
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Approval {
  id: string;
  status: ApprovalStatus;
  remarks: string | null;
  createdAt: string;
  reviewedAt: string | null;
  rfq: {
    id: string;
    rfqNumber: string;
    title: string;
  };
  quotation: {
    id: string;
    totalAmount: number;
    deliveryTimeline: string | null;
    notes: string | null;
    vendor: {
      id: string;
      companyName: string;
      vendorName: string;
      email: string;
    };
  };
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

const STATUS_STYLE: Record<ApprovalStatus, string> = {
  PENDING: "bg-amber-50 text-amber-600 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-600 border-rose-200",
};

const STATUS_ICON: Record<ApprovalStatus, React.ReactNode> = {
  PENDING: <Clock className="h-3.5 w-3.5" />,
  APPROVED: <CheckCircle2 className="h-3.5 w-3.5" />,
  REJECTED: <XCircle className="h-3.5 w-3.5" />,
};

// Backend approval model has a simple 1-step workflow (PENDING → APPROVED/REJECTED by a reviewer)
// Map this into our 4-step visual stepper
const WORKFLOW_STEPS = [
  { id: 1, label: "Submitted" },
  { id: 2, label: "L1 Review" },
  { id: 3, label: "L2 Approval" },
  { id: 4, label: "Generate PO" },
];

function approvalToCurrentStep(a: Approval): number {
  if (a.status === "APPROVED") return 4;
  if (a.status === "REJECTED") return 2;
  return 3; // PENDING = at L2 step
}

// ─────────────────────────────────────────────────────────────────────────────
// 4-Step Workflow Stepper
// ─────────────────────────────────────────────────────────────────────────────
const WorkflowStepper: React.FC<{ approval: Approval }> = ({ approval }) => {
  const currentStep = approvalToCurrentStep(approval);
  return (
    <div className="flex items-center gap-0 my-6">
      {WORKFLOW_STEPS.map((step, idx) => {
        const done = approval.status === "APPROVED" || currentStep > step.id;
        const active = currentStep === step.id && approval.status === "PENDING";
        const rejected = approval.status === "REJECTED" && step.id === currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={cn(
                "h-9 w-9 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all flex-shrink-0",
                rejected ? "border-rose-500 bg-rose-500 text-white"
                  : done ? "border-emerald-500 bg-emerald-500 text-white"
                  : active ? "border-amber-400 bg-amber-400 text-white shadow-md shadow-amber-400/30"
                  : "border-border bg-card text-muted-foreground"
              )}>
                {done ? <Check className="h-4 w-4" /> : rejected ? <X className="h-4 w-4" /> : step.id}
              </div>
              <span className={cn(
                "text-[11px] font-semibold mt-1.5 whitespace-nowrap",
                rejected ? "text-rose-500" : active ? "text-amber-500" : done ? "text-emerald-600" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-2 mb-5 transition-all",
                done && !rejected ? "bg-emerald-400" : "bg-border")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Screen 8 — Approval Detail / Workflow View
// POST /api/approvals/:id/approve  { remarks }
// POST /api/approvals/:id/reject   { remarks }
// ─────────────────────────────────────────────────────────────────────────────
const ApprovalDetail: React.FC<{
  approval: Approval;
  onBack: () => void;
  onAction: (id: string, action: "approve" | "reject", remarks: string) => Promise<{ invoiceNumber?: string; poNumber?: string; emailedTo?: string } | void>;
}> = ({ approval, onBack, onAction }) => {
  const [remarks, setRemarks] = useState(approval.remarks ?? "");
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);
  const [approvalResult, setApprovalResult] = useState<{ invoiceNumber?: string; poNumber?: string; emailedTo?: string } | null>(null);
  const canAct = approval.status === "PENDING" && !approvalResult;

  const handleAction = async (action: "approve" | "reject") => {
    setActing(action);
    try {
      const result = await onAction(approval.id, action, remarks);
      if (action === "approve" && result) {
        setApprovalResult(result);
      }
    }
    finally { setActing(null); }
  };

  const { quotation, rfq } = approval;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Approvals
      </button>

      <PageHeader
        title="Approval Workflow"
        subtitle={`RFQ: ${rfq.title} – Vendor: ${quotation.vendor.companyName} – ₹${formatINR(quotation.totalAmount)}`}
      />

      <WorkflowStepper approval={approval} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Approval Chain + Remarks */}
        <div className="space-y-4">
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Approval Chain</h3>
            </div>
            <div className="px-5 divide-y">
              {/* Step 1 — Procurement selected the quotation (always done) */}
              <div className="flex items-start gap-3.5 py-4">
                <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-full border-2 border-emerald-500 bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">Procurement Officer</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Quotation selected</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(approval.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {/* Step 2 — Manager / Admin review */}
              <div className="flex items-start gap-3.5 py-4">
                <div className={cn(
                  "mt-0.5 flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center",
                  approval.status === "APPROVED" ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                    : approval.status === "REJECTED" ? "border-rose-500 bg-rose-50 text-rose-600"
                    : "border-amber-400 bg-amber-50 text-amber-500"
                )}>
                  {approval.status === "APPROVED" ? <Check className="h-4 w-4" />
                    : approval.status === "REJECTED" ? <X className="h-4 w-4" />
                    : <Clock className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">
                    {approval.reviewedBy
                      ? `${approval.reviewedBy.firstName} ${approval.reviewedBy.lastName}`
                      : "Manager / Admin"}
                    <span className="font-normal text-muted-foreground text-xs ml-1">(Approver)</span>
                  </p>
                  {approval.status === "PENDING" && (
                    <p className="text-xs text-amber-500 mt-0.5">Awaiting decision</p>
                  )}
                  {approval.status === "APPROVED" && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Approved{approval.remarks ? `: "${approval.remarks}"` : ""}
                    </p>
                  )}
                  {approval.status === "REJECTED" && (
                    <p className="text-xs text-rose-600 mt-0.5">
                      Rejected{approval.remarks ? `: "${approval.remarks}"` : ""}
                    </p>
                  )}
                  {approval.reviewedAt && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(approval.reviewedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>

              {/* Step 3 — PO Generated (only if approved) */}
              {approval.status === "APPROVED" && (
                <div className="flex items-start gap-3.5 py-4">
                  <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-full border-2 border-emerald-500 bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">System</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Purchase Order auto-generated</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Approval Remarks */}
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b bg-muted/30">
              <h3 className="text-xs font-bold uppercase tracking-wider">Approval Remarks</h3>
            </div>
            <div className="px-5 py-4">
              <textarea rows={4} value={remarks} onChange={e => setRemarks(e.target.value)}
                placeholder="Add your comments or conditions…"
                disabled={!canAct}
                className={cn(
                  "w-full bg-background border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none transition-all",
                  !canAct && "opacity-60 cursor-not-allowed"
                )} />
            </div>
          </div>
        </div>

        {/* Right: Quotation Summary + Actions */}
        <div className="space-y-4">
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Quotations Summary</h3>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Vendor</span>
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {quotation.vendor.companyName}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className="font-bold text-primary text-lg">₹{formatINR(quotation.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Delivery</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                  {quotation.deliveryTimeline ? `${quotation.deliveryTimeline} days` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <span className="text-muted-foreground font-medium">Notes</span>
                <span className="font-medium text-foreground text-xs text-right max-w-40 truncate">{quotation.notes || "—"}</span>
              </div>
            </div>

            {/* Approve / Reject buttons */}
            {canAct && (
              <div className="px-5 py-4 border-t flex gap-3">
                <button onClick={() => handleAction("approve")} disabled={!!acting}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all",
                    "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 disabled:opacity-60")}>
                  {acting === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Approve
                </button>
                <button onClick={() => handleAction("reject")} disabled={!!acting}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all border",
                    "border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-60")}>
                  {acting === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Reject
                </button>
              </div>
            )}

            {/* Resolved state — show rich success banner when just approved */}
            {approvalResult && (
              <div className="mx-5 mb-5 rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
                <div className="px-5 py-3 bg-emerald-500 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                  <span className="text-white font-bold text-sm">Approved — Workflow Complete</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {approvalResult.poNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-muted-foreground">Purchase Order generated:</span>
                      <span className="font-bold text-foreground">{approvalResult.poNumber}</span>
                    </div>
                  )}
                  {approvalResult.invoiceNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Receipt className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-muted-foreground">Invoice generated:</span>
                      <span className="font-bold text-foreground">{approvalResult.invoiceNumber}</span>
                    </div>
                  )}
                  {approvalResult.emailedTo ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-muted-foreground">Invoice emailed to vendor:</span>
                      <span className="font-bold text-foreground">{approvalResult.emailedTo}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="text-amber-700 text-xs">Invoice created but email could not be sent (SMTP may not be configured).</span>
                    </div>
                  )}
                  <Link to="/invoices"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" /> View in Invoices
                  </Link>
                </div>
              </div>
            )}

            {/* Rejected state */}
            {!canAct && approval.status === "REJECTED" && !approvalResult && (
              <div className={cn("mx-5 mb-5 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2",
                "bg-rose-50 text-rose-700 border border-rose-200")}>
                <XCircle className="h-4 w-4" /> This approval was rejected
              </div>
            )}

            {/* Previously approved (not just approved now) */}
            {!canAct && approval.status === "APPROVED" && !approvalResult && (
              <div className={cn("mx-5 mb-5 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2",
                "bg-emerald-50 text-emerald-700 border border-emerald-200")}>
                <CheckCircle2 className="h-4 w-4" /> Approval granted — PO and Invoice have been generated
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Approvals List View — GET /api/approvals
// ─────────────────────────────────────────────────────────────────────────────
const ApprovalsListView: React.FC<{
  approvals: Approval[];
  loading: boolean;
  onView: (a: Approval) => void;
  onRefresh: () => void;
}> = ({ approvals, loading, onView, onRefresh }) => {
  const [filter, setFilter] = useState<ApprovalStatus | "ALL">("ALL");

  const filtered = approvals.filter(a => filter === "ALL" || a.status === filter);
  const counts = approvals.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const tabs: { label: string; value: ApprovalStatus | "ALL" }[] = [
    { label: "All", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Approvals Dashboard" subtitle="Review and act on procurement approval requests"
        action={
          <button onClick={onRefresh} className="flex items-center gap-2 border border-border text-muted-foreground hover:bg-accent px-4 py-2 rounded-xl font-semibold text-sm transition-all">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        } />

      {counts["PENDING"] > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 text-amber-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-500" />
          <p className="text-sm font-medium">
            <strong>{counts["PENDING"]}</strong> approval{counts["PENDING"] > 1 ? "s" : ""} require your action
          </p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => {
          const count = tab.value === "ALL" ? approvals.length : (counts[tab.value] || 0);
          return (
            <button key={tab.value} onClick={() => setFilter(tab.value)}
              className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                filter === tab.value ? "bg-primary text-white border-primary shadow-sm" : "bg-card text-muted-foreground border-border hover:bg-accent")}>
              {tab.label}
              <span className={cn("inline-flex items-center justify-center min-w-[18px] px-1 rounded text-[10px] font-bold",
                filter === tab.value ? "bg-white/20 text-white" : "bg-muted text-muted-foreground")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">RFQ</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-center">Delivery</th>
                  <th className="px-6 py-4">Reviewer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-14 text-center text-muted-foreground">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />No approvals found
                  </td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-primary">{a.rfq.rfqNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-40">{a.rfq.title}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{a.quotation.vendor.companyName}</td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">₹{formatINR(a.quotation.totalAmount)}</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      {a.quotation.deliveryTimeline ? `${a.quotation.deliveryTimeline}d` : "—"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {a.reviewedBy ? `${a.reviewedBy.firstName} ${a.reviewedBy.lastName}` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border", STATUS_STYLE[a.status])}>
                        {STATUS_ICON[a.status]}{a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => onView(a)} className="flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-xs transition-colors">
                        {a.status === "PENDING" ? "Review" : "View"}<ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export const Approvals: React.FC = () => {
  const { apiFetch } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Approval | null>(null);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/approvals");
      const data = await res.json();
      if (data.success) setApprovals(data.data);
      else toast.error(data.error || "Failed to load approvals");
    } catch { toast.error("Failed to load approvals"); }
    finally { setLoading(false); }
  }, [apiFetch]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const handleAction = async (id: string, action: "approve" | "reject", remarks: string): Promise<{ invoiceNumber?: string; poNumber?: string; emailedTo?: string } | void> => {
    try {
      const res = await apiFetch(`/api/approvals/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "approve"
          ? "Approved! PO and Invoice generated — vendor has been notified by email."
          : "Approval rejected.");
        await fetchApprovals(); // refresh list from server
        if (action === "approve") {
          return {
            invoiceNumber: data.invoiceNumber ?? undefined,
            poNumber: data.poNumber ?? undefined,
            emailedTo: data.emailedTo ?? undefined,
          };
        } else {
          setSelected(null); // go back to list on reject
        }
      } else {
        toast.error(data.error || `Failed to ${action}`);
      }
    } catch { toast.error("An error occurred"); }
  };

  if (selected) {
    const latest = approvals.find(a => a.id === selected.id) || selected;
    return <ApprovalDetail approval={latest} onBack={() => setSelected(null)} onAction={handleAction} />;
  }

  return (
    <ApprovalsListView
      approvals={approvals}
      loading={loading}
      onView={setSelected}
      onRefresh={fetchApprovals}
    />
  );
};
