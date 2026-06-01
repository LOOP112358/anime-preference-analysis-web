"use client";

import { useState, useEffect } from "react";
import { btnPrimaryClass, inputClass, panelClass } from "../ui";

export default function PublishModal({ open, kind, onClose, onSubmit, submitting }) {
  const [name, setName] = useState("");
  const [extra, setExtra] = useState("");
  const [comment, setComment] = useState("");
  const [image, setImage] = useState("");

  const isAnime = kind === "anime";

  useEffect(() => {
    if (open) {
      setName("");
      setExtra("");
      setComment("");
      setImage("");
    }
  }, [open, kind]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 p-4">
      <form
        className={`${panelClass} relative w-full max-w-md`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            name: name.trim(),
            extra: extra.trim(),
            comment: comment.trim(),
            image: image || undefined,
          });
        }}
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-2xl text-slate-400 hover:text-slate-600"
          onClick={onClose}
        >
          ×
        </button>

        <h3 className="sketch-heading border-none text-2xl">
          {isAnime ? "发布番剧" : "发布角色"}
        </h3>

        <div className="mt-4 space-y-3">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isAnime ? "番剧名称" : "角色名称"}
            required
          />
          <input
            className={inputClass}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder={isAnime ? "类型" : "出处番剧"}
          />
          <textarea
            className={`${inputClass} min-h-28 resize-y`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="评价"
          />

          <input
            type="text"
            className={inputClass}
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="自定义图片URL（不填则自动抓取）"
          />
          <button
            type="button"
            className="btn-secondary w-full text-sm"
            onClick={() => setImage("")}
          >
            恢复为自动抓取图片
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`${btnPrimaryClass} mt-4 w-full`}
        >
          {submitting ? "发布中…" : "发布"}
        </button>
      </form>
    </div>
  );
}