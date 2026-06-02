"use client";

import { useEffect } from "react";
import { getPostDefaultAvatar, resolvePostImageUrl } from "../../lib/postApi";
import { btnSecondaryClass, panelClass } from "../ui";

export default function FavoriteUsersModal({ open, title, users, loading, onClose, onUserClick }) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const defaultAvatar = getPostDefaultAvatar();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className={`${panelClass} relative w-full max-w-md`} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="absolute right-4 top-4 text-2xl leading-none text-stone-400 hover:text-stone-600"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>
        <h3 className="font-display text-xl text-stone-800">收藏用户</h3>
        <p className="mt-1 text-sm text-stone-500">{title}</p>

        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-500">加载中…</p>
          ) : users.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">还没有人收藏</p>
          ) : (
            users.map((user) => (
              <button
                key={user.user_id}
                type="button"
                className="flex w-full items-center gap-3 rounded-md border border-stone-200 px-3 py-2 text-left hover:bg-stone-50"
                onClick={() => onUserClick?.(user.user_id)}
              >
                <img
                  src={user.photo ? resolvePostImageUrl(user.photo) : defaultAvatar}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full border border-stone-200 object-cover bg-stone-100"
                  onError={(e) => {
                    e.currentTarget.src = defaultAvatar;
                  }}
                />
                <span className="text-sm font-medium text-stone-800">@{user.user_name}</span>
              </button>
            ))
          )}
        </div>

        <div className="mt-4 text-center">
          <button type="button" className={btnSecondaryClass} onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
