"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export type ChartType = "bar" | "line" | "scatter";

interface EChartsPanelProps {
  type: ChartType;
  xLabel: string;
  yLabel: string;
  xData: unknown[];
  yData: (number | null)[];
}

export function EChartsPanel({ type, xLabel, yLabel, xData, yData }: EChartsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const pairs = xData
      .map((x, i) => ({ x, y: yData[i] }))
      .filter((p): p is { x: unknown; y: number } => p.y !== null && p.y !== undefined);

    if (pairs.length === 0) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current);
    }

    let series: echarts.EChartsOption["series"];
    if (type === "scatter") {
      series = {
        type: "scatter",
        data: pairs.map((p) => [Number(p.x) || 0, p.y]),
        itemStyle: { color: "#2563eb" },
        symbolSize: 8,
      };
    } else if (type === "line") {
      series = {
        type: "line",
        data: pairs.map((p) => p.y),
        smooth: true,
        lineStyle: { color: "#2563eb", width: 2 },
        itemStyle: { color: "#2563eb" },
      };
    } else {
      series = {
        type: "bar",
        data: pairs.map((p) => p.y),
        itemStyle: { color: "#2563eb", borderRadius: [4, 4, 0, 0] },
      };
    }

    const option: echarts.EChartsOption = {
      grid: { left: 48, right: 24, top: 32, bottom: 48 },
      tooltip: { trigger: type === "scatter" ? "item" : "axis" },
      xAxis: {
        type: type === "scatter" ? "value" : "category",
        name: xLabel,
        data: type !== "scatter" ? pairs.map((p) => String(p.x)) : undefined,
        axisLine: { lineStyle: { color: "#d4d4d4" } },
        axisLabel: { color: "#525252" },
      },
      yAxis: {
        type: "value",
        name: yLabel,
        axisLine: { lineStyle: { color: "#d4d4d4" } },
        splitLine: { lineStyle: { color: "rgba(0,0,0,0.06)" } },
        axisLabel: { color: "#525252" },
      },
      series,
    };

    chartRef.current.setOption(option, true);
    chartRef.current.resize();

    const onResize = () => chartRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [type, xLabel, yLabel, xData, yData]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-72 w-full" />;
}
