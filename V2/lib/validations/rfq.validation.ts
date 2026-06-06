import { z } from "zod";

export const rfqItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().optional(),
});

export const rfqSchema = z.object({
  title: z.string().min(1, "RFQ title is required").max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  deadline: z.coerce.date().optional(),
  vendorIds: z.array(z.string()).min(1, "At least one vendor must be assigned"),
  items: z.array(rfqItemSchema).min(1, "At least one item is required"),
});

export type RFQInput = z.infer<typeof rfqSchema>;
export type RFQItemInput = z.infer<typeof rfqItemSchema>;
