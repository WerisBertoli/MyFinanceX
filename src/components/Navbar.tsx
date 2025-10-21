"use client";
import { Bell, Menu } from "lucide-react";

export default function Navbar({ total }: { total?: number }) {
  const formatted = total !== undefined ? (total / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }) : null;
  return (
    <div className="flex items-center justify-between w-full pt-6">
      <button className="p-2 rounded-full bg-white/80 shadow-sm border border-black/5 text-black">
        <Menu size={20} />
      </button>
      {formatted ? (
        <div className="text-center">
          <div className="text-xs text-black/60">Total Balance</div>
          <div className="text-2xl font-extrabold tracking-tight">{formatted}</div>
        </div>
      ) : (
        <div />
      )}
      <button className="p-2 rounded-full bg-white/80 shadow-sm border border-black/5 text-black">
        <Bell size={20} />
      </button>
    </div>
  );
}