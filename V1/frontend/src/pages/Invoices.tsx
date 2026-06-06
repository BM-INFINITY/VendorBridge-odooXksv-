import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatCurrency } from "../utils";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Receipt, Mail, Send, Download } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  status: "GENERATED" | "SENT" | "PAID";
  issuedAt: string;
  createdAt: string;
  vendor: {
    companyName: string;
    vendorName: string;
    email: string;
  };
  purchaseOrder: {
    poNumber: string;
    rfq: {
      rfqNumber: string;
      title: string;
    };
  };
}

export const Invoices: React.FC = () => {
  const { apiFetch } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation/Detail state
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await apiFetch("/api/invoices");
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleViewDetails = async (invoiceId: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/invoices/${invoiceId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedInvoice(data.data);
        setEmailInput(data.data.vendor.email);
        setViewMode("detail");
      } else {
        toast.error(data.error || "Failed to load invoice details");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading invoice details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedInvoice) return;

    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/invoices/${selectedInvoice.id}/pdf`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedInvoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF Downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download PDF invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !emailInput) return;

    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/invoices/${selectedInvoice.id}/email`, {
        method: "POST",
        body: JSON.stringify({ email: emailInput }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Invoice emailed successfully to ${emailInput}!`);
        setShowEmailModal(false);
        // Refresh details
        handleViewDetails(selectedInvoice.id);
        fetchInvoices();
      } else {
        toast.error(data.error || "Failed to send invoice email");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error sending email");
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

  return (
    <div className="space-y-6">
      {/* ----------------- LIST VIEW ----------------- */}
      {viewMode === "list" && (
        <>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
            <p className="text-sm text-muted-foreground mt-1">View financial billing reports and download invoice PDFs</p>
          </div>

          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Invoice Number</th>
                    <th className="px-6 py-4">PO Number</th>
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Issued At</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-foreground">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        No invoices generated yet.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-primary">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 font-semibold text-foreground">
                          {inv.purchaseOrder.poNumber}
                        </td>
                        <td className="px-6 py-4 font-medium">{inv.vendor.companyName}</td>
                        <td className="px-6 py-4 font-bold text-foreground">
                          {formatCurrency(inv.grandTotal)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            inv.status === "GENERATED" 
                              ? "bg-slate-500/10 text-slate-600" 
                              : inv.status === "SENT"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-emerald-500/10 text-emerald-600"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatDate(inv.issuedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(inv.id)}
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
      {viewMode === "detail" && selectedInvoice && (
        <div className="space-y-6">
          <button 
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to invoices list
          </button>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column: Metadata */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{selectedInvoice.invoiceNumber}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Linked Order: <strong className="text-foreground">{selectedInvoice.purchaseOrder.poNumber}</strong>
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedInvoice.status === "GENERATED" 
                      ? "bg-slate-500/10 text-slate-600" 
                      : selectedInvoice.status === "SENT"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-emerald-500/10 text-emerald-600"
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase">Vendor / Supplier</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedInvoice.vendor.companyName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedInvoice.vendor.vendorName} ({selectedInvoice.vendor.email})</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase">Issue Date</span>
                    <p className="font-semibold text-foreground mt-0.5">{formatDate(selectedInvoice.issuedAt)}</p>
                  </div>
                </div>

                {/* financial Breakdown */}
                <div className="border-t pt-4 mt-2 space-y-2.5 max-w-md ml-auto text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal Amount:</span>
                    <span className="font-semibold">{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Tax Amount:</span>
                    <span className="font-semibold">{formatCurrency(selectedInvoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2.5 text-base">
                    <span className="font-bold text-foreground">Grand Total:</span>
                    <span className="font-bold text-primary">{formatCurrency(selectedInvoice.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="space-y-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-foreground border-b pb-3">Billing Options</h3>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download Invoice PDF
                  </button>

                  <button
                    onClick={() => setShowEmailModal(true)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 border hover:bg-accent text-foreground py-2.5 rounded-lg font-medium text-sm transition-all"
                  >
                    <Mail className="h-4 w-4" />
                    Email to Supplier
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Email Modal Dialog */}
          {showEmailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="bg-card border rounded-xl p-6 shadow-xl max-w-md w-full mx-4 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    Send Invoice Email
                  </h3>
                  <button onClick={() => setShowEmailModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Recipient Email *</label>
                    <input
                      type="email"
                      required
                      className="w-full bg-background border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-1 focus:ring-primary outline-none"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(false)}
                      className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-accent transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Send Invoice
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Simple X icon helper
const X: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
