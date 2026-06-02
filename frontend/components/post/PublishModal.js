"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getProxiedImageUrl,
  previewAnimeImage,
  previewCharacterImage,
  uploadPostImage,
} from "../../lib/postApi";
import { btnPrimaryClass, btnSecondaryClass, inputClass, panelClass } from "../ui";
import BangumiResultPicker from "./BangumiResultPicker";
import ImageCropper from "./ImageCropper";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function revokeBlobUrl(url) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export default function PublishModal({ open, kind, editItem, onClose, onSubmit, submitting }) {
  const fileInputRef = useRef(null);
  const [name, setName] = useState("");
  const [extra, setExtra] = useState("");
  const [comment, setComment] = useState("");
  const [finalImage, setFinalImage] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [resetImageOnSave, setResetImageOnSave] = useState(false);

  const [previewSource, setPreviewSource] = useState("");
  const [imageSource, setImageSource] = useState("");
  const [bangumiResults, setBangumiResults] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cropUploading, setCropUploading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const isAnime = kind === "anime";
  const isEdit = Boolean(editItem);

  const resetPreviewState = useCallback(() => {
    setPreviewSource((prev) => {
      revokeBlobUrl(prev);
      return "";
    });
    setImageSource("");
    setBangumiResults([]);
    setShowPicker(false);
    setShowCropper(false);
    setFinalImage("");
    setPreviewError("");
  }, []);

  const resetForm = useCallback(() => {
    setName("");
    setExtra("");
    setComment("");
    setExistingImage("");
    setResetImageOnSave(false);
    setPreviewLoading(false);
    setCropUploading(false);
    resetPreviewState();
  }, [resetPreviewState]);

  const populateFromItem = useCallback((item) => {
    const editingAnime = Boolean(item.ani_id);
    setName(editingAnime ? item.ani_name || "" : item.char_name || "");
    setExtra(editingAnime ? item.ani_type || "" : item.char_from || "");
    setComment(editingAnime ? item.ani_com || "" : item.char_com || "");
    setExistingImage(editingAnime ? item.ani_img || "" : item.char_img || "");
    setResetImageOnSave(false);
    resetPreviewState();
  }, [resetPreviewState]);

  useEffect(() => {
    if (!open) return;
    if (editItem) populateFromItem(editItem);
    else resetForm();
  }, [open, kind, editItem, populateFromItem, resetForm]);

  function applyBangumiSelection(item) {
    setPreviewSource((prev) => {
      revokeBlobUrl(prev);
      return isAnime ? item.ani_img : item.char_img;
    });
    setImageSource("bangumi");
    setShowPicker(false);
    setShowCropper(true);
    setFinalImage("");
    setResetImageOnSave(false);

    if (isAnime && item.ani_type && item.ani_type !== "未知" && !extra.trim()) {
      setExtra(item.ani_type);
    }
  }

  function handleLocalUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setPreviewError("仅支持 png、jpg、jpeg、gif、webp 格式");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setPreviewError("图片大小不能超过 10MB");
      return;
    }

    setPreviewError("");
    setBangumiResults([]);
    setShowPicker(false);
    setFinalImage("");

    const objectUrl = URL.createObjectURL(file);
    setPreviewSource((prev) => {
      revokeBlobUrl(prev);
      return objectUrl;
    });
    setImageSource("local");
    setShowCropper(true);
    setResetImageOnSave(false);
  }

  async function fetchBangumiPreview() {
    const trimmed = name.trim();
    if (!trimmed) {
      setPreviewError("请先填写名称");
      return;
    }

    setPreviewLoading(true);
    setPreviewError("");
    setShowCropper(false);
    setShowPicker(false);
    setPreviewSource((prev) => {
      revokeBlobUrl(prev);
      return "";
    });
    setImageSource("");
    setBangumiResults([]);
    setFinalImage("");

    try {
      const data = isAnime
        ? await previewAnimeImage(trimmed)
        : await previewCharacterImage(trimmed);

      const results = data?.results || [];
      if (results.length === 0) {
        throw new Error(isAnime ? "Bangumi 未找到该番剧" : "Bangumi 未找到该角色");
      }

      setBangumiResults(results);

      if (results.length === 1) {
        applyBangumiSelection(results[0]);
      } else {
        setShowPicker(true);
      }
    } catch (e) {
      setPreviewError(e.message || "获取 Bangumi 图片失败");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleCropConfirm(blob, errorMessage) {
    if (!blob) {
      setPreviewError(errorMessage || "裁剪失败");
      return;
    }

    setCropUploading(true);
    setPreviewError("");
    try {
      const url = await uploadPostImage(blob);
      setFinalImage(url);
      setResetImageOnSave(false);
      setShowCropper(false);
    } catch (e) {
      setPreviewError(e.message);
    } finally {
      setCropUploading(false);
    }
  }

  function clearImage() {
    resetPreviewState();
    setExistingImage("");
    setResetImageOnSave(false);
  }

  function markResetBangumiImage() {
    resetPreviewState();
    setExistingImage("");
    setResetImageOnSave(true);
    setPreviewError("");
  }

  function reopenPicker() {
    if (imageSource !== "bangumi") return;
    setShowCropper(false);
    setShowPicker(true);
    setPreviewError("");
  }

  if (!open) return null;

  const cropperSrc = previewSource
    ? previewSource.startsWith("blob:")
      ? previewSource
      : getProxiedImageUrl(previewSource)
    : "";
  const previewDisplay = finalImage
    ? getProxiedImageUrl(finalImage)
    : cropperSrc || (existingImage && !resetImageOnSave ? getProxiedImageUrl(existingImage) : "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/30 p-4">
      <form
        className={`${panelClass} relative my-4 w-full max-w-lg`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            name: name.trim(),
            extra: extra.trim(),
            comment: comment.trim(),
            image: finalImage || undefined,
            resetImage: resetImageOnSave,
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

        <h3 className="sketch-heading border-none text-2xl pr-8">
          {isEdit ? (isAnime ? "修改番剧" : "修改角色") : isAnime ? "发布番剧" : "发布角色"}
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
            className={`${inputClass} min-h-24 resize-y`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="评价"
          />

          <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/80 p-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="hidden"
              onChange={handleLocalUpload}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-stone-700">封面图片</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${btnSecondaryClass} text-xs`}
                  disabled={previewLoading || cropUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  从本地上传并裁剪
                </button>
                <button
                  type="button"
                  className={`${btnSecondaryClass} text-xs`}
                  disabled={previewLoading || !name.trim()}
                  onClick={fetchBangumiPreview}
                >
                  {previewLoading ? "搜索中…" : "从 Bangumi 搜索并裁剪"}
                </button>
                {(finalImage || previewSource || existingImage) && (
                  <button type="button" className={`${btnSecondaryClass} text-xs`} onClick={clearImage}>
                    清除新封面
                  </button>
                )}
                {isEdit && (
                  <button type="button" className={`${btnSecondaryClass} text-xs`} onClick={markResetBangumiImage}>
                    重新抓取 Bangumi 封面
                  </button>
                )}
              </div>
            </div>

            {previewError && <p className="mt-2 text-xs text-red-600">{previewError}</p>}

            {showPicker && bangumiResults.length > 0 && (
              <BangumiResultPicker
                results={bangumiResults}
                isAnime={isAnime}
                onSelect={applyBangumiSelection}
                onCancel={() => {
                  setShowPicker(false);
                  setBangumiResults([]);
                }}
              />
            )}

            {showCropper && cropperSrc && (
              <div className="mt-3 space-y-2">
                {imageSource === "bangumi" && bangumiResults.length > 1 && (
                  <button type="button" className={`${btnSecondaryClass} w-full text-xs`} onClick={reopenPicker}>
                    重新选择 Bangumi 结果
                  </button>
                )}
                {imageSource === "local" && (
                  <button
                    type="button"
                    className={`${btnSecondaryClass} w-full text-xs`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    重新选择本地图片
                  </button>
                )}
                <ImageCropper
                  src={cropperSrc}
                  confirming={cropUploading}
                  onConfirm={handleCropConfirm}
                  onCancel={() => setShowCropper(false)}
                />
              </div>
            )}

            {resetImageOnSave && (
              <p className="mt-2 text-xs text-amber-700">保存时将按名称重新从 Bangumi 抓取封面</p>
            )}

            {!showCropper && !showPicker && previewDisplay && (
              <div className="mt-3">
                <p className="mb-2 text-xs text-slate-500">
                  {finalImage
                    ? "新封面已就绪，保存后生效"
                    : resetImageOnSave
                      ? "将重新抓取 Bangumi 封面"
                      : isEdit
                        ? "当前封面"
                        : imageSource === "local"
                          ? "本地上传预览"
                          : "Bangumi 原图预览"}
                </p>
                <div className="mx-auto aspect-[3/4] w-full max-w-[200px] overflow-hidden border border-stone-300 bg-white">
                  <img src={previewDisplay} alt="封面预览" className="h-full w-full object-cover" />
                </div>
                {finalImage && previewSource && (
                  <button
                    type="button"
                    className={`${btnSecondaryClass} mt-2 w-full text-xs`}
                    onClick={() => setShowCropper(true)}
                  >
                    重新裁剪
                  </button>
                )}
              </div>
            )}

            {!showCropper && !showPicker && !previewDisplay && (
              <p className="mt-2 text-xs text-slate-500">
                可从相册上传自定义封面，或从 Bangumi 搜索；建议裁剪为 3:4 以适配卡片。不设置封面时将自动抓取 Bangumi 图片。
              </p>
            )}
          </div>
        </div>

        <button type="submit" disabled={submitting || cropUploading} className={`${btnPrimaryClass} mt-4 w-full`}>
          {submitting ? "保存中…" : isEdit ? "保存修改" : "发布"}
        </button>
      </form>
    </div>
  );
}
