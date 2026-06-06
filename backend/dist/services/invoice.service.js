"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoice = generateInvoice;
const db_1 = require("../db");
const activity_service_1 = require("./activity.service");
const utils_1 = require("../utils");
async function generateInvoice(poId, userId) {
    // Check if invoice already exists for this PO
    const existingInvoice = await db_1.db.invoice.findUnique({ where: { poId } });
    if (existingInvoice) {
        return { success: true, data: { id: existingInvoice.id } };
    }
    // Load PO with items
    const po = await db_1.db.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true, vendor: true },
    });
    if (!po)
        return { success: false, error: "Purchase Order not found." };
    // Calculate financials
    const subtotal = po.items.reduce((sum, item) => {
        const itemSubtotal = Number(item.unitPrice) * Number(item.quantity);
        return sum + itemSubtotal;
    }, 0);
    const taxAmount = po.items.reduce((sum, item) => {
        const itemSubtotal = Number(item.unitPrice) * Number(item.quantity);
        return sum + (itemSubtotal * Number(item.taxPercentage)) / 100;
    }, 0);
    const grandTotal = subtotal + taxAmount;
    // Generate invoice number
    const invoiceCount = await db_1.db.invoice.count();
    const invoiceNumber = (0, utils_1.generateDocumentNumber)("INV", invoiceCount);
    const invoice = await db_1.db.invoice.create({
        data: {
            invoiceNumber,
            poId,
            vendorId: po.vendorId,
            subtotal,
            taxAmount,
            grandTotal,
            status: "GENERATED",
            issuedAt: new Date(),
        },
    });
    await (0, activity_service_1.logActivity)({
        userId,
        action: "INVOICE_GENERATED",
        module: "INVOICE",
        entityId: invoice.id,
        metadata: { invoiceNumber: invoice.invoiceNumber, grandTotal, poId },
    });
    return { success: true, data: { id: invoice.id } };
}
