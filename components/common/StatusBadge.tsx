import { cn } from "@/lib/utils";
import type {
  RFQStatus,
  QuotationStatus,
  ApprovalStatus,
  POStatus,
  InvoiceStatus,
  VendorStatus,
} from "@prisma/client";

type AnyStatus =
  | RFQStatus
  | QuotationStatus
  | ApprovalStatus
  | POStatus
  | InvoiceStatus
  | VendorStatus;

// Maps each status enum value to Tailwind color classes
const statusStyles: Record<string, string> = {
  // RFQStatus
  DRAFT: "bg-gray-100 text-gray-700",
  PUBLISHED: "bg-blue-100 text-blue-700",
  CLOSED: "bg-gray-100 text-gray-500",

  // QuotationStatus
  SUBMITTED: "bg-yellow-100 text-yellow-700",
  SELECTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",

  // ApprovalStatus
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  // REJECTED already defined

  // POStatus
  ISSUED: "bg-blue-100 text-blue-700",
  ACKNOWLEDGED: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",

  // InvoiceStatus
  GENERATED: "bg-blue-100 text-blue-700",
  SENT: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",

  // VendorStatus
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
  SUBMITTED: "Submitted",
  SELECTED: "Selected",
  REJECTED: "Rejected",
  PENDING: "Pending",
  APPROVED: "Approved",
  ISSUED: "Issued",
  ACKNOWLEDGED: "Acknowledged",
  COMPLETED: "Completed",
  GENERATED: "Generated",
  SENT: "Sent",
  PAID: "Paid",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

// Converts any Prisma enum status to a color-coded badge.
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = statusStyles[status] ?? "bg-gray-100 text-gray-700";
  const label = statusLabels[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles,
        className
      )}
    >
      {label}
    </span>
  );
}
