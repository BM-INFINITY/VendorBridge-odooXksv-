import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Vendors" };

export default async function VendorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Management"
        description="Manage your vendor records and supplier information."
      >
        <Button asChild>
          <Link href="/vendors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Link>
        </Button>
      </PageHeader>
      {/* VendorTable will be rendered here in Phase 3 */}
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Vendor table loading...</p>
      </div>
    </div>
  );
}
