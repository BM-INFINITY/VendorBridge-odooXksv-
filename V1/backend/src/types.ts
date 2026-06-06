// =============================================================================
// VendorBridge Backend Types
// =============================================================================

export type {
  UserRole,
  VendorStatus,
  RFQStatus,
  QuotationStatus,
  ApprovalStatus,
  POStatus,
  InvoiceStatus,
  ActivityModule,
} from "@prisma/client";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface DashboardKPIs {
  activeRFQs: number;
  pendingApprovals: number;
  vendorCount: number;
  totalSpend: number;
}

export interface SpendByCategory {
  category: string;
  total: number;
}

export interface TopVendor {
  vendorName: string;
  companyName: string;
  totalSpend: number;
  poCount: number;
}

export interface MonthlySpend {
  month: number;
  total: number;
}
