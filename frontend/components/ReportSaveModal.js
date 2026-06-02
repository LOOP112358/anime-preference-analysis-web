"use client";

import { useEffect } from "react";
import { btnSecondaryClass, panelClass } from "./ui";

function openPreviewPage(url) {
  const page = window.open("", "_blank");
  if (!page) {
    window.location.href = url;
    return;
  }
  page.document.title = "ACG 偏好人格报告";
  page.document.body.style.margin = "0";
  page.document.body.style.background = "#fffef9";
  page.document.body.innerHTML = `<img src="${url}" alt="ACG 偏好人格报告" style="display:block;width:100%;height:auto;" />`;
}

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
          微信里请<strong className="font-semibold">长按下方图片</strong>，选「保存图片」。若失败，点「全屏查看」后再长按。
        </p>

        <div className="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="ACG 偏好人格报告"
            className="mx-auto block w-full rounded"
            style={{ WebkitTouchCallout: "default" }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button type="button" className={btnSecondaryClass} onClick={() => openPreviewPage(previewUrl)}>
            全屏查看后长按保存
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-stone-500">或点右上角 ··· → 在浏览器打开，再保存报告图</p>
      </div>
    </div>
  );
}
