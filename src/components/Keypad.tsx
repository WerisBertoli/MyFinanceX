"use client";
import { Delete, Calendar, Check } from "lucide-react";
import { useState } from "react";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Props = {
  label?: string;
  note?: string;
  onChangeNote?: (value: string) => void;
  onConfirm?: (cents: number) => void;
  onCalendar?: () => void;
};

export default function Keypad({ label, note, onChangeNote, onConfirm, onCalendar }: Props) {
  const [value, setValue] = useState<string>("");

  const append = (d: string) => setValue((prev) => (prev + d).replace(/^0+/, ""));
  const backspace = () => setValue((prev) => prev.slice(0, -1));

  const cents = Number((value || "0").replace(/\D/g, ""));
  const display = formatBRL(cents);
  const isZero = cents === 0;

  const Key = ({ k }: { k: string }) => (
    <button
      onClick={() => {
        if (k === "$" || k === ",") return; // apenas visual
        append(k);
      }}
      className="h-14 rounded-2xl bg-black/[0.04] hover:bg-black/[0.06] flex items-center justify-center"
    >
      <span className="text-lg font-medium">{k}</span>
    </button>
  );

  return (
    <div className="w-full">
      {label && <div className="text-center text-xs text-black/50">{label}</div>}
      <div className={`text-center text-4xl font-extrabold mt-1 ${isZero ? "text-black/30" : ""}`}>{display}</div>
      {onChangeNote && (
        <input
          value={note || ""}
          onChange={(e) => onChangeNote(e.target.value)}
          placeholder="Adicionar comentário..."
          className="mt-3 w-full h-10 px-4 rounded-2xl bg-black/5 text-sm placeholder:text-black/40"
        />
      )}

      <div className="grid grid-cols-4 grid-rows-4 gap-3 mt-4">
        {/* Row 1 */}
        <Key k="1" />
        <Key k="2" />
        <Key k="3" />
        <button onClick={backspace} className="h-14 rounded-2xl bg-rose-100 flex items-center justify-center col-start-4 row-start-1">
          <Delete className="text-black/70" size={20} />
        </button>

        {/* Row 2 */}
        <Key k="4" />
        <Key k="5" />
        <Key k="6" />
        <button onClick={() => onCalendar?.()} className="h-14 rounded-2xl bg-blue-100 flex items-center justify-center col-start-4 row-start-2">
          <Calendar className="text-black/70" size={20} />
        </button>

        {/* Row 3 */}
        <Key k="7" />
        <Key k="8" />
        <Key k="9" />
        {/* Confirm button (spans two rows) */}
        <button
          onClick={() => onConfirm?.(cents)}
          className="row-span-2 col-start-4 row-start-3 rounded-3xl bg-black text-white flex items-center justify-center"
        >
          <Check size={20} />
        </button>

        {/* Row 4 */}
        <Key k="$" />
        <Key k="0" />
        <Key k="," />
      </div>
    </div>
  );
}