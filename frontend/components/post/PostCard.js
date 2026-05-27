"use client";

import { getPostDefaultImage } from "../../lib/postApi";

const DEFAULT_IMG = getPostDefaultImage();

export default function PostCard({ item, onDelete, canDelete }) {
  const isAnime = Boolean(item.ani_id);
  const title = item.ani_name || item.char_name;
  const meta = item.ani_type || (item.char_from ? `出自：${item.char_from}` : "");
  const comment = item.ani_com || item.char_com || "";
  const image = item.ani_img || item.char_img || DEFAULT_IMG;
  const author = item.user_name;

  return (
    <article className="sketch-card overflow-hidden p-0">
      <div className="relative aspect-[16/10] border-b-[1.5px] border-stone-800 bg-gradient-to-br from-moe-pink-soft to-white">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = DEFAULT_IMG;
          }}
        />
        {canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="sketch-btn absolute right-2 top-2 px-2.5 py-1 text-xs"
          >
            删除
          </button>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {author ? <p className="mt-1 text-xs text-slate-500">@{author}</p> : null}
        {meta ? <p className="mt-2 text-xs text-slate-500">{meta}</p> : null}
        {comment ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{comment}</p> : null}
        <span className="sketch-badge mt-2">{isAnime ? "番剧" : "角色"}</span>
      </div>
    </article>
  );
}
