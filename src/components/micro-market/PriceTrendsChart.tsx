"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { PriceTrendItem } from "@/services/microMarketPagesService";

interface PriceTrendsChartProps {
  data: PriceTrendItem[];
}

export default function PriceTrendsChart({ data }: PriceTrendsChartProps) {
  if (!data || data.length === 0) return null;

  // Normalize data for chart - ensure year and price are in the right format
  const chartData = data
    .map((item) => ({
      year: String(item.year || ""),
      price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0)),
    }))
    .filter((item) => item.year && !isNaN(item.price))
    .sort((a, b) => a.year.localeCompare(b.year));

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="year"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(value) => `₹${value.toLocaleString()}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            padding: "12px",
          }}
          formatter={(value: number) => [`₹${value.toLocaleString()}/sft`, "Price"]}
          labelFormatter={(label) => `Year: ${label}`}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#6366f1"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorPrice)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
