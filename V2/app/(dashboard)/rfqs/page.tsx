import { getRFQs } from "@/lib/actions/rfq.actions";
import { RFQTable } from "@/features/rfqs/RFQTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "RFQs | VendorBridge",
};

export default async function RFQsPage() {
  const rfqs = await getRFQs();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Request for Quotations</h1>
          <p className="text-slate-500 mt-1">Manage and track your procurement requests.</p>
        </div>
        <Link href="/rfqs/new">
          <Button className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create RFQ
          </Button>
        </Link>
      </div>

      <RFQTable rfqs={rfqs} />
    </div>
  );
}
