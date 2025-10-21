"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useMemo, useState, useRef } from "react";
import { watchAuth } from "@/lib/auth";
import { getFirebase } from "@/lib/firebase";
import { ensureDemoData } from "@/lib/demo";
import { listAccounts, listFixedExpenses, createFixedExpense, createTransaction, deleteFixedExpense } from "@/lib/repository";
import type { Account, FixedExpense } from "@/types/finance";
import { Plus, Save, Calendar, Receipt, Check, Circle, Trash2, CheckCircle2 } from "lucide-react";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ExplorePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [items, setItems] = useState<FixedExpense[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  // form para novo template
  const [newName, setNewName] = useState("");
  const [newDueDay, setNewDueDay] = useState<number | "">("");
  const [newDefaultAmount, setNewDefaultAmount] = useState<string>("");

  // valores por item (entradas deste mês)
  const [amountById, setAmountById] = useState<Record<string, string>>({});
  const [dueById, setDueById] = useState<Record<string, string>>({}); // yyyy-MM-dd
  const [selectedById, setSelectedById] = useState<Record<string, boolean>>({});

  // feedback de sucesso ao salvar selecionados
  const [saveToast, setSaveToast] = useState<{ count: number; totalCents: number } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const { isConfigured } = getFirebase();
    (async () => {
      if (!isConfigured) {
        await ensureDemoData();
        const [a, f] = await Promise.all([listAccounts(), listFixedExpenses()]);
        setAccounts(a);
        setItems(sortItems(f));
        if (a[0]?.id) setSelectedAccountId(a[0].id);
        seedDefaults(f);
      }
    })();

    const unsub = watchAuth(async (user) => {
      const u = user?.uid || null;
      setUid(u);
      if (u) {
        const [a, f] = await Promise.all([listAccounts(u), listFixedExpenses(u)]);
        setAccounts(a);
        setItems(sortItems(f));
        if (!selectedAccountId && a[0]?.id) setSelectedAccountId(a[0].id);
        seedDefaults(f);
      } else if (isConfigured) {
        setAccounts([]);
        setItems([]);
      }
    });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  function sortItems(list: FixedExpense[]) {
    return [...list].sort((x, y) => {
      const dx = x.defaultDueDay ?? 99;
      const dy = y.defaultDueDay ?? 99;
      if (dx !== dy) return dx - dy;
      return x.name.localeCompare(y.name);
    });
  }

  function seedDefaults(list: FixedExpense[]) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const newDue: Record<string, string> = {};
    const newSel: Record<string, boolean> = {};
    const newAmt: Record<string, string> = {};

    const pad = (n: number) => String(n).padStart(2, "0");

    for (const it of list) {
      const d = it.defaultDueDay ?? today.getDate();
      const safeDay = Math.min(d, 28); // evita meses curtos
      // Monta yyyy-mm-dd em horário local (sem toISOString/UTC)
      const yyyy = y;
      const mm = pad(m + 1);
      const dd = pad(safeDay);
      newDue[it.id] = `${yyyy}-${mm}-${dd}`;
      if (typeof it.defaultAmountCents === "number") {
        newAmt[it.id] = (it.defaultAmountCents / 100).toFixed(2);
        newSel[it.id] = true;
      }
    }
    setDueById((prev) => ({ ...newDue, ...prev }));
    setAmountById((prev) => ({ ...newAmt, ...prev }));
    setSelectedById((prev) => ({ ...newSel, ...prev }));
  }

  const selectedCount = useMemo(() => Object.values(selectedById).filter(Boolean).length, [selectedById]);

  const totalSelecionado = useMemo(() => {
    let total = 0;
    for (const it of items) {
      if (!selectedById[it.id]) continue;
      const raw = amountById[it.id];
      if (!raw) continue;
      const num = Number(raw.replace(",", "."));
      if (!isNaN(num)) total += Math.round(num * 100);
    }
    return total;
  }, [items, amountById, selectedById]);

  async function handleAddTemplate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const now = Date.now();
    const defAmountCents = newDefaultAmount ? Math.round(Number(newDefaultAmount.replace(",", ".")) * 100) : undefined;
    const created = await createFixedExpense({
      name,
      defaultDueDay: newDueDay ? Number(newDueDay) : undefined,
      defaultAmountCents: defAmountCents,
      createdAt: now,
      updatedAt: now,
      userId: uid || undefined,
    });
    const sorted = sortItems([created, ...items]);
    setItems(sorted);
    setNewName("");
    setNewDueDay("");
    setNewDefaultAmount("");
    seedDefaults([created]);
  }

  async function handleDelete(id: string) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    if (!window.confirm(`Tem certeza que deseja apagar o gasto fixo "${it.name}"?`)) return;

    await deleteFixedExpense(id);

    // limpar estados relacionados ao item
    setItems((p) => p.filter((x) => x.id !== id));
    setAmountById((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
    setDueById((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
    setSelectedById((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
  }

  function parseLocalDateToMs(raw: string) {
    // raw no formato yyyy-mm-dd -> cria Date no timezone local
    const [yyyy, mm, dd] = raw.split("-").map(Number);
    return new Date(yyyy, (mm || 1) - 1, dd || 1).getTime();
  }

  async function handleRegistrar(id: string) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const raw = amountById[id];
    const rawDate = dueById[id];
    if (!raw || !rawDate || !selectedAccountId) return;

    const amount = Math.round(Number(raw.replace(",", ".")) * 100);
    const due = parseLocalDateToMs(rawDate);
    const now = Date.now();

    await createTransaction({
      accountId: selectedAccountId,
      amountCents: amount,
      category: "Despesa",
      note: it.name,
      date: now,
      dueDate: due,
      status: "scheduled",
      type: "expense",
      createdAt: now,
      updatedAt: now,
      userId: uid || undefined,
    });

    // feedback simples limpando o valor
    setAmountById((p) => ({ ...p, [id]: "" }));
  }

  async function handleSalvarSelecionados() {
    let countSaved = 0;
    let totalSaved = 0;

    for (const it of items) {
      if (!selectedById[it.id]) continue;
      const raw = amountById[it.id];
      const rawDate = dueById[it.id];
      if (!raw || !rawDate || !selectedAccountId) continue;
      const amount = Math.round(Number(raw.replace(",", ".")) * 100);
      const due = parseLocalDateToMs(rawDate);
      const now = Date.now();
      await createTransaction({
        accountId: selectedAccountId,
        amountCents: amount,
        category: "Despesa",
        note: it.name,
        date: now,
        dueDate: due,
        status: "scheduled",
        type: "expense",
        createdAt: now,
        updatedAt: now,
        userId: uid || undefined,
      });
      countSaved += 1;
      totalSaved += amount;
    }

    if (countSaved > 0) {
      setSaveToast({ count: countSaved, totalCents: totalSaved });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setSaveToast(null), 4000);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <div className="max-w-md mx-auto px-4">
        <Navbar />

        {/* Cabeçalho */}
        <div className="mt-3">
          <div className="text-sm text-black/60">Gastos fixos</div>
          <div className="text-2xl font-extrabold">Organize suas contas do mês</div>
        </div>

        {/* Resumo */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white border border-black/5 p-4">
            <div className="text-xs text-black/60 mb-1">Total selecionado</div>
            <div className="text-xl font-bold">{formatBRL(totalSelecionado)}</div>
          </div>
          <div className="rounded-2xl bg-white border border-black/5 p-4">
            <div className="text-xs text-black/60 mb-1">Itens selecionados</div>
            <div className="text-xl font-bold">{selectedCount}</div>
          </div>
        </div>

        {/* Conta alvo */}
        <div className="mt-4 rounded-2xl bg-white p-4 border border-black/5">
          <div className="text-xs text-black/60 mb-1">Conta para lançar</div>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {accounts.length === 0 && (
            <div className="text-xs text-red-600 mt-2">Nenhuma conta encontrada. Crie uma em “+”.</div>
          )}
        </div>

        {/* Adicionar template */}
        <form onSubmit={handleAddTemplate} className="mt-4 rounded-2xl bg-white p-4 border border-black/5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Adicionar gasto fixo</div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            <div className="col-span-3">
              <label className="text-xs text-black/60">Nome</label>
              <input
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Internet, Aluguel..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs text-black/60">Dia</label>
              <input
                type="number"
                min={1}
                max={31}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="10"
                value={newDueDay as any}
                onChange={(e) => setNewDueDay(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-black/60">Valor padrão</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="89,90"
                value={newDefaultAmount}
                onChange={(e) => setNewDefaultAmount(e.target.value)}
              />
            </div>
          </div>
          <button className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black text-white text-sm">
            <Plus size={16} /> Adicionar
          </button>

          {/* Ações em massa (integradas ao formulário) */}
          {items.length > 0 && (
            <div className="mt-4 rounded-2xl border border-black/5 p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="text-black/60">Total selecionado</div>
                <div className="font-semibold">{formatBRL(totalSelecionado)}</div>
              </div>
              <button
                type="button"
                onClick={handleSalvarSelecionados}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white"
                disabled={!selectedCount || !selectedAccountId}
              >
                <Save size={16} /> Salvar selecionados
              </button>
            </div>
          )}
        </form>

        {/* Lista de templates */}
        <div className="mt-4 space-y-3">
          {items.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center text-black/60 border border-black/5">
              Nenhum gasto fixo ainda. Adicione acima.
            </div>
          )}
          {items.map((it) => {
            const amount = amountById[it.id] || "";
            const due = dueById[it.id] || "";
            const selected = !!selectedById[it.id];
            const chip = typeof it.defaultDueDay === "number" ? `Dia ${it.defaultDueDay}` : "Sem dia";
            return (
              <div key={it.id} className="rounded-2xl bg-white p-4 border border-black/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
                      <Receipt size={18} className="text-black/70" />
                    </div>
                    <div>
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-xs text-black/60 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1"><Calendar size={12} /> {chip}</span>
                        {typeof it.defaultAmountCents === "number" && (
                          <span>• {formatBRL(it.defaultAmountCents)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedById((p) => ({ ...p, [it.id]: !selected }))}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center ${selected ? "bg-black text-white border-black" : "border-black/10"}`}
                      title={selected ? "Selecionado" : "Selecionar"}
                    >
                      {selected ? <Check size={16} /> : <Circle size={16} className="text-black/40" />}
                    </button>
                    <button
                      onClick={() => handleDelete(it.id)}
                      className="w-8 h-8 rounded-full border border-red-500/30 text-red-500 flex items-center justify-center"
                      title="Apagar gasto fixo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  <div className="col-span-3">
                    <label className="text-xs text-black/60">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                      value={amount}
                      onChange={(e) => setAmountById((p) => ({ ...p, [it.id]: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs text-black/60">Vencimento</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                      value={due}
                      onChange={(e) => setDueById((p) => ({ ...p, [it.id]: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button
                      onClick={() => handleRegistrar(it.id)}
                      className="w-full h-[38px] inline-flex items-center justify-center rounded-xl bg-black text-white"
                      title="Registrar este mês"
                    >
                      <Save size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ações em massa movidas para o formulário */}

        {saveToast && (
          <div className="fixed left-0 right-0 bottom-20 flex justify-center px-4">
            <div className="max-w-md w-full bg-white shadow-lg border border-black/10 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center">
                <CheckCircle2 size={18} />
              </div>
              <div className="text-sm">
                <div className="font-medium">Salvo com sucesso</div>
                <div className="text-black/60">{saveToast.count} item(s) • {formatBRL(saveToast.totalCents)}</div>
              </div>
              <button
                onClick={() => setSaveToast(null)}
                className="ml-auto text-sm font-medium text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50"
              >
                OK
              </button>
            </div>
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}