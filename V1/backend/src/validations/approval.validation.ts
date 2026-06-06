import { z } from "zod";

export const approvalActionSchema = z.object({
  approvalId: z.string().min(1),
  remarks: z.string().optional(),
});

export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
