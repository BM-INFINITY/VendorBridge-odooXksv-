import { z } from "zod";

export const vendorSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required").max(100),
  companyName: z.string().min(1, "Company name is required").max(150),
  contactPerson: z.string().min(1, "Contact person is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type VendorInput = z.infer<typeof vendorSchema>;
