/** 站点背景图路径，可在 .env.local 覆盖 */

export const SITE_BG_URL = process.env.NEXT_PUBLIC_SITE_BG_URL || "/bg/page-bg.png";

/** 背景图不透明度 0–1 */
export const SITE_BG_OPACITY = Number(process.env.NEXT_PUBLIC_SITE_BG_OPACITY ?? "0.9");
