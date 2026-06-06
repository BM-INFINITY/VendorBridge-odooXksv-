"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.generateDocumentNumber = generateDocumentNumber;
exports.truncate = truncate;
exports.calculateTax = calculateTax;
exports.calculateTotal = calculateTotal;
exports.getInitials = getInitials;
// -----------------------------------------------------------------------------
// formatCurrency
// Format a number as a currency string.
// -----------------------------------------------------------------------------
function formatCurrency(amount, currency = "USD", locale = "en-US") {
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
function formatDate(date, options) {
    if (!date)
        return "—";
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
function formatDateTime(date) {
    if (!date)
        return "—";
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
function generateDocumentNumber(prefix, count) {
    const year = new Date().getFullYear();
    const sequence = String(count + 1).padStart(4, "0");
    return `${prefix}-${year}-${sequence}`;
}
// -----------------------------------------------------------------------------
// truncate
// Truncate a string to a maximum length with an ellipsis.
// -----------------------------------------------------------------------------
function truncate(str, maxLength = 50) {
    if (str.length <= maxLength)
        return str;
    return `${str.slice(0, maxLength)}...`;
}
// -----------------------------------------------------------------------------
// calculateTax
// Calculate tax amount from a subtotal and tax percentage.
// -----------------------------------------------------------------------------
function calculateTax(subtotal, taxPercentage) {
    return (subtotal * taxPercentage) / 100;
}
// -----------------------------------------------------------------------------
// calculateTotal
// Calculate total amount including tax.
// -----------------------------------------------------------------------------
function calculateTotal(subtotal, taxPercentage) {
    return subtotal + calculateTax(subtotal, taxPercentage);
}
// -----------------------------------------------------------------------------
// getInitials
// Extract initials from a full name string.
// -----------------------------------------------------------------------------
function getInitials(name) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}
