"use client";
import Keypad from "@/components/Keypad";
import MonthCalendarModal from "@/components/MonthCalendarModal";
import { listAccounts, createAccount, createTransaction, listTransactions } from "@/lib/repository";
import type { Account } from "@/types/finance";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { watchAuth } from "@/lib/auth";
import HomePage from "@/app/page";

export default function AddPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [note, setNote] = useState("");
  const [schedule, setSchedule] = useState(true);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [uid, setUid] = useState<string | null>(null);
  const [scheduledDueDates, setScheduledDueDates] = useState<number[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
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

      // carregar transações agendadas para marcar no calendário
      try {
        const txs = await listTransactions(u);
        const scheduled = txs
          .filter((t) => t.status !== "paid" && typeof t.dueDate === "number")
          .map((t) => Number(t.dueDate));
        setScheduledDueDates(scheduled);
      } catch (err) {
        // ignore: em modo local sem firestore, há fallback para localStorage
      }
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

  // Income deve ser pago por padrão; despesas podem ser agendadas
  useEffect(() => {
    if (type === "income") {
      setSchedule(false);
    }
  }, [type]);

  const safeBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(safeBack, 250);
  };

  // Gesture: arrastar para baixo para fechar
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartY == null) return;
    const dy = e.clientY - dragStartY;
    setDragOffset(Math.max(0, dy));
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    const threshold = 80; // mínimo de arraste para fechar
    if (dragOffset > threshold) {
      setIsDragging(false);
      setDragOffset(0);
      handleClose();
    } else {
      setIsDragging(false);
      setDragOffset(0);
    }
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
          <div
            className={`mx-auto max-w-md transform transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}
            style={isDragging ? { transform: `translateY(${dragOffset}px)` } : undefined}
          >
            <div className="rounded-t-3xl bg-white border-t border-black/10 shadow-2xl">
              <div className="relative pt-3">
                <div
                  className="mx-auto h-1.5 w-10 rounded-full bg-black/20"
                  onPointerDown={onDragStart}
                  onPointerMove={onDragMove}
                  onPointerUp={onDragEnd}
                  onPointerCancel={onDragEnd}
                />
                {/* Botão X removido; fechamento por gesto */}
              </div>
              <div className="p-4 max-h-[86vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                {/* Tipo da transação (grupo despesas/receita) */}
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="h-10 px-3 rounded-full bg-black/5 text-sm w-[130px] flex-none"
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
                {schedule && (
                  <input
                    type="date"
                    value={dueDate}
                    readOnly
                    aria-readonly="true"
                    tabIndex={-1}
                    className="h-10 px-3 rounded-full bg-white text-sm w-[150px] border-0 pointer-events-none appearance-none"
                  />
                )}
              </div>

              <Keypad
                label={type === "income" ? "Receitas" : "Despesas"}
                note={note}
                onChangeNote={setNote}
                onCalendar={() => {
                  // Abre modal do calendário e garante que está em modo agendado
                  setSchedule(true);
                  if (!dueDate) {
                    const d = new Date();
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const dd = String(d.getDate()).padStart(2, "0");
                    setDueDate(`${yyyy}-${mm}-${dd}`);
                  }
                  setCalendarOpen(true);
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

              {/* Modal de calendário para seleção de data e indicação de dias com contas */}
              <MonthCalendarModal
                open={calendarOpen}
                selectedDate={dueDate}
                scheduledDueDates={scheduledDueDates}
                onClose={() => setCalendarOpen(false)}
                onSelectDate={(ymd) => {
                  setSchedule(true);
                  setDueDate(ymd);
                }}
              />

              {/* Data foi movida para o topo ao lado do título */}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}