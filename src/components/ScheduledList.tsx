"use client";
import { Calendar, CheckCircle2 } from "lucide-react";
import type { Transaction } from "@/types/finance";

export default function ScheduledList({ items, onMarkPaid }: { items: Transaction[]; onMarkPaid?: (id: string) => void; }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4 w-full">
      <div className="text-sm text-black/60 mb-2">Contas pendentes</div>
      <div className="space-y-2">
        {[...items]
          .sort((a, b) => {
            const ad = typeof a.dueDate === "number" ? a.dueDate : Number.POSITIVE_INFINITY;
            const bd = typeof b.dueDate === "number" ? b.dueDate : Number.POSITIVE_INFINITY;
            if (ad !== bd) return ad - bd;
            const aLabel = (a.note?.trim() || a.category);
            const bLabel = (b.note?.trim() || b.category);
            return aLabel.localeCompare(bLabel);
          })
          .map((t) => {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const isOverdue = typeof t.dueDate === "number" && t.dueDate < todayStart.getTime();
          const amount = (t.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
          const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString("pt-BR") : "";
          return (
            <div key={t.id} className="flex items-center justify-between rounded-2xl p-3 bg-white shadow-sm border border-black/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOverdue ? "bg-red-50" : "bg-emerald-50"}`}>
                  <Calendar className={isOverdue ? "text-red-600" : "text-emerald-600"} size={20} />
                </div>
                <div>
                  <div className="font-medium">{t.note?.trim() || t.category}</div>
                  <div className="text-xs text-black/60">Vence em {due}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`font-semibold ${isOverdue ? "text-red-600" : ""}`}>{amount}</div>
                {onMarkPaid && (
                  <button onClick={() => onMarkPaid(t.id)} className="ml-2 p-2 rounded-full bg-black text-white">
                    <CheckCircle2 size={18} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}