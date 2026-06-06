import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  ArrowLeft,
  Send,
  Save,
  Trash2,
  Upload,
  FileText,
  Building2,
  ChevronRight,
  Check,
  Calendar,
  Tag,
  AlignLeft,
  List,
  Users,
  Paperclip,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { cn } from "../utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types (mirror backend Prisma models)
// ─────────────────────────────────────────────────────────────────────────────
interface RFQItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string | null;
}

interface VendorRef {
  id: string;
  companyName: string;
  vendorName: string;
}

interface RFQVendorAssignment {
  vendorId: string;
  vendor: VendorRef;
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
  vendors?: RFQVendorAssignment[];
}

interface LineItemDraft {
  id: string; // local only
  itemName: string;
  quantity: number;
  unit: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "RFQ Details" },
  { id: 2, label: "Review" },
  { id: 3, label: "Confirm" },
];

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  PUBLISHED: "bg-blue-50 text-blue-600 border-blue-200",
  CLOSED: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const newLineItem = (): LineItemDraft => ({
  id: crypto.randomUUID(),
  itemName: "",
  quantity: 1,
  unit: "pcs",
});

// ─────────────────────────────────────────────────────────────────────────────
// Step Indicator
// ─────────────────────────────────────────────────────────────────────────────
const StepIndicator: React.FC<{ current: number }> = ({ current }) => (
  <div className="flex items-center gap-0 mb-8">
    {STEPS.map((step, idx) => {
      const done = current > step.id;
      const active = current === step.id;
      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={cn(
              "h-9 w-9 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all",
              done ? "border-primary bg-primary text-white"
                : active ? "border-primary bg-white text-primary shadow-md shadow-primary/20"
                : "border-border bg-card text-muted-foreground"
            )}>
              {done ? <Check className="h-4 w-4" /> : step.id}
            </div>
            <span className={cn(
              "text-[11px] font-semibold mt-1.5 whitespace-nowrap",
              active ? "text-primary" : done ? "text-primary/70" : "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={cn(
              "flex-1 h-0.5 mx-2 mb-5",
              current > step.id ? "bg-primary" : "bg-border"
            )} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Attachment Drop Zone (UI only — real upload can be wired later)
// ─────────────────────────────────────────────────────────────────────────────
interface AttachmentDraft { id: string; name: string; size: number; file: File; }
const AttachmentsZone: React.FC<{
  attachments: AttachmentDraft[];
  onChange: (a: AttachmentDraft[]) => void;
}> = ({ attachments, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: AttachmentDraft[] = Array.from(files).map(f => ({ id: crypto.randomUUID(), name: f.name, size: f.size, file: f }));
    onChange([...attachments, ...next]);
  };
  const fmt = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all select-none",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
        )}
      >
        <Upload className={cn("h-8 w-8 mx-auto mb-2", dragging ? "text-primary" : "text-muted-foreground/60")} />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Drag &amp; drop files</span> or{" "}
          <span className="text-primary font-semibold">click to upload</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">PDF, XLSX, DOCX, PNG up to 10 MB</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
      </div>
      {attachments.map(a => (
        <div key={a.id} className="flex items-center gap-3 bg-muted/40 border rounded-lg px-3 py-2">
          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{a.name}</p>
            <p className="text-xs text-muted-foreground">{fmt(a.size)}</p>
          </div>
          <button type="button" onClick={() => onChange(attachments.filter(x => x.id !== a.id))}
            className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Create RFQ Form — connected to POST /api/rfqs + POST /api/rfqs/:id/publish
// ─────────────────────────────────────────────────────────────────────────────
const CreateRFQForm: React.FC<{ onBack: () => void; onSaved: () => void }> = ({ onBack, onSaved }) => {
  const { apiFetch } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<LineItemDraft[]>([newLineItem()]);
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [vendors, setVendors] = useState<VendorRef[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Fetch active vendors for the picker
  useEffect(() => {
    setLoadingVendors(true);
    apiFetch("/api/vendors?status=ACTIVE")
      .then(r => r.json())
      .then(d => { if (d.success) setVendors(d.data); })
      .catch(() => {})
      .finally(() => setLoadingVendors(false));
  }, [apiFetch]);

  const assignedVendors = vendors.filter(v => vendorIds.includes(v.id));
  const availableVendors = vendors.filter(v =>
    !vendorIds.includes(v.id) &&
    v.companyName.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const updateItem = (id: string, field: keyof LineItemDraft, val: string | number) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: val } : it));

  const handleNextToReview = () => {
    if (!title.trim()) { toast.error("RFQ title is required"); return; }
    if (!deadline) { toast.error("Deadline is required"); return; }
    if (items.some(it => !it.itemName.trim())) { toast.error("All line items need a name"); return; }
    if (vendorIds.length === 0) { toast.error("Assign at least one vendor"); return; }
    setStep(2);
  };

  const handleSave = async (publish: boolean) => {
    setSubmitting(true);
    try {
      // 1. Create the RFQ as DRAFT
      const createRes = await apiFetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category: category || undefined,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
          description: description || undefined,
          items: items.map(({ itemName, quantity, unit }) => ({ itemName, quantity, unit })),
          vendorIds,
        }),
      });
      const createData = await createRes.json();
      if (!createData.success) { toast.error(createData.error || "Failed to create RFQ"); return; }

      const rfqId: string = createData.data.id;

      // 2. If sending — publish the RFQ
      if (publish) {
        const pubRes = await apiFetch(`/api/rfqs/${rfqId}/publish`, { method: "POST" });
        const pubData = await pubRes.json();
        if (!pubData.success) { toast.error(pubData.error || "Failed to publish RFQ"); return; }
        toast.success("RFQ created and sent to vendors!");
      } else {
        toast.success("RFQ saved as draft");
      }

      onSaved();
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to RFQs
      </button>

      <PageHeader title="Create RFQ" subtitle="new request for quotation" />
      <StepIndicator current={step} />

      {step === 1 && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left column */}
            <div className="space-y-5">
              {[
                { label: "RFQ Title", icon: <FileText className="h-3.5 w-3.5" />, required: true,
                  el: <input type="text" placeholder="Office Furniture procurement Q2" value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-background border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" /> },
                { label: "Category", icon: <Tag className="h-3.5 w-3.5" />, required: false,
                  el: <input type="text" placeholder="Furniture" value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-background border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" /> },
                { label: "Deadline", icon: <Calendar className="h-3.5 w-3.5" />, required: true,
                  el: <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-background border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" /> },
                { label: "Description", icon: <AlignLeft className="h-3.5 w-3.5" />, required: false,
                  el: <textarea rows={4} placeholder="Ergonomic chairs and standing desks for 3rd floor…"
                    value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full bg-background border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none" /> },
              ].map(({ label, icon, required, el }) => (
                <div key={label} className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {icon} {label} {required && <span className="text-destructive">*</span>}
                  </label>
                  {el}
                </div>
              ))}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Line Items */}
              <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
                  <List className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Line Items</h3>
                </div>
                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/20 border-b text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-3 text-center">Qty</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-1" />
                </div>
                <div className="divide-y">
                  {items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center group">
                      <div className="col-span-6">
                        <input type="text" placeholder={idx === 0 ? "Ergonomic chair" : "Item"}
                          value={item.itemName} onChange={e => updateItem(item.id, "itemName", e.target.value)}
                          className="w-full bg-background border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary/40 outline-none" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" min={1} value={item.quantity}
                          onChange={e => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                          className="w-full bg-background border rounded-lg px-2.5 py-1.5 text-xs text-center focus:ring-1 focus:ring-primary/40 outline-none" />
                      </div>
                      <div className="col-span-2">
                        <input type="text" placeholder="pcs" value={item.unit}
                          onChange={e => updateItem(item.id, "unit", e.target.value)}
                          className="w-full bg-background border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary/40 outline-none" />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button type="button" onClick={() => { if (items.length > 1) setItems(items.filter(i => i.id !== item.id)); }}
                          disabled={items.length === 1}
                          className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t">
                  <button type="button" onClick={() => setItems([...items, newLineItem()])}
                    className="flex items-center gap-1.5 text-primary hover:text-primary/80 text-xs font-semibold transition-colors">
                    <Plus className="h-3.5 w-3.5" /> add line item
                  </button>
                </div>
              </div>

              {/* Assign Vendors */}
              <div className="bg-card border rounded-xl shadow-sm relative z-10">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Assign Vendors</h3>
                  {loadingVendors && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  {assignedVendors.map(v => (
                    <div key={v.id} className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-medium">{v.companyName}</span>
                      </div>
                      <button type="button" onClick={() => setVendorIds(prev => prev.filter(id => id !== v.id))}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="relative">
                    <button type="button" onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-1.5 text-primary hover:text-primary/80 text-xs font-semibold transition-colors">
                      <Plus className="h-3.5 w-3.5" /> add vendor
                    </button>
                    {showDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                        <div className="absolute top-7 left-0 z-20 w-72 bg-card border rounded-xl shadow-xl overflow-hidden">
                          <div className="px-3 py-2 border-b">
                            <input autoFocus type="text" placeholder="Search vendors…" value={vendorSearch}
                              onChange={e => setVendorSearch(e.target.value)}
                              className="w-full bg-background border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {availableVendors.length === 0 ? (
                              <p className="px-4 py-3 text-sm text-muted-foreground text-center">
                                {vendorSearch ? "No vendors found" : vendors.length === 0 ? "No active vendors" : "All vendors assigned"}
                              </p>
                            ) : availableVendors.map(v => (
                              <button key={v.id} type="button"
                                onClick={() => { setVendorIds(prev => [...prev, v.id]); setVendorSearch(""); setShowDropdown(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                {v.companyName}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Attachments</h3>
                </div>
                <div className="px-4 py-4">
                  <AttachmentsZone attachments={attachments} onChange={setAttachments} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t mt-8">
            <button type="button" onClick={handleNextToReview}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm">
              Review RFQ <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-card border rounded-xl shadow-sm p-6 space-y-8">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4 border-b pb-2">RFQ Summary</h3>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div><span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold">Title</span><span className="font-medium">{title}</span></div>
                <div><span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold">Deadline</span><span className="font-medium">{new Date(deadline).toLocaleDateString()}</span></div>
                <div><span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold">Category</span><span className="font-medium">{category || "None"}</span></div>
              </div>
              {description && (
                <div className="mt-4 text-sm">
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider font-semibold">Description</span>
                  <p className="mt-1">{description}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-foreground mb-3 border-b pb-2 uppercase tracking-wider">Items Requested</h4>
              <ul className="space-y-2">
                {items.map((it, i) => (
                  <li key={i} className="text-sm flex items-center justify-between bg-muted/30 px-3 py-2 rounded-lg">
                    <span>{it.itemName}</span>
                    <span className="font-semibold text-muted-foreground">{it.quantity} {it.unit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-foreground mb-3 border-b pb-2 uppercase tracking-wider">Assigned Vendors</h4>
              <div className="flex flex-wrap gap-2">
                {assignedVendors.map(v => (
                  <span key={v.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-semibold">
                    <Building2 className="h-3.5 w-3.5" /> {v.companyName}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t mt-8">
            <button type="button" onClick={() => setStep(1)}
              className="flex items-center justify-center gap-2 border border-border hover:bg-accent text-foreground px-6 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <ArrowLeft className="h-4 w-4" /> Back to Edit
            </button>
            <button type="button" onClick={() => setStep(3)}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm">
              Confirm Details <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-card border rounded-xl shadow-sm p-12 text-center space-y-5">
            <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
              <Check className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">Ready to Submit</h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Your Request for Quotation is fully prepared. You can save it as a draft to work on later, or publish it immediately to notify the <strong className="text-foreground">{vendorIds.length} assigned vendors</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-6">
            <button type="button" onClick={() => setStep(2)} disabled={submitting}
              className="flex items-center justify-center gap-2 border border-border hover:bg-accent text-foreground px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button type="button" onClick={() => handleSave(false)} disabled={submitting}
              className="flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary/5 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60">
              <Save className="h-4 w-4" /> Save as Draft
            </button>
            <button type="button" onClick={() => handleSave(true)} disabled={submitting}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish &amp; Notify Vendors
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RFQ List — GET /api/rfqs
// ─────────────────────────────────────────────────────────────────────────────
const RFQListView: React.FC<{ onCreateNew: () => void }> = ({ onCreateNew }) => {
  const { apiFetch, user } = useAuth();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/rfqs");
      const data = await res.json();
      if (data.success) setRfqs(data.data);
      else toast.error(data.error || "Failed to load RFQs");
    } catch { toast.error("Failed to load RFQs"); }
    finally { setLoading(false); }
  }, [apiFetch]);

  useEffect(() => { fetchRfqs(); }, [fetchRfqs]);

  const filtered = rfqs.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.rfqNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isAdmin = user?.role === "ADMIN" || user?.role === "PROCUREMENT_OFFICER";
  const tabs = isAdmin ? ["ALL", "DRAFT", "PUBLISHED", "CLOSED"] : ["ALL", "PUBLISHED", "CLOSED"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requests for Quotation"
        subtitle="Manage procurement requests and select winning quotations"
        action={isAdmin ? (
          <button onClick={onCreateNew}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm">
            <Plus className="h-4 w-4" /> Create RFQ
          </button>
        ) : undefined}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by number or title…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 outline-none shadow-sm transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setStatusFilter(tab)}
              className={cn("px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all",
                statusFilter === tab ? "bg-primary text-white border-primary shadow-sm" : "bg-card text-muted-foreground border-border hover:bg-accent")}>
              {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
          <button onClick={fetchRfqs} className="px-3.5 py-2 rounded-xl text-xs font-semibold border bg-card text-muted-foreground border-border hover:bg-accent transition-all">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">RFQ Number</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Deadline</th>
                  <th className="px-6 py-4">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-14 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />No RFQs found
                  </td></tr>
                ) : filtered.map(rfq => (
                  <tr key={rfq.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary">{rfq.rfqNumber}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{rfq.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{rfq.category || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", STATUS_STYLES[rfq.status])}>
                        {rfq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{rfq.items?.length ?? 0} items</td>
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
export const RFQs: React.FC = () => {
  const [view, setView] = useState<"list" | "create">("list");
  return view === "create"
    ? <CreateRFQForm onBack={() => setView("list")} onSaved={() => setView("list")} />
    : <RFQListView onCreateNew={() => setView("create")} />;
};
