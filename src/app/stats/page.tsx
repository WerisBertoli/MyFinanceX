"use client";
import Navbar from "@/components/Navbar";
import BarChart from "@/components/BarChart";
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

export default function StatsPage() {
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

  const chartData = useMemo(() => {
    const days = ["1","5","10","15","20","25","30"];
    const expensesBySlot = days.map((_, idx) => expenses.filter(t => t.date % 7 === idx).reduce((s, t) => s + t.amountCents, 0));
    const max = Math.max(1, ...expensesBySlot);
    return days.map((d, i) => ({ day: d, value: Math.round((expensesBySlot[i] / max) * 100) }));
  }, [expenses]);

  const now = Date.now();
  const dayStart = new Date(new Date().setHours(0,0,0,0)).getTime();
  const weekStart = dayStart - 6 * 24 * 60 * 60 * 1000;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  const dayTotal = expenses.filter(t => t.date >= dayStart).reduce((s,t)=>s+t.amountCents,0);
  const weekTotal = expenses.filter(t => t.date >= weekStart).reduce((s,t)=>s+t.amountCents,0);
  const monthTotal = expenses.filter(t => t.date >= monthStart).reduce((s,t)=>s+t.amountCents,0);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    expenses.forEach(t => m.set(t.category, (m.get(t.category) || 0) + t.amountCents));
    const arr = Array.from(m.entries()).sort((a,b)=>b[1]-a[1]);
    const sum = arr.reduce((s, [,v])=>s+v, 0) || 1;
    return arr.map(([k,v])=>({ category:k, cents:v, pct: Math.round((v/sum)*100) }));
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

        <div className="mt-4 rounded-3xl bg-white p-4 shadow-sm border border-black/5">
          <BarChart data={chartData} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white p-3 text-center border border-black/5">
            <div className="text-xs text-black/60">Day</div>
            <div className="text-lg font-bold">{formatBRL(dayTotal)}</div>
          </div>
          <div className="rounded-2xl bg-white p-3 text-center border border-black/5">
            <div className="text-xs text-black/60">Week</div>
            <div className="text-lg font-bold">{formatBRL(weekTotal)}</div>
          </div>
          <div className="rounded-2xl bg-white p-3 text-center border border-black/5">
            <div className="text-xs text-black/60">Month</div>
            <div className="text-lg font-bold">{formatBRL(monthTotal)}</div>
          </div>
        </div>

        <div className="mt-4 rounded-3xl bg-white p-2 border border-black/5">
          {byCategory.map((row) => (
            <div key={row.category} className="flex items-center justify-between p-3 border-b last:border-b-0 border-black/5">
              <div>
                <div className="text-sm font-medium">{row.category}</div>
                <div className="text-xs text-black/60">{row.pct}%</div>
              </div>
              <div className="text-sm font-semibold">{formatBRL(row.cents)}</div>
            </div>
          ))}
        </div>

        <div className="h-24" />
      </div>
    </div>
  );
}