"use client";
import { Bar, BarChart as RBarChart, ResponsiveContainer, XAxis, Cell } from "recharts";

export type ChartPoint = { day: string; value: number; };

export default function BarChart({ data }: { data: ChartPoint[] }) {
  const pastel = ["#f2a1a1", "#ffd38a", "#c8e6c9", "#b3e5fc", "#d1c4e9", "#ffccbc", "#c5cae9"]; //近似 às cores da imagem
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={180}>
        <RBarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <Bar dataKey="value" radius={[8, 8, 8, 8]}>
            {data.map((entry, index) => (
              <Cell key={`c-${index}`} fill={pastel[index % pastel.length]} />
            ))}
          </Bar>
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}