"use client";

import { useEffect, useMemo, useState } from "react";
import {
  copyPersonalityReportToClipboard,
  downloadPersonalityReport,
  getShareCapabilities,
  sharePersonalityReport,
} from "../lib/personalityReportImage";
import { btnPrimaryClass, btnSecondaryClass, panelClass } from "./ui";

function ActionButton({ busy, busyKey, label, onClick, className = btnSecondaryClass }) {
  return (
    <button type="button" className={className} disabled={Boolean(busy)} onClick={onClick}>
      {busy === busyKey ? "处理中…" : label}
    </button>
  );
}

export default function ReportShareModal({ open, blob, onClose }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const caps = useMemo(() => (blob ? getShareCapabilities(blob) : null), [blob]);

  useEffect(() => {
    if (open) {
      setMessage("");
      setBusy("");
    }
  }, [open]);

  useEffect(() => {
    if (!blob) {
      setPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

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

  if (!open || !blob || !caps) {
    return null;
  }

  const { mobile, inWeChat, canShareFile, canCopyImage } = caps;

  const hintText = inWeChat
    ? "微信内置浏览器无法直接调起分享面板。请长按下方预览图保存到相册，再到聊天里发送图片。"
    : mobile && canShareFile
      ? "手机可直接调起系统分享，选择微信、QQ 等应用发送。"
      : mobile
        ? "当前浏览器不支持系统分享。请保存图片到相册后，在聊天应用里发送。"
        : "在 Windows 上，系统分享到微信经常无法跳转。推荐使用「复制图片」，再到微信聊天里粘贴发送。";

  async function handleCopy() {
    setBusy("copy");
    setMessage("");
    const copied = await copyPersonalityReportToClipboard(blob);
    setBusy("");
    if (copied) {
      setMessage(
        mobile
          ? "图片已复制。切换到微信聊天，在输入框长按后选择「粘贴」发送。"
          : "图片已复制。打开微信聊天窗口，按 Ctrl+V（Mac：⌘V）粘贴发送即可。",
      );
      return;
    }
    downloadPersonalityReport(blob);
    setMessage(mobile ? "当前浏览器不支持复制图片，报告图已保存，请从相册发送。" : "当前浏览器不支持复制图片，报告图已下载到本地，请手动发送。");
  }

  async function handleDownload() {
    setBusy("download");
    downloadPersonalityReport(blob);
    setBusy("");
    setMessage(mobile ? "报告图已保存。请在相册或「文件」中找到后发送。" : "报告图已保存到下载目录。");
  }

  async function handleSystemShare() {
    setBusy("share");
    setMessage("");
    const result = await sharePersonalityReport(blob);
    setBusy("");
    if (result.ok) {
      setMessage("已通过系统分享面板发送。");
      return;
    }
    if (result.reason === "cancelled") {
      return;
    }
    downloadPersonalityReport(blob);
    setMessage(
      mobile
        ? "系统分享不可用，报告图已保存。请从相册发送，或长按下方预览图保存。"
        : "系统分享不可用，报告图已下载。微信用户建议用「复制图片」。",
    );
  }

  const showLongPressHint = inWeChat || (mobile && !canShareFile);
  const useMobileSharePrimary = mobile && canShareFile && !inWeChat;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/30 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className={`${panelClass} relative max-h-[90vh] w-full max-w-md overflow-y-auto`} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="absolute right-4 top-4 text-2xl leading-none text-stone-400 hover:text-stone-600"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>
        <h3 className="font-display text-xl text-stone-800">分享报告图</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">{hintText}</p>

        {previewUrl ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="报告图预览"
              className="mx-auto block max-h-56 w-auto max-w-full rounded"
            />
            {showLongPressHint ? (
              <p className="mt-2 text-center text-xs text-stone-500">长按图片可保存到相册</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2">
          {useMobileSharePrimary ? (
            <>
              <ActionButton
                busy={busy}
                busyKey="share"
                label="分享（微信 / QQ 等）"
                className={btnPrimaryClass}
                onClick={handleSystemShare}
              />
              <ActionButton busy={busy} busyKey="download" label="保存到相册" onClick={handleDownload} />
              {canCopyImage ? (
                <ActionButton busy={busy} busyKey="copy" label="复制图片" onClick={handleCopy} />
              ) : null}
            </>
          ) : mobile ? (
            <>
              <ActionButton
                busy={busy}
                busyKey="download"
                label="保存到相册"
                className={btnPrimaryClass}
                onClick={handleDownload}
              />
              {canCopyImage ? (
                <ActionButton busy={busy} busyKey="copy" label="复制图片" onClick={handleCopy} />
              ) : null}
            </>
          ) : (
            <>
              <ActionButton
                busy={busy}
                busyKey="copy"
                label="复制图片（推荐微信）"
                className={btnPrimaryClass}
                onClick={handleCopy}
              />
              <ActionButton busy={busy} busyKey="download" label="保存到本地" onClick={handleDownload} />
              <ActionButton busy={busy} busyKey="share" label="系统分享（更多应用）" onClick={handleSystemShare} />
            </>
          )}
        </div>

        {message ? <p className="mt-4 text-sm leading-6 text-stone-700">{message}</p> : null}
      </div>
    </div>
  );
}
