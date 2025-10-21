"use client";
import Navbar from "@/components/Navbar";
import { ensureDemoData } from "@/lib/demo";
import { listAccounts, listTransactions } from "@/lib/repository";
import type { Account } from "@/types/finance";
import type { Transaction } from "@/types/finance";
import { useEffect, useMemo, useState } from "react";
import { watchAuth } from "@/lib/auth";
import { getFirebase } from "@/lib/firebase";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);

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

    const unsub = watchAuth(async (user) => {
      if (user?.uid) {
        const [a, t] = await Promise.all([listAccounts(user.uid), listTransactions(user.uid)]);
        setAccounts(a);
        setTxs(t);
      } else {
        setAccounts([]);
        setTxs([]);
      }
    });
    return () => unsub?.();
  }, []);

  const nameById = useMemo(() => Object.fromEntries(accounts.map(a => [a.id, a.name])), [accounts]);
  const paidTxs = useMemo(() => txs.filter((t) => t.status === "paid"), [txs]);
  const total = useMemo(() => paidTxs.reduce((s, t) => s + (t.type === "income" ? t.amountCents : -t.amountCents), 0), [paidTxs]);

  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <div className="max-w-md mx-auto px-4">
        <Navbar total={total} />

        <div className="mt-4 rounded-3xl bg-white p-2 border border-black/5">
          {paidTxs.length === 0 && (
            <div className="p-6 text-center text-black/60">Nenhuma transação paga ainda</div>
          )}
          {paidTxs.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 border-b last:border-b-0 border-black/5">
              <div>
                <div className="text-sm font-medium">{t.note?.trim() || (t.type === "income" ? "Receita" : "Despesa")}</div>
                <div className="text-xs text-black/60">{new Date(t.date).toLocaleDateString("pt-BR")}</div>
              </div>
              <div className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                {t.type === "income" ? "+" : "-"}{formatBRL(t.amountCents)} {t.type === "income" ? "receita" : "despesa"}
              </div>
            </div>
          ))}
        </div>

        <div className="h-24" />
      </div>
    </div>
  );
}