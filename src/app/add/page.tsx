"use client";
import Keypad from "@/components/Keypad";
import { listAccounts, createAccount, createTransaction } from "@/lib/repository";
import type { Account } from "@/types/finance";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { watchAuth } from "@/lib/auth";
import { X } from "lucide-react";
import HomePage from "@/app/page";

export default function AddPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [note, setNote] = useState("");
  const [schedule, setSchedule] = useState(false);
  const [dueDate, setDueDate] = useState<string>("");
  const [uid, setUid] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = watchAuth(async (user) => {
      const u = user?.uid || null;
      setUid(u);
      if (!u) {
        router.replace("/login");
        return;
      }
      let a = await listAccounts(u);
      if (a.length === 0) {
        const now = Date.now();
        const def = await createAccount({ name: "Cash", type: "cash", createdAt: now, userId: u || undefined });
        a = [def];
      }
      setAccounts(a);
      setAccountId(a[0]?.id || "");
    });
    return () => unsub?.();
  }, [router]);

  // abre o drawer com pequena defasagem para acionar a transição
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const safeBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(safeBack, 250);
  };

  return (
    <>
      {/* Fundo: Home page por trás do drawer */}
      <div className="min-h-screen bg-[#F6F6F6] pointer-events-none">
        <HomePage />
      </div>

      {/* Overlay do drawer */}
      <div className="fixed inset-0 z-[60]">
        {/* Scrim */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={handleClose}
        />

        {/* Drawer container */}
        <div className="absolute inset-x-0 bottom-0">
          <div className={`mx-auto max-w-md transform transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}>
            <div className="rounded-t-3xl bg-white border-t border-black/10 shadow-2xl">
              <div className="relative pt-3">
                <div className="mx-auto h-1.5 w-10 rounded-full bg-black/20" />
                <button onClick={handleClose} className="absolute right-3 top-2 p-2 rounded-full bg-black/5">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 max-h-[86vh] overflow-y-auto">
              <div className="flex gap-2 mb-3">
                {/* Tipo da transação (grupo despesas/salário) */}
                <select value={type} onChange={(e) => setType(e.target.value as any)} className="px-3 py-2 rounded-full bg-black/5">
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <Keypad
                label={type === "income" ? "Receitas" : "Despesas"}
                note={note}
                onChangeNote={setNote}
                onCalendar={() => {
                  setSchedule((s) => {
                    const next = !s;
                    if (next && !dueDate) {
                      const d = new Date();
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, "0");
                      const dd = String(d.getDate()).padStart(2, "0");
                      setDueDate(`${yyyy}-${mm}-${dd}`);
                    }
                    return next;
                  });
                }}
                onConfirm={async (cents) => {
                  if (!accountId || !uid) return;
                  const now = Date.now();
                  await createTransaction({
                    accountId,
                    amountCents: cents,
                    category: (type === "income" ? "Receita" : "Despesa"),
                    date: now,
                    note,
                    status: schedule ? "scheduled" : "paid",
                    type,
                    createdAt: now,
                    updatedAt: now,
                    userId: uid,
                    ...(schedule && dueDate ? { dueDate: new Date(dueDate).getTime() } : {}),
                  });
                  handleClose();
                }}
              />

              {schedule && (
                <div className="mt-4">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-black/5"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}