import { z } from "zod";

export const quotationItemSchema = z.object({
  rfqItemId: z.string().min(1),
  unitPrice: z.coerce.number().nonnegative("Unit price must be non-negative"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  taxPercentage: z.coerce.number().min(0).max(100).default(0),
});

export const quotationSchema = z.object({
  rfqId: z.string().min(1),
  deliveryTimeline: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
});

export type QuotationInput = z.infer<typeof quotationSchema>;
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;
