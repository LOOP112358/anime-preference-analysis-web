"use client";

import { useEffect } from "react";
import { panelClass } from "../ui";
import ImageCropper from "./ImageCropper";

function revokeBlobUrl(url) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export default function AvatarUploadModal({ open, src, uploading, onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return;
    return () => revokeBlobUrl(src);
  }, [open, src]);

  if (!open || !src) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/30 p-4">
      <div className={`${panelClass} relative my-4 w-full max-w-md`}>
        <button
          type="button"
          className="absolute right-4 top-4 text-2xl text-slate-400 hover:text-slate-600"
          onClick={onClose}
        >
          ×
        </button>

        <h3 className="sketch-heading border-none pr-8 text-2xl">更换头像</h3>
        <p className="mt-1 text-xs text-slate-500">裁剪完成后将自动保存</p>

        <div className="mt-4">
          <ImageCropper
            src={src}
            aspectRatio={1}
            outputWidth={400}
            outputHeight={400}
            confirming={uploading}
            onConfirm={onConfirm}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
