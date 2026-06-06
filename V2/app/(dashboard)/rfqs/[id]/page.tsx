import { notFound } from "next/navigation";
import { getRFQById } from "@/lib/actions/rfq.actions";
import { RFQDetailCard } from "@/features/rfqs/RFQDetailCard";

export const metadata = {
  title: "RFQ Details | VendorBridge",
};

export default async function RFQDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rfq = await getRFQById(id);

  if (!rfq) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <RFQDetailCard rfq={rfq} />
    </div>
  );
}
