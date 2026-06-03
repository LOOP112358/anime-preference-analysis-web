"use client";

import { useState } from "react";
import { getPostDefaultImage, resolvePostImageUrl } from "../../lib/postApi";
import PostCommentModal from "./PostCommentModal";

const COMMENT_PREVIEW_THRESHOLD = 88;

function commentNeedsExpand(comment) {
  if (!comment) return false;
  if (comment.length > COMMENT_PREVIEW_THRESHOLD) return true;
  return comment.split("\n").length > 3;
}

export default function PostCard({
  item,
  onDelete,
  onEdit,
  canDelete,
  canEdit,
  onFavorite,
  isFav,
  onAuthorClick,
  favoriteCountClickable,
  onFavoriteCountClick,
}) {
  const [commentOpen, setCommentOpen] = useState(false);

  const isAnime = Boolean(item.ani_id);
  const title = item.ani_name || item.char_name;
  const meta = item.ani_type || (item.char_from ? `出自：${item.char_from}` : "");
  const comment = item.ani_com || item.char_com || "";
  const image = resolvePostImageUrl(item.ani_img || item.char_img) || getPostDefaultImage();
  const author = item.user_name;
  const favoriteCount = Number(item.favorite_count) || 0;
  const showExpand = commentNeedsExpand(comment);

  return (
    <article className="sketch-card overflow-hidden p-0">
      <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden border-b-[1.5px] border-stone-800 bg-stone-100">
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getPostDefaultImage();
          }}
        />

        {onFavorite && (
          <button
            type="button"
            onClick={() => onFavorite(item)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white/90 text-lg leading-none shadow-sm hover:bg-white"
            aria-label={isFav ? "取消收藏" : "收藏"}
          >
            <span className={isFav ? "text-amber-500" : "text-stone-400"}>{isFav ? "★" : "☆"}</span>
          </button>
        )}

        {(canEdit || canDelete) && (
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {canEdit && (
              <button type="button" onClick={() => onEdit?.(item)} className="sketch-btn px-2.5 py-1 text-xs">
                修改
              </button>
            )}
            {canDelete && (
              <button type="button" onClick={onDelete} className="sketch-btn px-2.5 py-1 text-xs">
                删除
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {author && (
          <p className="mt-1 text-xs">
            {onAuthorClick ? (
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700 hover:underline"
                onClick={() => onAuthorClick(item.user_id)}
              >
                @{author}
              </button>
            ) : (
              <span className="text-slate-500">@{author}</span>
            )}
          </p>
        )}
        {meta && <p className="mt-2 text-xs text-slate-500">{meta}</p>}
        {comment ? (
          <div className="mt-2">
            {showExpand ? (
              <p className="line-clamp-3 text-sm leading-6 text-slate-600">{comment}</p>
            ) : (
              <p className="text-sm leading-6 text-slate-600">{comment}</p>
            )}
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="sketch-badge">{isAnime ? "番剧" : "角色"}</span>
          {showExpand ? (
            <button
              type="button"
              className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
              onClick={() => setCommentOpen(true)}
            >
              查看全文
            </button>
          ) : null}
          {favoriteCountClickable ? (
            <button
              type="button"
              className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline"
              onClick={() => onFavoriteCountClick?.(item)}
            >
              收藏 {favoriteCount}
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">收藏 {favoriteCount}</span>
          )}
        </div>
      </div>

      <PostCommentModal
        open={commentOpen}
        title={title}
        author={author}
        comment={comment}
        onClose={() => setCommentOpen(false)}
      />
    </article>
  );
}
