"use client";
import { useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  open: boolean;
  selectedDate: string; // yyyy-MM-dd
  onClose: () => void;
  onSelectDate: (yyyyMmDd: string) => void;
  scheduledDueDates?: number[]; // epoch ms of due dates to mark
};

function toLocalYMD(ms: number): string {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getMonthLabel(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function MonthCalendarModal({ open, selectedDate, onClose, onSelectDate, scheduledDueDates = [] }: Props) {
  const selected = selectedDate ? new Date(selectedDate) : new Date();
  const [cursor, setCursor] = useState<Date>(new Date(selected.getFullYear(), selected.getMonth(), 1));

  const daysInMonth = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate(), [cursor]);
  const firstWeekday = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay(), [cursor]); // 0..6

  const label = getMonthLabel(cursor.getFullYear(), cursor.getMonth());

  const markedSet = useMemo(() => {
    const s = new Set<string>();
    for (const ms of scheduledDueDates) {
      const d = new Date(ms);
      if (d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth()) {
        s.add(toLocalYMD(ms));
      }
    }
    return s;
  }, [scheduledDueDates, cursor]);

  const weeks: Array<Array<{ day?: number; ymd?: string; marked?: boolean; selected?: boolean }>> = [];
  let currentWeek: any[] = [];
  // leading blanks
  for (let i = 0; i < (firstWeekday === 0 ? 0 : firstWeekday); i++) currentWeek.push({});
  for (let day = 1; day <= daysInMonth; day++) {
    const ymd = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    currentWeek.push({ day, ymd, marked: markedSet.has(ymd), selected: ymd === selectedDate });
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  }
  if (currentWeek.length) {
    while (currentWeek.length < 7) currentWeek.push({});
    weeks.push(currentWeek);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]">
      {/* scrim */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="mx-auto max-w-md w-full">
          <div className="rounded-3xl bg-white border border-black/10 shadow-2xl p-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 rounded-full bg-black/5"><ChevronLeft size={18} /></button>
              <div className="text-sm font-semibold">{label}</div>
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 rounded-full bg-black/5"><ChevronRight size={18} /></button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-black/60">
              {['D','S','T','Q','Q','S','S'].map((d) => (<div key={d}>{d}</div>))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-2">
              {weeks.flat().map((cell, idx) => {
                if (!cell.day) return <div key={idx} />;
                const isSelected = cell.selected;
                return (
                  <button
                    key={idx}
                    onClick={() => { if (cell.ymd) onSelectDate(cell.ymd); onClose(); }}
                    className={`h-12 rounded-xl border border-black/10 bg-white flex flex-col items-center justify-center ${isSelected ? 'ring-2 ring-black/20' : ''}`}
                  >
                    <div className="text-sm font-medium">{cell.day}</div>
                    {cell.marked && <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={onClose} className="px-3 py-2 rounded-lg bg-black/5 text-sm">Fechar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}