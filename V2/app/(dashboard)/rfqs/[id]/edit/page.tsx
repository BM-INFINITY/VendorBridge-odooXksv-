import { notFound, redirect } from "next/navigation";
import { getRFQById } from "@/lib/actions/rfq.actions";
import { getVendors } from "@/lib/actions/vendor.actions";
import { RFQForm } from "@/features/rfqs/RFQForm";

export const metadata = {
  title: "Edit RFQ | VendorBridge",
};

export default async function EditRFQPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [rfq, { vendors }] = await Promise.all([
    getRFQById(id),
    getVendors("ACTIVE", 1, 100),
  ]);

  if (!rfq) {
    notFound();
  }

  if (rfq.status !== "DRAFT") {
    redirect(`/rfqs/${rfq.id}`); // Can only edit draft RFQs
  }

  // Map to the format VendorAssignPicker expects
  const vendorOptions = vendors.map((v) => ({
    id: v.id,
    companyName: v.companyName,
    vendorName: v.vendorName,
  }));

  // Format initialData for the form
  const initialData = {
    id: rfq.id,
    title: rfq.title,
    description: rfq.description || "",
    category: rfq.category || "",
    deadline: rfq.deadline ? rfq.deadline.toISOString() : "",
    items: rfq.items.map((item) => ({
      itemName: item.itemName,
      quantity: Number(item.quantity),
      unit: item.unit || "pcs",
    })),
    vendorIds: rfq.vendors.map((v) => v.vendorId),
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Edit Draft RFQ</h1>
        <p className="text-slate-500 mt-1">Make changes to your request before publishing.</p>
      </div>

      <RFQForm vendors={vendorOptions} initialData={initialData} />
    </div>
  );
}
