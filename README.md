# ACG Personality Analyzer

基于 Next.js + Node.js 的 ACG 偏好人格分析系统，包含：

- 萌娘百科 / Wikipedia 抓取
- 标签提取与归一化
- 12 人格体系计算
- 主 / 副人格输出
- LLM 娱乐性解释
- 词云、雷达图、人格卡片展示

## 项目结构

```text
.
├── frontend
└── backend
```

## 本地运行

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

3. 启动开发环境

```bash
npm run dev
```

默认地址：

- 前端: `http://localhost:3001`
- 后端: `http://localhost:4100`

## 环境变量

### backend/.env

```bash
PORT=4100
OPENROUTER_API_KEY=
OPENROUTER_MODEL=deepseek/deepseek-chat-v3-0324:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
SITE_URL=http://localhost:3001
SITE_NAME=ACG Personality Analyzer
CORS_ORIGIN=http://localhost:3001
```

### frontend/.env.local

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4100/api
```

## API

`POST /api/analyze`

```json
{
  "anime_list": ["Clannad", "进击的巨人", "Re:从零开始的异世界生活"]
}
```

如果未配置 LLM Key，系统会返回本地 fallback 解释，核心人格计算仍可正常工作。

## 部署

### Frontend on Vercel

推荐把仓库导入 Vercel 后，将 Root Directory 设置为 `frontend`，并配置：

- Framework Preset: `Next.js`
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: 留空，使用 Next.js 默认值
- Environment Variable:
  - `NEXT_PUBLIC_API_BASE_URL=https://your-render-domain.onrender.com/api`

### Backend on Render

推荐在 Render 创建一个 `Web Service`，Root Directory 设为 `backend`，并配置：

- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`
- Environment Variables:
  - `PORT=10000`
  - `OPENROUTER_API_KEY=...`
  - `OPENROUTER_MODEL=deepseek/deepseek-chat-v3-0324:free`
  - `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`
  - `SITE_URL=https://your-vercel-domain.vercel.app`
  - `SITE_NAME=ACG Personality Analyzer`
  - `CORS_ORIGIN=https://your-vercel-domain.vercel.app`

仓库中也提供了 [render.yaml](</C:/Users/lishu/Documents/New project/render.yaml>)，可以直接用于 Blueprint 部署。
