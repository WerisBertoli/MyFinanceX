"use client";
import Navbar from "@/components/Navbar";
import { ensureDemoData } from "@/lib/demo";
import { listAccounts, listTransactions } from "@/lib/repository";
import type { Account } from "@/types/finance";
import { Transaction } from "@/types/finance";
import { useEffect, useMemo, useState } from "react";
import { watchAuth } from "@/lib/auth";
import { getFirebase } from "@/lib/firebase";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function GridPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [uid, setUid] = useState<string | null>(null);

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
      setUid(user?.uid || null);
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

  const expenses = useMemo(() => txs.filter(t => t.type === "expense"), [txs]);
  const totalExpenses = expenses.reduce((s, t) => s + t.amountCents, 0);
  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    expenses.forEach(t => m.set(t.category, (m.get(t.category) || 0) + t.amountCents));
    return Array.from(m.entries()).sort((a,b)=>b[1]-a[1]);
  }, [expenses]);

  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <div className="max-w-md mx-auto px-4">
        <Navbar total={total} />

        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium">Expenses</button>
          <button className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium border border-black/10">Income</button>
          <button className="px-3 py-2 rounded-full bg-white text-black text-sm font-medium border border-black/10">Jun</button>
        </div>

        <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm border border-black/5">
          <div className="w-full grid place-items-center">
            <div className="relative w-44 h-44 rounded-full border-[14px] border-black/10">
              <div className="absolute inset-3 rounded-full bg-white grid place-items-center">
                <div className="text-2xl font-bold">{formatBRL(totalExpenses)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {byCategory.slice(0,6).map(([cat, cents], i) => {
            const colors = ["#FCE5DF","#E9F0FF","#FFF4C7","#D6F6E5","#F0E6FF","#FFE8C8"];
            const bg = colors[i % colors.length];
            return (
              <div key={cat} className="rounded-3xl p-4" style={{ backgroundColor: bg }}>
                <div className="text-sm text-black/70">{cat}</div>
                <div className="mt-2 text-xl font-bold">{formatBRL(cents)}</div>
              </div>
            );
          })}
        </div>

        <div className="h-24" />
      </div>
    </div>
  );
}