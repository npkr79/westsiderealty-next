"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#CBD5E1",
        font: { family: "Inter, system-ui, sans-serif", size: 12 },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: "#94A3B8" },
      grid: { color: "rgba(148,163,184,0.14)" },
    },
    y: {
      ticks: { color: "#94A3B8" },
      grid: { color: "rgba(148,163,184,0.14)" },
    },
  },
};

export function InflowGrowthChart() {
  return (
    <div className="h-72">
      <Line
        options={{
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: { display: false },
          },
        }}
        data={{
          labels: ["2019", "2020", "2021", "2022", "2023", "2024", "2025"],
          datasets: [
            {
              label: "Institutional inflows ($B)",
              data: [3.2, 2.7, 4.6, 5.4, 6.8, 7.2, 8.5],
              borderColor: "#B48A3C",
              backgroundColor: "rgba(180,138,60,0.16)",
              fill: true,
              tension: 0.35,
              pointBackgroundColor: "#F8FAFC",
            },
          ],
        }}
      />
    </div>
  );
}

export function YieldArbitrageChart() {
  return (
    <div className="h-72">
      <Bar
        options={{
          ...baseOptions,
          plugins: { ...baseOptions.plugins, legend: { display: false } },
        }}
        data={{
          labels: ["Singapore", "London", "Tokyo", "Hong Kong", "Hyderabad"],
          datasets: [
            {
              label: "Prime office yield (%)",
              data: [3.8, 4.1, 3.2, 3.6, 8.7],
              backgroundColor: ["#475569", "#475569", "#475569", "#475569", "#B48A3C"],
              borderRadius: 8,
            },
          ],
        }}
      />
    </div>
  );
}

export function GCCShareChart() {
  return (
    <div className="h-72">
      <Doughnut
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#CBD5E1" },
            },
          },
        }}
        data={{
          labels: ["GCC", "BFSI", "Tech Product", "Life Sciences"],
          datasets: [
            {
              data: [43, 21, 19, 17],
              backgroundColor: ["#B48A3C", "#334155", "#1E293B", "#64748B"],
              borderColor: "#0F172A",
              borderWidth: 2,
            },
          ],
        }}
      />
    </div>
  );
}

export function NetAbsorptionChart() {
  return (
    <div className="h-72">
      <Bar
        options={{
          ...baseOptions,
          indexAxis: "y" as const,
          plugins: { ...baseOptions.plugins, legend: { display: false } },
        }}
        data={{
          labels: ["Hyderabad", "Bengaluru", "Mumbai", "NCR"],
          datasets: [
            {
              data: [14.2, 12.8, 9.4, 8.7],
              label: "Net absorption (mn sq ft)",
              backgroundColor: ["#B48A3C", "#475569", "#475569", "#475569"],
              borderRadius: 8,
            },
          ],
        }}
      />
    </div>
  );
}
