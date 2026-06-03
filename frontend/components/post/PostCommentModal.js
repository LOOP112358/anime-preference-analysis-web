"use client";

import { useEffect } from "react";
import { panelClass } from "../ui";

export default function PostCommentModal({ open, title, author, comment, onClose }) {
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

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/30 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className={`${panelClass} relative max-h-[85vh] w-full max-w-lg overflow-y-auto`} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="absolute right-4 top-4 text-2xl leading-none text-stone-400 hover:text-stone-600"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>
        <h3 className="font-display text-xl text-stone-800">{title || "评价全文"}</h3>
        {author ? <p className="mt-1 text-sm text-slate-500">@{author}</p> : null}
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{comment}</p>
      </div>
    </div>
  );
}
