"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export default function RadarChart({ dimensions, dimensionLabels, radarKeys }) {
  const keys = radarKeys?.length ? radarKeys : Object.keys(dimensions || {});
  const option = {
    tooltip: { trigger: "item" },
    radar: {
      radius: "68%",
      splitNumber: 4,
      indicator: keys.map((key) => ({
        name: dimensionLabels[key] || key,
        max: 1,
      })),
      axisName: {
        color: "#334155",
        fontSize: 12,
      },
      splitArea: {
        areaStyle: {
          color: ["rgba(74,184,214,0.04)", "rgba(242,107,91,0.04)"],
        },
      },
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: keys.map((key) => Number(dimensions[key] || 0)),
            areaStyle: { color: "rgba(74, 184, 214, 0.28)" },
            lineStyle: { color: "#4ab8d6", width: 2 },
            itemStyle: { color: "#f26b5b" },
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 340 }} />;
}
