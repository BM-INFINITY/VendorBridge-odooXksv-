// =============================================================================
// VendorBridge — Global TypeScript Type Definitions
// =============================================================================

// Re-export Prisma enums for use in frontend components
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

// -----------------------------------------------------------------------------
// Extended Session User
// Augments the default NextAuth session user with VendorBridge-specific fields.
// -----------------------------------------------------------------------------
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: import("@prisma/client").UserRole;
  firstName: string;
  lastName: string;
}

// -----------------------------------------------------------------------------
// Server Action Response
// Standard response shape for all Server Actions.
// -----------------------------------------------------------------------------
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// -----------------------------------------------------------------------------
// Pagination
// Standard pagination shape for list queries.
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Dashboard KPIs
// -----------------------------------------------------------------------------
export interface DashboardKPIs {
  activeRFQs: number;
  pendingApprovals: number;
  vendorCount: number;
  totalSpend: number;
}

// -----------------------------------------------------------------------------
// Report Types
// -----------------------------------------------------------------------------
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
