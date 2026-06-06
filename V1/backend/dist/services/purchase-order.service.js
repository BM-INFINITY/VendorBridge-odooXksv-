"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePurchaseOrder = generatePurchaseOrder;
const db_1 = require("../db");
const activity_service_1 = require("./activity.service");
const utils_1 = require("../utils");
async function generatePurchaseOrder(approvalId, userId) {
    // Load the approval with nested data
    const approval = await db_1.db.approval.findUnique({
        where: { id: approvalId },
        include: {
            quotation: {
                include: {
                    items: {
                        include: { rfqItem: true },
                    },
                    vendor: true,
                },
            },
            rfq: true,
        },
    });
    if (!approval)
        return { success: false, error: "Approval not found." };
    if (approval.status !== "APPROVED") {
        return { success: false, error: "Cannot generate PO for non-approved request." };
    }
    // Check if PO exists already
    const existingPO = await db_1.db.purchaseOrder.findUnique({
        where: { approvalId },
    });
    if (existingPO)
        return { success: true, data: { id: existingPO.id } };
    // Generate PO number
    const poCount = await db_1.db.purchaseOrder.count();
    const poNumber = (0, utils_1.generateDocumentNumber)("PO", poCount);
    const po = await db_1.db.purchaseOrder.create({
        data: {
            poNumber,
            approvalId,
            vendorId: approval.quotation.vendorId,
            rfqId: approval.rfqId,
            status: "ISSUED",
            issueDate: new Date(),
            createdById: userId,
            items: {
                create: approval.quotation.items.map((item) => ({
                    itemName: item.rfqItem.itemName,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    taxPercentage: Number(item.taxPercentage),
                    totalAmount: Number(item.totalAmount),
                })),
            },
        },
    });
    await (0, activity_service_1.logActivity)({
        userId,
        action: "PO_GENERATED",
        module: "PURCHASE_ORDER",
        entityId: po.id,
        metadata: { poNumber: po.poNumber, approvalId },
    });
    return { success: true, data: { id: po.id } };
}
