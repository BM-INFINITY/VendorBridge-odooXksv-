import { getVendors } from "@/lib/actions/vendor.actions";
import { RFQForm } from "@/features/rfqs/RFQForm";

export const metadata = {
  title: "Create RFQ | VendorBridge",
};

export default async function CreateRFQPage() {
  // Fetch active vendors for assignment
  const { vendors } = await getVendors("ACTIVE", 1, 100);

  // Map to the format VendorAssignPicker expects
  const vendorOptions = vendors.map((v) => ({
    id: v.id,
    companyName: v.companyName,
    vendorName: v.vendorName,
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create RFQ</h1>
        <p className="text-slate-500 mt-1">Draft a new request for quotation and assign it to vendors.</p>
      </div>

      <RFQForm vendors={vendorOptions} />
    </div>
  );
}
