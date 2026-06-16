# ACG 偏好分析仪

基于 **Next.js** + **Node.js** + **Flask** 的 ACG 偏好人格分析与同好社区站点。输入几部动画作品，系统会抓取标签与简介、计算 12 类人格画像，并支持内容推荐、协同推荐与人格报告导出；社区模块可发布番剧 / 角色卡片并与公开片单联动推荐。

仓库地址：[LOOP112358/anime-preference-analysis-web](https://github.com/LOOP112358/anime-preference-analysis-web)

## 功能概览

### 人格分析（首页）

- 输入 **3–9 部**动画作品（支持换行或逗号分隔）
- 数据源：**Bangumi（番组计划）优先**；无结果或内容为空时回退**中文维基百科**
- 标签提取、归一化与 **14 维偏好向量**计算
- **12 人格体系**：输出主人格、副人格与特征标签
- 通过 **OpenRouter** 生成娱乐向 LLM 解读文案
- 可视化：**雷达图**、**词云**、人格卡片
- 支持将分析结果**导出为图片报告**

### 作品推荐（首页「推荐」标签）

| 模式 | 说明 |
|------|------|
| `content` | 基于作品特征向量与本地特征池的余弦相似度 |
| `collaborative` | 基于社区公开用户片单的协同过滤 |
| `hybrid` | 内容 + 协同加权混合（可调 `hybrid_alpha`） |

### 社区发布（`/community`）

- 用户注册 / 登录、个人主页与资料编辑
- 发布 / 编辑 / 删除**番剧卡片**与**角色卡片**
- 番剧广场、角色广场、收藏与「同好」浏览
- 自动从 Bangumi 拉取封面、类型与角色图
- 社区片单可作为协同推荐的公开数据源（`USER_LISTS_API_URL`）

### 站点能力

- 访问量统计（`/api/stats/visit`）
- 页脚意见反馈（写入 `backend/data/feedback.jsonl`）
- 可选打赏 / 品牌背景等前端配置（见 `frontend/.env.example`）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14、React 18、Tailwind CSS、ECharts、wordcloud |
| 分析后端 | Node.js、Express、Cheerio、Axios |
| 社区后端 | Python 3、Flask、PyMySQL |
| 部署 | GitHub Actions → 阿里云（PM2）；分析后端亦可单独部署到 Render |

## 项目结构

```text
.
├── frontend/                 # Next.js 前端（人格分析 + 社区 UI）
├── backend/                  # Node 分析 / 推荐 API
│   ├── routes/               # analyze、recommend、stats、feedback
│   ├── services/             # 抓取、特征提取、人格引擎、LLM、推荐
│   ├── data/                 # 特征池、mock 片单、反馈存储
│   └── user_post_backend/    # Flask 社区 API（MySQL）
├── .github/workflows/        # 推送 main 自动部署
├── render.yaml               # Render 后端 Blueprint（可选）
└── package.json              # npm workspaces 根脚本
```

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

在 `backend/.env` 中填入 `OPENROUTER_API_KEY`（人格分析 LLM 解读需要）。

### 3. 启动人格分析（Node + Next）

```bash
npm run dev
```

默认地址：

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3001 |
| 人格分析 / 推荐 | http://localhost:3001（同源 `/api` 反代） |
| Node 后端（直连） | http://localhost:4100 |
| 社区页面 | http://localhost:3001/community |

也可分别启动：

```bash
npm run dev:frontend
npm run dev:backend
```

### 4. 启动社区后端（可选）

社区发布、协同推荐依赖 Flask 服务。详见 [`backend/user_post_backend/README.md`](backend/user_post_backend/README.md)。

```bash
cd backend/user_post_backend
pip install -r requirements.txt
# 配置 MySQL 并导入 DB/ani.sql
python app.py
```

默认地址：`http://127.0.0.1:5001`（前端通过 `/post-api` 反代访问）。

本地联调协同推荐时，可在 `backend/.env` 配置：

```bash
RECOMMEND_DEV_FIXTURES=1
USER_LISTS_API_URL=http://localhost:4100/api/dev/mock-user-lists
```

## 环境变量

### `backend/.env`

```bash
PORT=4100
OPENROUTER_API_KEY=
OPENROUTER_MODEL=deepseek/deepseek-chat-v3-0324:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
SITE_URL=http://localhost:3001
SITE_NAME=ACG Personality Analyzer
CORS_ORIGIN=http://localhost:3001

# 抓取（Bangumi + 维基回退，分析 / 推荐共用）
# SCRAPER_FETCH_TIMEOUT_MS=22000
# SCRAPER_WIKI_ENABLED=1
# SCRAPER_HTTPS_PROXY=

# 协同 / 混合推荐：公开用户片单 API
# USER_LISTS_API_URL=http://127.0.0.1:5001/anime/list

# 本地 mock 片单（需 RECOMMEND_DEV_FIXTURES=1）
# RECOMMEND_DEV_FIXTURES=1
# USER_LISTS_API_URL=http://localhost:4100/api/dev/mock-user-lists
```

### `frontend/.env.local`

浏览器端 API 走同源 `/api` 与 `/post-api`（由 `next.config.mjs` 反代），一般无需填写 `NEXT_PUBLIC_API_BASE_URL`。可选配置见 `frontend/.env.example`（页脚反馈、打赏链接、站点背景等）。

## API 说明

Node 后端根路径：`http://localhost:4100`（生产环境经前端反代为 `/api`）。

### `GET /health`

健康检查，返回服务状态与 `dimension_count: 14`。

### `POST /api/analyze`

根据 **3–9 部**作品进行人格分析。

**Request**

```json
{
  "anime_list": ["Clannad", "进击的巨人", "Re:从零开始的异世界生活"]
}
```

- `anime_list`：必填，去重去空后长度须在 3–9 之间

**12 类人格**（`primary_type` / `secondary_type` 取值）：

治愈型投射者 · 深渊观察者 · 热血行动派 · 幻想逃逸者 · 情感依赖者 · 理性解构者 · 戏剧沉浸者 · 日常享乐者 · 冲突追求者 · 浪漫理想家 · 自我投射者 · 平衡探索者

**14 维偏好**（`dimensions` 字段）：

| 键 | 中文 |
|----|------|
| `healing` | 治愈 |
| `dark` | 黑暗 |
| `passion` | 热血 |
| `suspense` | 悬疑 |
| `fantasy` | 幻想 |
| `realism` | 现实 |
| `daily` | 日常 |
| `emotion` | 感性 |
| `bond` | 关系 |
| `growth` | 成长 |
| `logic` | 理性 |
| `narrative` | 叙事 |
| `humor` | 幽默 |
| `music` | 音乐 |

**Response 示例**

```json
{
  "success": true,
  "data": {
    "primary_type": "戏剧沉浸者",
    "secondary_type": "自我投射者",
    "traits": ["戏剧浓度高", "情绪投入深", "接受沉重表达"],
    "dimensions": { "healing": 0.52, "dark": 0.84, "emotion": 0.91 },
    "dimension_keys": ["healing", "dark", "..."],
    "dimension_labels": { "healing": "治愈", "dark": "黑暗" },
    "analysis": "你的 ACG 偏好显示出明显的理想主义与共情倾向...",
    "works": [{ "title": "Clannad", "source": "bangumi", "moe_tags": ["治愈"] }],
    "feature_cloud": [{ "text": "成长", "value": 12 }],
    "aggregated_features": { "治愈": 0.71, "黑暗": 0.84 }
  }
}
```

### `POST /api/recommend`

基于作品列表推荐相似番剧。

**Request**

```json
{
  "mode": "hybrid",
  "anime_list": ["Clannad", "紫罗兰永恒花园"],
  "limit": 10,
  "min_overlap": 1,
  "hybrid_alpha": 0.7
}
```

| 参数 | 说明 |
|------|------|
| `mode` | `content` / `collaborative` / `hybrid`，默认 `content` |
| `anime_list` | 必填，1–40 部 |
| `limit` | 返回条数，默认 10，最大 50 |
| `min_overlap` | 协同模式最小重叠作品数 |
| `hybrid_alpha` | 混合模式中内容权重（0–1），默认 0.7 |
| `exclude_user_id` | 协同 / 混合时排除指定用户 |

### `GET|POST /api/stats/visit`

`GET` 读取累计访问量；`POST` 记录一次访问并返回最新计数。

### `POST /api/feedback`

提交站点反馈，写入 `backend/data/feedback.jsonl`。

```json
{ "message": "反馈内容", "nickname": "可选昵称" }
```

## 开发与测试

```bash
# 重建推荐特征池（修改抓取逻辑后）
npm run build:feature-pool --workspace backend

# 推荐接口本地测试
npm run test:recommend
```

## 部署

### 阿里云（主站，含三服务）

推送 `main` 分支触发 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)：

1. GitHub Actions 构建前端 `.next`
2. SSH 同步至服务器 `/opt/anime-app`
3. PM2 启动 `acg-node-backend`（:4100）、`acg-py-backend`（:5001）、`acg-frontend`（:3001）

需在仓库 Secrets 配置：`SSH_PRIVATE_KEY`、`SERVER_IP`、`SERVER_USER`、`SERVER_PORT`，并在服务器准备 Node、Python、MySQL 与 `backend/.env`。

### Render（仅 Node 分析后端，可选）

[`render.yaml`](render.yaml) 提供分析后端的 Blueprint；前端与 Flask 社区需另行部署。记得在 Render 控制台配置 `OPENROUTER_API_KEY`、`CORS_ORIGIN`、`SITE_URL`。

## 说明

- 人格分析与 LLM 文案仅供**娱乐参考**，不构成心理测评结论。
- Bangumi / 维基抓取受网络环境影响；云服务器访问维基可能需配置代理（见 `backend/.env.example` 注释）。
- 社区模块密码为明文存储，适用于课程 / 演示场景，**请勿用于生产敏感数据**。

## License

未指定开源协议时，默认保留所有权利。如需二次分发请先与仓库维护者确认。
