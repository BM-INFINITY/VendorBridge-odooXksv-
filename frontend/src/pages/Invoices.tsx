import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatCurrency } from "../utils";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Receipt, Mail, Send, Download, Printer } from "lucide-react";
import { PageHeader } from "../components/PageHeader";

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
    address?: string | null;
    gstNumber?: string | null;
  };
  purchaseOrder: {
    poNumber: string;
    issueDate: string;
    rfq: {
      rfqNumber: string;
      title: string;
    };
    items?: {
      id: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
    }[];
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

  const handleMarkAsPaid = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/invoices/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Invoice marked as paid!");
        handleViewDetails(id);
        fetchInvoices();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating status");
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
          <PageHeader
            title="Invoices"
            subtitle="View financial billing reports and download invoice PDFs"
          />

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
        <div className="space-y-6 print:m-0 print:space-y-4">
          <button 
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors print:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to invoices list
          </button>

          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Purchase Order & Invoice</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {selectedInvoice.purchaseOrder.poNumber} auto-generated after approval
                </p>
              </div>
              <div className="flex gap-3 print:hidden">
                <button
                  onClick={handleDownloadPDF}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2"
                >
                  Print
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Email invoice
                </button>
              </div>
            </div>

            {/* Bill To & Info Card */}
            <div className="border border-gray-200 rounded-lg mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 p-6 pb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bill to:</p>
                  <p className="font-semibold text-foreground">VendorBridge</p>
                  <p className="text-sm text-foreground mt-1">Procurement Department</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <p className="text-sm text-muted-foreground mb-2">Vendor</p>
                  <p className="font-semibold text-foreground">{selectedInvoice.vendor.companyName}</p>
                  {selectedInvoice.vendor.address && (
                    <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{selectedInvoice.vendor.address}</p>
                  )}
                  {selectedInvoice.vendor.gstNumber && (
                    <p className="text-sm text-foreground mt-1">GSTIN: {selectedInvoice.vendor.gstNumber}</p>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 p-6 pt-4 gap-y-3">
                <div>
                  <p className="text-sm mb-1.5"><span className="text-muted-foreground w-28 inline-block">PO Number:</span> <span className="font-medium text-foreground">{selectedInvoice.purchaseOrder.poNumber}</span></p>
                  <p className="text-sm"><span className="text-muted-foreground w-28 inline-block">PO date:</span> <span className="font-medium text-foreground">{formatDate(selectedInvoice.purchaseOrder.issueDate || selectedInvoice.createdAt)}</span></p>
                </div>
                <div>
                  <p className="text-sm mb-1.5"><span className="text-muted-foreground w-28 inline-block">invoice date:</span> <span className="font-medium text-foreground">{formatDate(selectedInvoice.issuedAt || selectedInvoice.createdAt)}</span></p>
                  <p className="text-sm"><span className="text-muted-foreground w-28 inline-block">Due date:</span> <span className="font-medium text-foreground">{formatDate(new Date(new Date(selectedInvoice.issuedAt || selectedInvoice.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())}</span></p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-foreground">Item</th>
                    <th className="px-6 py-3 font-semibold text-foreground">Qty</th>
                    <th className="px-6 py-3 font-semibold text-foreground">Unit price</th>
                    <th className="px-6 py-3 font-semibold text-foreground text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-foreground">
                  {selectedInvoice.purchaseOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">{item.itemName}</td>
                      <td className="px-6 py-4">{Number(item.quantity).toString()}</td>
                      <td className="px-6 py-4">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))}
                  {(!selectedInvoice.purchaseOrder.items || selectedInvoice.purchaseOrder.items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        No items found for this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="border-t border-gray-200 text-sm">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-muted-foreground">Subtotal</td>
                    <td className="px-6 py-3 text-right font-medium text-foreground">{formatCurrency(selectedInvoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-muted-foreground">Tax Amount</td>
                    <td className="px-6 py-3 text-right font-medium text-foreground">{formatCurrency(selectedInvoice.taxAmount)}</td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td colSpan={3} className="px-6 py-4 text-right font-semibold text-foreground">Grand total</td>
                    <td className="px-6 py-4 text-right font-bold text-primary">{formatCurrency(selectedInvoice.grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Status Area */}
            <div className="flex items-center gap-3 text-sm pt-2 print:hidden">
              <span className="text-muted-foreground">status:</span>
              <span className={`px-3 py-1 rounded-full font-medium text-xs ${
                selectedInvoice.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                selectedInvoice.status === "SENT" ? "bg-blue-100 text-blue-700" :
                "bg-amber-100 text-amber-700"
              }`}>
                {selectedInvoice.status === "PAID" ? "Paid" : "Pending Payment"}
              </span>
              
              {selectedInvoice.status !== "PAID" && (
                <button 
                  onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                  className="text-blue-600 hover:text-blue-800 font-medium ml-2 text-xs flex items-center gap-1"
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Mark as Paid
                </button>
              )}
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
