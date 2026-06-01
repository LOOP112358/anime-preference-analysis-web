"use client";

import { getPostDefaultImage } from "../../lib/postApi";

const DEFAULT_IMG = getPostDefaultImage();

export default function PostCard({ item, onDelete, canDelete, onFavorite, isFav }) {
  const isAnime = Boolean(item.ani_id);
  const title = item.ani_name || item.char_name;
  const meta = item.ani_type || (item.char_from ? `出自：${item.char_from}` : "");
  const comment = item.ani_com || item.char_com || "";
  const image = item.ani_img || item.char_img || DEFAULT_IMG;
  const author = item.user_name;

  const aspect = isAnime ? "aspect-[16/10]" : "aspect-[3/4]";

  return (
    <article className="sketch-card overflow-hidden p-0">
      <div className={`relative ${aspect} border-b-[1.5px] border-stone-800 bg-white`}>
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover"
          onError={(e) => (e.currentTarget.src = DEFAULT_IMG)}
        />

        <button
          onClick={() => onFavorite?.(item)}
          className="absolute right-2 top-2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center"
        >
          {isFav ? "❤️" : "🤍"}
        </button>

        {canDelete && (
          <button
            onClick={onDelete}
            className="sketch-btn absolute left-2 top-2 px-2.5 py-1 text-xs"
          >
            删除
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {author && <p className="mt-1 text-xs text-slate-500">@{author}</p>}
        {meta && <p className="mt-2 text-xs text-slate-500">{meta}</p>}
        {comment && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{comment}</p>}
        <span className="sketch-badge mt-2">{isAnime ? "番剧" : "角色"}</span>
      </div>
    </article>
  );
}