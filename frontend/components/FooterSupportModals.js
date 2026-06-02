"use client";

import { useEffect, useState } from "react";
import { submitFeedback } from "../lib/api";
import { btnPrimaryClass, btnSecondaryClass, inputClass, panelClass } from "./ui";

function ModalShell({ open, title, onClose, children }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`${panelClass} relative w-full max-w-md`}
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
        <h3 className="font-display text-xl text-stone-800">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function FeedbackModal({ open, onClose }) {
  const [message, setMessage] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMessage("");
      setNickname("");
      setStatus("");
      setError("");
    }
  }, [open]);

  return (
    <ModalShell open={open} title="意见反馈" onClose={onClose}>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        欢迎提 bug、功能建议或使用体验。反馈仅保存在网站服务器，不会公开展示。
      </p>

      <form
        className="mt-4 space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          setError("");
          setStatus("");
          try {
            await submitFeedback({ message: message.trim(), nickname: nickname.trim() });
            setStatus("已收到，感谢你的反馈！");
            setMessage("");
            setNickname("");
          } catch (err) {
            setError(err.message || "提交失败");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <textarea
          className={`${inputClass} min-h-28 resize-y`}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="你的建议…"
          required
          maxLength={2000}
        />
        <input
          className={inputClass}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="昵称（选填）"
          maxLength={50}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {status ? <p className="text-sm text-emerald-700">{status}</p> : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="submit" disabled={submitting} className={btnPrimaryClass}>
            {submitting ? "提交中…" : "提交反馈"}
          </button>
          <button type="button" className={btnSecondaryClass} onClick={onClose}>
            关闭
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function DonateModal({ open, onClose }) {
  return (
    <ModalShell open={open} title="打赏支持" onClose={onClose}>
      <p className="mt-2 text-sm leading-6 text-stone-600">功能暂未开发</p>

      <div className="mt-4 text-center">
        <button type="button" className={btnSecondaryClass} onClick={onClose}>
          关闭
        </button>
      </div>
    </ModalShell>
  );
}
