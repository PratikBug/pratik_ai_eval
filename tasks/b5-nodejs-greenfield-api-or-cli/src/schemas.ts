import { z } from "zod";
import { parseAmount } from "./money.js";

export const transactionCreateSchema = z.object({
  amount: z.union([z.string(), z.number()]).transform((value, ctx) => {
    const parsed = parseAmount(value);
    if (!parsed) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Amount must be greater than 0" });
      return z.NEVER;
    }
    return parsed;
  }),
  type: z.enum(["credit", "debit"]),
  description: z.string().max(200).optional(),
});

export type TransactionCreate = z.infer<typeof transactionCreateSchema>;

export interface TransactionResponse {
  id: number;
  amount: string;
  type: "credit" | "debit";
  description?: string;
}

export interface BalanceResponse {
  balance: string;
  currency: "USD";
}
