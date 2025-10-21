"use client";
import Navbar from "@/components/Navbar";
import AccountCard from "@/components/AccountCard";
import ScheduledList from "@/components/ScheduledList";
import { ensureDemoData } from "@/lib/demo";
import { listAccounts, listTransactions, markTransactionPaid, markTransactionUnpaid } from "@/lib/repository";
import type { Account } from "@/types/finance";
import { Transaction } from "@/types/finance";
import { useEffect, useMemo, useRef, useState } from "react";
import { watchAuth } from "@/lib/auth";
import { getFirebase } from "@/lib/firebase";
import { DollarSign } from "lucide-react";

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  const undoTimeoutRef = useRef<number | null>(null);
  const [undoTx, setUndoTx] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    const { isConfigured } = getFirebase();
    (async () => {
      if (!isConfigured) {
        await ensureDemoData();
        const [a, t] = await Promise.all([listAccounts(), listTransactions()]);
        setAccounts(a);
        setTxs(t);
      }
    })();

    const unsubscribe = watchAuth(async (user) => {
      setUid(user?.uid || null);
      if (user?.uid) {
        const [a, t] = await Promise.all([
          listAccounts(user.uid),
          listTransactions(user.uid),
        ]);
        setAccounts(a);
        setTxs(t);
      } else {
        setAccounts([]);
        setTxs([]);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
        undoTimeoutRef.current = null;
      }
    };
  }, []);

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) map.set(a.id, 0);
    txs.forEach((t) => {
      const sign = t.type === "income" ? 1 : -1;
      map.set(t.accountId, (map.get(t.accountId) || 0) + sign * t.amountCents);
    });
    return map;
  }, [accounts, txs]);

  const total = Array.from(balances.values()).reduce((s, v) => s + v, 0);

  const formattedTotal = (total / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Totais pagos por tipo
  const paidTxs = useMemo(() => txs.filter((t) => t.status === "paid"), [txs]);
  const incomeTotalCents = useMemo(() => paidTxs.filter(t => t.type === "income").reduce((s,t)=>s+t.amountCents, 0), [paidTxs]);
  const expenseTotalCents = useMemo(() => paidTxs.filter(t => t.type === "expense").reduce((s,t)=>s+t.amountCents, 0), [paidTxs]);

  const todayLabel = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  // despesas agendadas para o mês atual (tolerante a timezone/UTC)
  const monthScheduled = useMemo(() => {
    const now = new Date();
    const yLocal = now.getFullYear();
    const mLocal = now.getMonth();
    return txs.filter((t) => {
      if (t.type !== "expense" || t.status !== "scheduled" || typeof t.dueDate !== "number") return false;
      const d = new Date(t.dueDate);
      const sameLocal = d.getFullYear() === yLocal && d.getMonth() === mLocal;
      const sameUTC = d.getUTCFullYear() === yLocal && d.getUTCMonth() === mLocal;
      return sameLocal || sameUTC;
    });
  }, [txs]);

  function formatBRL(cents: number) {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  async function handleMarkPaid(id: string) {
    await markTransactionPaid(id);
    setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, status: "paid", paidAt: Date.now(), date: Date.now(), updatedAt: Date.now() } : t)));
    const tx = txs.find((t) => t.id === id);
    const label = tx ? `${(tx.note?.trim() || tx.category)} • ${formatBRL(tx.amountCents)}` : "Despesa";
    setUndoTx({ id, label });
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    undoTimeoutRef.current = window.setTimeout(() => {
      setUndoTx(null);
      undoTimeoutRef.current = null;
    }, 5000);
  }

  async function handleUndo() {
    if (!undoTx) return;
    const id = undoTx.id;
    await markTransactionUnpaid(id);
    setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, status: "scheduled", paidAt: undefined } : t)));
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    setUndoTx(null);
  }

  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <div className="max-w-md mx-auto px-4">
        <Navbar />

        <div className="mt-4 text-center">
          <div className="text-xs text-black/50">{todayLabel}</div>
          <div className="text-sm text-black/60">Saldo total</div>
          <div className="text-4xl sm:text-5xl font-medium tracking-tight">
            {formattedTotal}
          </div>
        </div>

        {/* Cards de totais por tipo (modelo dos AccountCard) */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <AccountCard
            account={{ id: "summary-income", name: "Receita", type: "savings", createdAt: 0 }}
            balanceCents={incomeTotalCents}
            bgColor="#D6F6E5"
            iconOverride={DollarSign}
          />
          <AccountCard
            account={{ id: "summary-expense", name: "Despesa", type: "card", createdAt: 0 }}
            balanceCents={-expenseTotalCents}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {accounts
            .filter((a) => a.name?.toLowerCase() !== "cash")
            .map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                balanceCents={balances.get(a.id) || 0}
              />
            ))}
        </div>

        {/* Lista de despesas do mês (agendadas) */}
        <ScheduledList items={monthScheduled} onMarkPaid={handleMarkPaid} />

        {/* Toast de desfazer */}
        {undoTx && (
          <div className="fixed left-0 right-0 bottom-20 flex justify-center px-4">
            <div className="max-w-md w-full bg-white shadow-lg border border-black/10 rounded-2xl p-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">Pagamento marcado</div>
                <div className="text-black/60">{undoTx.label}</div>
              </div>
              <button
                onClick={handleUndo}
                className="text-blue-600 font-medium px-3 py-1 rounded-lg hover:bg-blue-50"
              >
                Desfazer
              </button>
            </div>
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}
