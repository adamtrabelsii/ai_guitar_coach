"use client"

import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts"

type DataPoint = { label: string; score: number; isLatest: boolean }

export default function ScoreTrendChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={data} barCategoryGap="20%" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "#78716c", fontFamily: "monospace" }}
        />
        <Bar dataKey="score" radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isLatest ? "#f59e0b" : "#44403c"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
