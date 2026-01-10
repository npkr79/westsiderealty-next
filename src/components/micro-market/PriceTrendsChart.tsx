"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { PriceTrendItem } from "@/services/microMarketPagesService";

interface PriceTrendsChartProps {
  data: PriceTrendItem[];
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    if (value === undefined || isNaN(value)) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3">
        <p className="text-sm font-bold text-blue-600">
          ₹{value.toLocaleString()} / sq.ft
        </p>
      </div>
    );
  }
  return null;
};

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

  // Modern blue color for bars
  const barColor = "#0ea5e9";

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#e5e7eb" 
          vertical={false}
          horizontal={true}
        />
        <XAxis
          dataKey="year"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            if (value === undefined || isNaN(value)) return "N/A";
            return `₹${(value / 1000).toFixed(0)}k`;
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="price"
          fill={barColor}
          radius={[8, 8, 0, 0]}
          animationDuration={1000}
          animationEasing="ease-in-out"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={barColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
