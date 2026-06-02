"use client";

import { useCallback, useEffect, useState } from "react";
import { updateUserProfile } from "../../lib/postApi";
import { btnPrimaryClass, btnSecondaryClass, inputClass, panelClass } from "../ui";

const DEFAULT_INTRO = "这个人还没有写简介";
const MAX_INTRO_LEN = 255;

function normalizeIntro(value) {
  const trimmed = value.trim();
  return trimmed || DEFAULT_INTRO;
}

function displayIntro(intro) {
  if (!intro || intro === DEFAULT_INTRO) return "暂无简介";
  return intro;
}

export { DEFAULT_INTRO, displayIntro };

export default function ProfileEditModal({ open, userId, userName, intro, onClose, onSaved }) {
  const [draftIntro, setDraftIntro] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resetDraft = useCallback(() => {
    setDraftIntro(intro && intro !== DEFAULT_INTRO ? intro : "");
    setError("");
  }, [intro]);

  useEffect(() => {
    if (open) resetDraft();
  }, [open, resetDraft]);

  async function handleSave(event) {
    event.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError("");
    try {
      const user = await updateUserProfile({
        user_id: Number(userId),
        user_intro: normalizeIntro(draftIntro),
      });
      onSaved?.(user);
      onClose();
    } catch (e) {
      setError(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/30 p-4">
      <form className={`${panelClass} relative my-4 w-full max-w-md`} onSubmit={handleSave}>
        <button
          type="button"
          className="absolute right-4 top-4 text-2xl text-slate-400 hover:text-slate-600"
          onClick={onClose}
        >
          ×
        </button>

        <h3 className="sketch-heading border-none pr-8 text-2xl">修改简介</h3>
        <p className="mt-1 text-sm text-slate-500">@{userName}</p>

        <div className="mt-5 space-y-4">
          <label className="block text-sm text-stone-700">
            个人简介
            <textarea
              className={`${inputClass} mt-1 min-h-28 resize-y`}
              value={draftIntro}
              maxLength={MAX_INTRO_LEN}
              onChange={(e) => setDraftIntro(e.target.value)}
              placeholder={DEFAULT_INTRO}
            />
            <span className="mt-1 block text-right text-xs text-slate-400">
              {draftIntro.length}/{MAX_INTRO_LEN}
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex gap-2">
          <button type="submit" className={`${btnPrimaryClass} flex-1`} disabled={saving}>
            {saving ? "保存中…" : "保存简介"}
          </button>
          <button type="button" className={btnSecondaryClass} disabled={saving} onClick={onClose}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
