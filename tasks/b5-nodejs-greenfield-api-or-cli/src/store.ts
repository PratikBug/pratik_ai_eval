import { formatMoney } from "./money.js";
import type { TransactionCreate, TransactionResponse } from "./schemas.js";

interface TransactionRecord {
  id: number;
  amount: string;
  type: "credit" | "debit";
  description?: string;
}

class TransactionStore {
  private records: TransactionRecord[] = [];
  private nextId = 1;

  reset(): void {
    this.records = [];
    this.nextId = 1;
  }

  create(payload: TransactionCreate): TransactionResponse {
    const record: TransactionRecord = {
      id: this.nextId,
      amount: payload.amount,
      type: payload.type,
      description: payload.description,
    };
    this.nextId += 1;
    this.records.push(record);
    return { ...record };
  }

  listAll(): TransactionResponse[] {
    return this.records.map((record) => ({ ...record }));
  }

  balance(): string {
    const total = this.records.reduce((sum, record) => {
      const amount = Number(record.amount);
      return record.type === "credit" ? sum + amount : sum - amount;
    }, 0);
    return formatMoney(total);
  }
}

export const store = new TransactionStore();

export function resetStore(): void {
  store.reset();
}
