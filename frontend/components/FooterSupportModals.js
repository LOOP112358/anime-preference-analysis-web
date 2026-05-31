"use client";

import { useEffect, useState } from "react";
import { submitFeedback } from "../lib/api";
import { SITE_LINKS } from "../lib/siteLinks";
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
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMessage("");
      setContact("");
      setStatus("");
      setError("");
    }
  }, [open]);

  const { email, github } = SITE_LINKS.feedback;

  return (
    <ModalShell open={open} title="意见反馈" onClose={onClose}>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        欢迎提 bug、功能建议或使用体验。反馈仅保存在网站服务器，不会公开展示你的联系方式。
      </p>

      {(email || github) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {email ? (
            <a className="sketch-tag hover:bg-stone-50" href={`mailto:${email}`}>
              邮件 {email}
            </a>
          ) : null}
          {github ? (
            <a
              className="sketch-tag hover:bg-stone-50"
              href={github}
              target="_blank"
              rel="noreferrer"
            >
              GitHub Issue
            </a>
          ) : null}
        </div>
      )}

      <form
        className="mt-4 space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          setError("");
          setStatus("");
          try {
            await submitFeedback({ message: message.trim(), contact: contact.trim() });
            setStatus("已收到，感谢你的反馈！");
            setMessage("");
            setContact("");
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
          placeholder="想说的话…"
          required
          maxLength={2000}
        />
        <input
          className={inputClass}
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="联系方式（选填：邮箱 / QQ / 微信）"
          maxLength={120}
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

function QrBlock({ label, src }) {
  if (!src) {
    return null;
  }

  return (
    <figure className="flex flex-col items-center gap-2">
      <div className="overflow-hidden rounded-lg border border-stone-300 bg-white p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="h-36 w-36 object-contain" />
      </div>
      <figcaption className="text-xs text-stone-500">{label}</figcaption>
    </figure>
  );
}

export function DonateModal({ open, onClose }) {
  const { wechatQr, alipayQr, externalUrl, note } = SITE_LINKS.donate;
  const hasQr = Boolean(wechatQr || alipayQr);

  return (
    <ModalShell open={open} title="打赏支持" onClose={onClose}>
      <p className="mt-2 text-sm leading-6 text-stone-600">{note}</p>

      {externalUrl ? (
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className={`${btnPrimaryClass} mt-4 inline-block w-full text-center`}
        >
          前往爱发电 · 请作者喝茶（¥5/月）
        </a>
      ) : null}

      {hasQr ? (
        <details className="mt-4 rounded-md border border-dashed border-stone-300 bg-stone-50 px-3 py-3 text-left">
          <summary className="cursor-pointer text-xs text-stone-600">
            使用收款码（可能显示真实姓名，半公开站点慎用）
          </summary>
          <div className="mt-3 flex flex-wrap justify-center gap-6">
            <QrBlock label="微信" src={wechatQr} />
            <QrBlock label="支付宝" src={alipayQr} />
          </div>
        </details>
      ) : !externalUrl ? (
        <p className="mt-4 rounded-md border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs leading-5 text-stone-500">
          推荐在 <code className="text-[11px]">frontend/.env.local</code> 只配置{" "}
          <code className="text-[11px]">NEXT_PUBLIC_DONATE_LINK</code>（如爱发电），用平台昵称收款，无需公开个人收款码。
        </p>
      ) : null}

      {!externalUrl && hasQr ? null : externalUrl && hasQr ? (
        <p className="mt-3 text-center text-[11px] leading-5 text-stone-400">
          上方链接为推荐方式；收款码仅在你主动展开时使用。
        </p>
      ) : null}

      <div className="mt-4 text-center">
        <button type="button" className={btnSecondaryClass} onClick={onClose}>
          关闭
        </button>
      </div>
    </ModalShell>
  );
}
