"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { btnPrimaryClass, btnSecondaryClass } from "../ui";

const DEFAULT_ASPECT = 3 / 4;
const DEFAULT_OUTPUT = { width: 600, height: 800 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function touchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function prefersSliderZoom() {
  if (typeof window === "undefined") return true;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  return fine || !coarse;
}

export default function ImageCropper({
  src,
  onConfirm,
  onCancel,
  confirming,
  aspectRatio = DEFAULT_ASPECT,
  outputWidth = DEFAULT_OUTPUT.width,
  outputHeight = DEFAULT_OUTPUT.height,
}) {
  const viewportRef = useRef(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showSliderZoom, setShowSliderZoom] = useState(true);

  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const panRef = useRef(null);
  const pinchRef = useRef(null);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    setShowSliderZoom(prefersSliderZoom());

    const coarseMq = window.matchMedia("(pointer: coarse)");
    const fineMq = window.matchMedia("(pointer: fine)");
    const update = () => setShowSliderZoom(prefersSliderZoom());
    coarseMq.addEventListener("change", update);
    fineMq.addEventListener("change", update);
    return () => {
      coarseMq.removeEventListener("change", update);
      fineMq.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => setNatural({ w: 0, h: 0 });
    img.src = src;
  }, [src]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const update = () => {
      setViewport({ w: node.clientWidth, h: node.clientHeight });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const getMinScale = useCallback(() => {
    if (!natural.w || !natural.h || !viewport.w || !viewport.h) return 0.1;
    return Math.max(viewport.w / natural.w, viewport.h / natural.h);
  }, [natural.h, natural.w, viewport.h, viewport.w]);

  const getMaxScale = useCallback(() => getMinScale() * 3, [getMinScale]);

  useEffect(() => {
    if (!natural.w || !natural.h || !viewport.w || !viewport.h) return;
    const cover = getMinScale();
    setScale(cover);
    setOffset({ x: 0, y: 0 });
  }, [natural.w, natural.h, viewport.w, viewport.h, src, getMinScale]);

  const displayW = natural.w * scale;
  const displayH = natural.h * scale;

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    function onTouchStart(e) {
      if (!showSliderZoom && e.touches.length === 2) {
        e.preventDefault();
        panRef.current = null;
        pinchRef.current = {
          distance: touchDistance(e.touches),
          scale: scaleRef.current,
        };
      } else if (e.touches.length === 1) {
        pinchRef.current = null;
        panRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          ox: offsetRef.current.x,
          oy: offsetRef.current.y,
        };
      }
    }

    function onTouchMove(e) {
      if (!showSliderZoom && e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const ratio = touchDistance(e.touches) / pinchRef.current.distance;
        const next = clamp(pinchRef.current.scale * ratio, getMinScale(), getMaxScale());
        setScale(next);
      } else if (e.touches.length === 1 && panRef.current) {
        e.preventDefault();
        const t = e.touches[0];
        setOffset({
          x: panRef.current.ox + t.clientX - panRef.current.x,
          y: panRef.current.oy + t.clientY - panRef.current.y,
        });
      }
    }

    function onTouchEnd(e) {
      if (e.touches.length === 0) {
        panRef.current = null;
        pinchRef.current = null;
        return;
      }

      if (e.touches.length === 1) {
        pinchRef.current = null;
        panRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          ox: offsetRef.current.x,
          oy: offsetRef.current.y,
        };
      }
    }

    node.addEventListener("touchstart", onTouchStart, { passive: false });
    node.addEventListener("touchmove", onTouchMove, { passive: false });
    node.addEventListener("touchend", onTouchEnd);
    node.addEventListener("touchcancel", onTouchEnd);

    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [getMaxScale, getMinScale, showSliderZoom]);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    panRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };

  const onMouseMove = (e) => {
    if (!panRef.current || e.buttons !== 1) return;
    setOffset({
      x: panRef.current.ox + e.clientX - panRef.current.x,
      y: panRef.current.oy + e.clientY - panRef.current.y,
    });
  };

  const onMouseUp = () => {
    panRef.current = null;
  };

  const minScale = getMinScale();
  const maxScale = getMaxScale();

  const cropToBlob = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!natural.w || !natural.h || !viewport.w || !viewport.h) {
        reject(new Error("图片尚未加载完成"));
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext("2d");

        const imgLeft = viewport.w / 2 + offset.x - displayW / 2;
        const imgTop = viewport.h / 2 + offset.y - displayH / 2;

        const sx = clamp(-imgLeft / scale, 0, natural.w);
        const sy = clamp(-imgTop / scale, 0, natural.h);
        const sw = clamp(viewport.w / scale, 0, natural.w - sx);
        const sh = clamp(viewport.h / scale, 0, natural.h - sy);

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("裁剪失败"));
          },
          "image/jpeg",
          0.92,
        );
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = src;
    });
  }, [displayH, displayW, natural.h, natural.w, offset.x, offset.y, outputHeight, outputWidth, scale, src, viewport.h, viewport.w]);

  const ratioLabel = aspectRatio === 1 ? "1:1" : "3:4";

  async function handleConfirm() {
    try {
      const blob = await cropToBlob();
      onConfirm(blob);
    } catch (e) {
      onConfirm(null, e.message);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        {showSliderZoom
          ? `拖动图片调整位置，滑块缩放。裁剪比例为 ${ratioLabel}。`
          : `单指拖动调整位置，双指捏合缩放。裁剪比例为 ${ratioLabel}。`}
      </p>

      <div
        ref={viewportRef}
        className="relative mx-auto w-full max-w-[280px] cursor-grab overflow-hidden border-2 border-stone-800 bg-stone-100 active:cursor-grabbing"
        style={{ touchAction: showSliderZoom ? "pan-x pan-y" : "none", aspectRatio }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {natural.w > 0 && (
          <img
            src={src}
            alt="待裁剪"
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              width: `${displayW}px`,
              height: `${displayH}px`,
              left: `calc(50% + ${offset.x}px - ${displayW / 2}px)`,
              top: `calc(50% + ${offset.y}px - ${displayH / 2}px)`,
            }}
          />
        )}
      </div>

      {showSliderZoom && (
        <label className="block text-xs text-slate-600">
          缩放
          <input
            type="range"
            min={minScale}
            max={maxScale}
            step="0.01"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="mt-1 w-full"
            disabled={!natural.w}
          />
        </label>
      )}

      <div className="flex gap-2">
        <button type="button" className={`${btnPrimaryClass} flex-1 text-sm`} disabled={confirming || !natural.w} onClick={handleConfirm}>
          {confirming ? "上传中…" : "确认裁剪"}
        </button>
        {onCancel && (
          <button type="button" className={`${btnSecondaryClass} text-sm`} onClick={onCancel}>
            取消
          </button>
        )}
      </div>
    </div>
  );
}
