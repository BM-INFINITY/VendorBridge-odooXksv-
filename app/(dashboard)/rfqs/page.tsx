import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "RFQs" };

export default async function RFQsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Request for Quotations"
        description="Create and manage procurement requests."
      >
        <Button asChild>
          <Link href="/rfqs/new">
            <Plus className="mr-2 h-4 w-4" />
            Create RFQ
          </Link>
        </Button>
      </PageHeader>
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">RFQ table loading...</p>
      </div>
    </div>
  );
}
