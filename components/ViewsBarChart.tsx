"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function ViewsBarChart({
  labels,
  values
}: {
  labels: string[];
  values: number[];
}) {
  const data = {
    labels,
    datasets: [
      {
        label: "Views",
        data: values,
        backgroundColor: "rgba(255,75,31,0.88)",
        borderColor: "rgba(0,0,0,0.9)",
        borderWidth: 1,
        borderRadius: 8,
        barThickness: 14,
        maxBarThickness: 18
      }
    ]
  };

  return (
    <Bar
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: "rgba(0,0,0,0.92)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            callbacks: {
              label: (ctx) => `Views: ${Number(ctx.raw).toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#525252",
              maxRotation: 0,
              autoSkip: true
            },
            border: { display: false }
          },
          y: {
            grid: { color: "rgba(0,0,0,0.08)" },
            ticks: {
              color: "#525252",
              callback: (value) => Number(value).toLocaleString()
            },
            border: { display: false }
          }
        }
      }}
    />
  );
}

