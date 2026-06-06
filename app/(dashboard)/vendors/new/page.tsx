import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "Add Vendor" };

export default function NewVendorPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Vendor" description="Create a new vendor record." />
      {/* VendorForm will be rendered here in Phase 3 */}
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Vendor form loading...</p>
      </div>
    </div>
  );
}
