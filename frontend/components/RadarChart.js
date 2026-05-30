"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const DEFAULT_KEYS = [
  "healing",
  "fantasy",
  "emotion",
  "bond",
  "daily",
  "growth",
  "realism",
  "dark",
  "passion",
  "suspense",
  "logic",
  "narrative",
];

function pickRadarKeys(dimensions, radarKeys, maxCount = 12) {
  if (radarKeys?.length >= 8) {
    return radarKeys.slice(0, maxCount);
  }

  const ranked = Object.entries(dimensions || {})
    .sort((a, b) => b[1] - a[1])
    .filter(([, value]) => value > 0.05);

  if (ranked.length >= 8) {
    return ranked.slice(0, maxCount).map(([key]) => key);
  }

  return DEFAULT_KEYS.slice(0, maxCount);
}

export default function RadarChart({ dimensions, dimensionLabels, radarKeys }) {
  const keys = useMemo(
    () => pickRadarKeys(dimensions, radarKeys),
    [dimensions, radarKeys],
  );

  const values = keys.map((key) => Number(dimensions?.[key] || 0));

  const option = {
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const idx = params.dataIndex ?? 0;
        const label = dimensionLabels[keys[idx]] || keys[idx];
        const pct = Math.round((values[idx] || 0) * 100);
        return `${label}：${pct}%`;
      },
    },
    radar: {
      radius: "58%",
      splitNumber: 4,
      indicator: keys.map((key) => ({
        name: dimensionLabels[key] || key,
        max: 1,
      })),
      axisName: {
        color: "#57534e",
        fontSize: 11,
        fontFamily: "'Noto Serif SC', 'Songti SC', serif",
      },
      axisLine: {
        lineStyle: { color: "rgba(212, 115, 143, 0.25)" },
      },
      splitLine: {
        lineStyle: { color: "rgba(212, 115, 143, 0.18)" },
      },
      splitArea: {
        areaStyle: {
          color: ["rgba(255, 240, 244, 0.55)", "rgba(255, 254, 249, 0.85)"],
        },
      },
    },
    series: [
      {
        type: "radar",
        symbol: "circle",
        symbolSize: 5,
        data: [
          {
            value: values,
            name: "偏好维度",
            areaStyle: {
              color: {
                type: "radial",
                x: 0.5,
                y: 0.5,
                r: 0.65,
                colorStops: [
                  { offset: 0, color: "rgba(212, 115, 143, 0.35)" },
                  { offset: 1, color: "rgba(91, 124, 153, 0.12)" },
                ],
              },
            },
            lineStyle: { color: "#d4738f", width: 2 },
            itemStyle: { color: "#c45c4a", borderColor: "#fffef9", borderWidth: 1 },
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 380 }} notMerge lazyUpdate />;
}
