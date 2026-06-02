"use client";

import { useEffect, useRef } from "react";
import {
  CLOUD_SIZE,
  MASK_INSET,
  buildSakuraPath,
  paintSakuraMask,
  runWordCloudOnCanvas,
} from "../lib/sakuraWordCloud";

const SAKURA_PATH = buildSakuraPath(CLOUD_SIZE);
const SAKURA_CLIP_PATH = buildSakuraPath(CLOUD_SIZE, MASK_INSET);

export default function WordCloudPanel({ data = [], fallbackData }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function renderCloud() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const source = data.length > 0 ? data : fallbackData || [];
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (!source.length) {
        paintSakuraMask(canvas, CLOUD_SIZE, dpr);
        return;
      }

      if (cancelled) {
        return;
      }

      paintSakuraMask(canvas, CLOUD_SIZE, dpr);
      await runWordCloudOnCanvas(canvas, source, CLOUD_SIZE, dpr);
    }

    renderCloud();

    return () => {
      cancelled = true;
    };
  }, [data, fallbackData]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto mt-4 flex w-full max-w-[360px] items-center justify-center"
      style={{ height: CLOUD_SIZE }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${CLOUD_SIZE} ${CLOUD_SIZE}`}
        aria-hidden
      >
        <defs>
          <radialGradient id="sakuraCloudFill" cx="50%" cy="42%" r="52%">
            <stop offset="0%" stopColor="#fff5f8" />
            <stop offset="50%" stopColor="#fff0f4" />
            <stop offset="100%" stopColor="#fae8ee" />
          </radialGradient>
          <clipPath id="sakuraWordClip">
            <path d={SAKURA_CLIP_PATH} />
          </clipPath>
        </defs>
        <path
          d={SAKURA_PATH}
          fill="url(#sakuraCloudFill)"
          stroke="#e8a0b0"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />
        <circle
          cx={CLOUD_SIZE / 2}
          cy={CLOUD_SIZE / 2}
          r={CLOUD_SIZE * 0.048}
          fill="#ffd6e8"
          stroke="#e8a8b8"
          strokeWidth="1"
        />
      </svg>
      <canvas
        id="analyzer-word-cloud-canvas"
        ref={canvasRef}
        className="relative z-[1] block"
        style={{
          width: CLOUD_SIZE,
          height: CLOUD_SIZE,
          clipPath: "url(#sakuraWordClip)",
        }}
      />
      {data.length === 0 ? (
        <p className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center px-6 text-center text-sm leading-6 text-stone-400">
          分析完成后显示
        </p>
      ) : null}
    </div>
  );
}
