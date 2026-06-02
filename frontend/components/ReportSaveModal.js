"use client";

import { useEffect } from "react";
import { panelClass } from "./ui";

export default function ReportSaveModal({ open, previewUrl, onClose }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !previewUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className={`${panelClass} relative max-h-[92vh] w-full max-w-md overflow-y-auto`} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="absolute right-4 top-4 text-2xl leading-none text-stone-400 hover:text-stone-600"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>
        <h3 className="font-display text-xl text-stone-800">保存报告图</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          微信内置浏览器不支持直接下载文件。请<strong className="font-semibold">长按下方图片</strong>，选择「保存图片」存到相册。
        </p>

        <div className="mt-4 overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="ACG 偏好人格报告" className="mx-auto block w-full rounded" />
        </div>

        <p className="mt-3 text-center text-xs text-stone-500">也可点右上角 ··· 用系统浏览器打开后再保存</p>
      </div>
    </div>
  );
}
