import { Badge } from "@/components/ui/badge";

export function RFQStatusBadge({ status }: { status: string }) {
  let color = "bg-slate-100 text-slate-700";
  let label = status;

  switch (status) {
    case "DRAFT":
      color = "bg-slate-100 text-slate-700 hover:bg-slate-200";
      label = "Draft";
      break;
    case "PUBLISHED":
      color = "bg-blue-100 text-blue-700 hover:bg-blue-200";
      label = "Published";
      break;
    case "CLOSED":
      color = "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
      label = "Closed";
      break;
  }

  return <Badge className={`font-medium shadow-none ${color}`}>{label}</Badge>;
}
