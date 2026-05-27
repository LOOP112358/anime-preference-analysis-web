"use client";

import { useEffect, useState } from "react";
import { btnPrimaryClass, inputClass, panelClass } from "../ui";

export default function PublishModal({ open, kind, onClose, onSubmit, submitting }) {
  const [name, setName] = useState("");
  const [extra, setExtra] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setExtra("");
      setComment("");
    }
  }, [open, kind]);

  if (!open) {
    return null;
  }

  const isAnime = kind === "anime";
  const title = isAnime ? "发布番剧" : "发布角色";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        className={`${panelClass} relative w-full max-w-md`}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ name: name.trim(), extra: extra.trim(), comment: comment.trim() });
        }}
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-2xl leading-none text-slate-400 hover:text-slate-600"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>
        <h3 className="sketch-heading border-none pb-0 text-2xl">{title}</h3>
        <div className="mt-4 space-y-3">
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={isAnime ? "番剧名称" : "角色名称"}
            required
          />
          <input
            className={inputClass}
            value={extra}
            onChange={(event) => setExtra(event.target.value)}
            placeholder={isAnime ? "类型（可选，留空则自动从 Bangumi 获取）" : "出处番剧（可选）"}
          />
          <textarea
            className={`${inputClass} min-h-28 resize-y`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="写下你的评价或推荐理由"
          />
        </div>
        <button type="submit" disabled={submitting} className={`${btnPrimaryClass} mt-4 w-full`}>
          {submitting ? "发布中..." : "发布"}
        </button>
      </form>
    </div>
  );
}
