import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// -----------------------------------------------------------------------------
// cn — Tailwind Class Merger
// Combines clsx and tailwind-merge for conditional + deduped class strings.
// -----------------------------------------------------------------------------
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// -----------------------------------------------------------------------------
// formatCurrency
// Format a number as a currency string.
// -----------------------------------------------------------------------------
export function formatCurrency(
  amount: number | string,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// -----------------------------------------------------------------------------
// formatDate
// Format a Date object or ISO string to a readable date string.
// -----------------------------------------------------------------------------
export function formatDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

// -----------------------------------------------------------------------------
// formatDateTime
// Format a Date object or ISO string to a readable date-time string.
// -----------------------------------------------------------------------------
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// -----------------------------------------------------------------------------
// generateDocumentNumber
// Generate sequential document numbers like RFQ-2026-0001.
// Actual uniqueness is enforced by the database (unique constraint).
// -----------------------------------------------------------------------------
export function generateDocumentNumber(
  prefix: string,
  count: number
): string {
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(4, "0");
  return `${prefix}-${year}-${sequence}`;
}

// -----------------------------------------------------------------------------
// truncate
// Truncate a string to a maximum length with an ellipsis.
// -----------------------------------------------------------------------------
export function truncate(str: string, maxLength: number = 50): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

// -----------------------------------------------------------------------------
// calculateTax
// Calculate tax amount from a subtotal and tax percentage.
// -----------------------------------------------------------------------------
export function calculateTax(subtotal: number, taxPercentage: number): number {
  return (subtotal * taxPercentage) / 100;
}

// -----------------------------------------------------------------------------
// calculateTotal
// Calculate total amount including tax.
// -----------------------------------------------------------------------------
export function calculateTotal(subtotal: number, taxPercentage: number): number {
  return subtotal + calculateTax(subtotal, taxPercentage);
}

// -----------------------------------------------------------------------------
// getInitials
// Extract initials from a full name string.
// -----------------------------------------------------------------------------
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
