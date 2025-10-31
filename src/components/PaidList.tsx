"use client";
import { CheckCircle2 } from "lucide-react";
import type { Transaction } from "@/types/finance";

export default function PaidList({ items }: { items: Transaction[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-6 w-full">
      <div className="text-sm text-black/60 mb-2">Contas pagas</div>
      <div className="space-y-2">
        {[...items]
          .sort((a, b) => {
            const ad = typeof a.paidAt === "number" ? a.paidAt : 0;
            const bd = typeof b.paidAt === "number" ? b.paidAt : 0;
            if (ad !== bd) return bd - ad; // mais recentes primeiro
            const aLabel = (a.note?.trim() || a.category);
            const bLabel = (b.note?.trim() || b.category);
            return aLabel.localeCompare(bLabel);
          })
          .map((t) => {
            const amount = (t.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            const paidLabel = t.paidAt ? new Date(t.paidAt).toLocaleDateString("pt-BR") : new Date(t.date).toLocaleDateString("pt-BR");
            return (
              <div key={t.id} className="flex items-center justify-between rounded-2xl p-3 bg-white shadow-sm border border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50">
                    <CheckCircle2 className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <div className="font-medium">{t.note?.trim() || t.category}</div>
                    <div className="text-xs text-black/60">Pago em {paidLabel}</div>
                  </div>
                </div>
                <div className="font-semibold">{amount}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}