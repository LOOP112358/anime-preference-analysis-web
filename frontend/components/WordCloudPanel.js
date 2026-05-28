"use client";

import { useEffect, useRef } from "react";

const COLOR_POOL = ["#f26b5b", "#4ab8d6", "#f1bc54", "#9fc79a", "#101826"];

const FONT_FAMILY = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";

export default function WordCloudPanel({ data, fallbackData }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function renderCloud() {
      if (!canvasRef.current) {
        return;
      }

      const module = await import("wordcloud");
      const wordCloud = module.default || module;
      const source = data.length
        ? data
        : fallbackData || [
            { name: "治愈", value: 10 },
            { name: "幻想", value: 8 },
            { name: "关系", value: 7 },
            { name: "热血", value: 6 },
          ];
      const list = source.map((item) => [item.name, item.value]);

      if (cancelled) {
        return;
      }

      wordCloud(canvasRef.current, {
        list,
        gridSize: 12,
        weightFactor: 10,
        fontFamily: FONT_FAMILY,
        backgroundColor: "rgba(255,255,255,0)",
        color: (_, index) => COLOR_POOL[index % COLOR_POOL.length],
        rotateRatio: 0.15,
        minSize: 12,
        drawOutOfBound: false,
      });
    }

    renderCloud();

    return () => {
      cancelled = true;
    };
  }, [data, fallbackData]);

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
      <canvas ref={canvasRef} width={720} height={360} className="h-[360px] w-full" />
    </div>
  );
}
