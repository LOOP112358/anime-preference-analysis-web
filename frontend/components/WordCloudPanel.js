"use client";

import { useEffect, useRef } from "react";

// 推荐使用莫兰迪/温和的主题色彩池，避免使用高饱和度的刺眼原色
const COLOR_POOL = ["#f26b5b", "#4ab8d6", "#f1bc54", "#9fc79a", "#101826"];

const FONT_FAMILY = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";

export default function WordCloudPanel({ data = [], fallbackData }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function renderCloud() {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) {
        return;
      }

      // 1. 获取容器实际宽度，动态设置 Canvas 分辨率，防止拉伸模糊与变形
      const rect = container.getBoundingClientRect();
      const width = rect.width || 720;
      const height = 360; // 保持您设定的 360px 高度

      canvas.width = width;
      canvas.height = height;

      // 动态导入 wordcloud2.js
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

      // 2. 自适应权重计算：动态计算最大字的字号（设定为画布高度的 22%，约 79px）
      const maxVal = Math.max(...source.map((item) => item.value), 1);
      const targetMaxFontSize = height * 0.22; 
      const adaptiveWeightFactor = targetMaxFontSize / maxVal;

      // 3. 预先映射颜色：修复 index 传参不正确导致颜色混乱的 Bug
      const colorMap = {};
      source.forEach((item, index) => {
        colorMap[item.name] = COLOR_POOL[index % COLOR_POOL.length];
      });

      // 执行渲染
      wordCloud(canvas, {
        list,
        gridSize: 6,                     // 网格减小到 6，词语排布更紧凑饱满
        weightFactor: adaptiveWeightFactor, // 使用自适应缩放
        fontFamily: FONT_FAMILY,
        fontWeight: "600",               // 适当加粗字体，更有视觉张力
        backgroundColor: "rgba(255,255,255,0)",
        color: (word) => colorMap[word] || COLOR_POOL[0], // 精确匹配颜色池
        rotateRatio: 0.2,                // 20% 的词产生轻微旋转
        minRotation: -Math.PI / 12,      // 限制旋转角度在 -15度到 15度之间，提高阅读性
        maxRotation: Math.PI / 12,
        minSize: 12,
        drawOutOfBound: false,
        clearCanvas: true,               // 渲染前自动清空画布，防止重影
      });
    }

    renderCloud();

    // 4. 监听 resize，确保在屏幕缩放或移动端横竖屏切换时自适应重绘
    const handleResize = () => {
      renderCloud();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
    };
  }, [data, fallbackData]);

  return (
    <div 
      ref={containerRef}
      className="mt-4 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 w-full"
    >
      <canvas ref={canvasRef} className="block w-full h-[360px]" />
    </div>
  );
}