export type AccountType = "cash" | "card" | "savings";

export type Account = {
  id: string;
  userId?: string;
  name: string;
  type: AccountType;
  color?: string; // hex pastel
  icon?: string; // nome do ícone (lucide)
  createdAt: number; // epoch ms
};

export type TransactionType = "expense" | "income";
export type TransactionStatus = "paid" | "scheduled" | "overdue";

export type Transaction = {
  id: string;
  userId?: string;
  accountId: string;
  type: TransactionType;
  amountCents: number; // sempre em centavos
  category: string;
  note?: string;
  date: number; // quando ocorreu (ou lançamento)
  dueDate?: number; // para agendadas
  status: TransactionStatus;
  createdAt: number;
  updatedAt: number;
  paidAt?: number;
};

export type FixedExpense = {
  id: string;
  userId?: string;
  name: string; // ex.: Internet, Aluguel
  defaultDueDay?: number; // 1..31
  defaultAmountCents?: number; // valor padrão opcional em centavos
  createdAt: number;
  updatedAt: number;
  archived?: boolean;
};

export function computeStatusFromDueDate(status: TransactionStatus, dueDate?: number): TransactionStatus {
  if (status === "paid") return "paid";
  if (dueDate && dueDate < Date.now()) return "overdue";
  return status;
}