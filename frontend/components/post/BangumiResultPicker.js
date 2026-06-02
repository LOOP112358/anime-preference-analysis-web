"use client";

import { getProxiedImageUrl } from "../../lib/postApi";
import { btnSecondaryClass } from "../ui";

function displayTitle(item) {
  const cn = item.name_cn?.trim();
  const jp = item.name?.trim();
  if (cn && jp && cn !== jp) return `${cn} / ${jp}`;
  return cn || jp || "未命名";
}

function displayMeta(item, isAnime) {
  if (isAnime) {
    const parts = [item.date, item.ani_type !== "未知" ? item.ani_type : ""].filter(Boolean);
    return parts.join(" · ");
  }
  return item.summary || "";
}

export default function BangumiResultPicker({ results, isAnime, onSelect, onCancel }) {
  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-slate-600">
        Bangumi 找到 {results.length} 个{isAnime ? "番剧" : "角色"}，请点击选择正确的一项后再裁剪：
      </p>

      <div className="grid max-h-[320px] gap-2 overflow-y-auto sm:grid-cols-2">
        {results.map((item) => {
          const img = getProxiedImageUrl(isAnime ? item.ani_img : item.char_img);
          const meta = displayMeta(item, isAnime);

          return (
            <button
              key={item.id || img}
              type="button"
              onClick={() => onSelect(item)}
              className="flex gap-3 rounded-lg border border-stone-300 bg-white p-2 text-left transition hover:border-stone-800 hover:shadow-sm"
            >
              <div className="h-20 w-14 shrink-0 overflow-hidden border border-stone-200 bg-stone-100">
                <img src={img} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-stone-800">{displayTitle(item)}</p>
                {meta && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{meta}</p>}
              </div>
            </button>
          );
        })}
      </div>

      {onCancel && (
        <button type="button" className={`${btnSecondaryClass} w-full text-xs`} onClick={onCancel}>
          取消选择
        </button>
      )}
    </div>
  );
}
