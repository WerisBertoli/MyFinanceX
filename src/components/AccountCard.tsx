"use client";
import { CreditCard, PiggyBank, Wallet } from "lucide-react";
import type { Account } from "@/types/finance";

const TypeIcon: Record<string, any> = {
  card: CreditCard,
  cash: Wallet,
  savings: PiggyBank,
};

export default function AccountCard({ account, balanceCents, bgColor, iconOverride }: { account: Account; balanceCents: number; bgColor?: string; iconOverride?: any; }) {
  const Icon = iconOverride ?? (TypeIcon[account.type] ?? Wallet);
  const amount = (balanceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const bg = bgColor ?? (account.type === "card" ? "#FCE5DF" : account.type === "cash" ? "#E9F0FF" : "#FFF4C7");
  return (
    <div className="rounded-3xl p-5 w-full h-[140px] flex flex-col justify-between" style={{ backgroundColor: bg }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
          <Icon className="text-black/70" size={20} />
        </div>
        <div className="text-black/60 text-sm font-medium">{account.name}</div>
      </div>
      <div className="text-2xl font-extrabold">{amount}</div>
    </div>
  );
}