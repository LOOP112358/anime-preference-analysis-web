# 全页背景图

把整张手绘背景放到本目录，命名为 **`page-bg.png`**（或 jpg / webp）。

建议：

- 横向略宽于 1920px，文件尽量 **&lt; 500KB**（可用 TinyPNG 压缩）
- 颜色偏浅时效果最好，深色背景可在 `.env.local` 调低透明度

```bash
# frontend/.env.local
NEXT_PUBLIC_SITE_BG_URL=/bg/page-bg.png
NEXT_PUBLIC_SITE_BG_OPACITY=0.88

```

未放置 `page-bg.*` 时，使用简洁的纸感纯色渐变背景。
