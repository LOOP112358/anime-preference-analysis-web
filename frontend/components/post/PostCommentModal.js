"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { panelClass } from "../ui";

export default function PostCommentModal({ open, title, author, comment, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const scrollY = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-stone-900/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-comment-modal-title"
      onClick={onClose}
    >
      <div
        className={`${panelClass} relative my-auto w-full max-w-lg max-h-[min(85vh,calc(100vh-2rem))] overflow-y-auto overscroll-contain`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-2xl leading-none text-stone-400 hover:text-stone-600"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>
        <h3 id="post-comment-modal-title" className="font-display text-xl text-stone-800 pr-8">
          {title || "评价全文"}
        </h3>
        {author ? <p className="mt-1 text-sm text-slate-500">@{author}</p> : null}
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{comment}</p>
      </div>
    </div>,
    document.body,
  );
}
