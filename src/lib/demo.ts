import { createAccount, createTransaction, listAccounts, listTransactions } from "./repository";
import type { Account } from "@/types/finance";

export async function ensureDemoData() {
  // só atua em fallback local (quando firebase não configurado)
  const accounts = await listAccounts();
  if (accounts.length === 0) {
    const now = Date.now();
    const base: Omit<Account, "id">[] = [
      { name: "Card", type: "card", createdAt: now },
      { name: "Cash", type: "cash", createdAt: now },
      { name: "Savings", type: "savings", createdAt: now },
    ];
    const created = await Promise.all(base.map((a) => createAccount(a)));
    const [card, cash] = created;
    // Despesas agendadas
    await createTransaction({
      accountId: card.id,
      amountCents: 2831000, // 28,310.00
      category: "Fatura Cartão",
      date: now,
      dueDate: new Date().setDate(10),
      note: "Vencimento do cartão",
      status: "scheduled",
      type: "expense",
      createdAt: now,
      updatedAt: now,
    });
    await createTransaction({
      accountId: cash.id,
      amountCents: 264000, // 2,640.00
      category: "Dinheiro em caixa",
      date: now,
      status: "paid",
      type: "income",
      createdAt: now,
      updatedAt: now,
    });
  }
  const txs = await listTransactions();
  return { accounts: await listAccounts(), txs };
}