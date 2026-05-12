# ACG Personality Analyzer

基于 Next.js + Node.js 的 ACG 偏好人格分析系统，包含：

- Bangumi（番组计划）优先；无可用内容时回退中文维基百科
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

## API 接口约定（团队开发版）

本项目前后端通过 HTTP + JSON 通信，统一以 `success` 字段表示请求是否成功。  
默认后端地址：`http://localhost:4100`，前端通过 `NEXT_PUBLIC_API_BASE_URL` 访问（如 `http://localhost:4100/api`）。

### 1) 全局约定

#### Base URL

- 本地开发：`http://localhost:4100/api`
- 线上示例：`https://your-backend-domain/api`

#### Content-Type

- 请求头统一使用：`Content-Type: application/json`

#### 成功响应结构

```json
{
  "success": true,
  "data": {}
}
```

#### 失败响应结构

```json
{
  "success": false,
  "error": "错误信息"
}
```

#### 状态码约定（建议）

当前后端实现中，业务异常多数会走 `500`。团队协作时建议按下列规则逐步收敛：

- `200`：请求成功
- `400`：参数错误（如数组长度不满足 3-9）
- `404`：资源不存在
- `500`：服务内部异常

### 2) 健康检查与服务信息

#### GET `/`

服务说明接口。

Response:

```json
{
  "success": true,
  "service": "acg-personality-analyzer-backend",
  "message": "Use POST /api/analyze for analysis requests."
}
```

#### GET `/health`

健康检查接口（部署平台探活使用）。

Response:

```json
{
  "success": true,
  "service": "acg-personality-analyzer-backend",
  "timestamp": "2026-04-30T07:00:00.000Z"
}
```

### 3) 人格分析接口（作品）

#### POST `/api/analyze`

根据用户输入的 3-9 部作品进行人格分析。每部作品优先在 Bangumi 按动画分类搜索并取第一条匹配条目的标签与简介；若 Bangumi 无结果或正文/标签为空，再尝试中文维基百科的分类与导语段落。

Request Body:

```json
{
  "anime_list": ["Clannad", "进击的巨人", "Re:从零开始的异世界生活"]
}
```

参数说明：

- `anime_list`: `string[]`，必填
- 输入会先去重并去除空字符串
- 去重后长度必须在 `3-9` 之间，否则报错

`primary_type` / `secondary_type` 取值来自项目自定义 12 类人格：

- 治愈型投射者
- 深渊观察者
- 热血行动派
- 幻想逃逸者
- 情感依赖者
- 理性解构者
- 戏剧沉浸者
- 日常享乐者
- 冲突追求者
- 浪漫理想家
- 自我投射者
- 平衡探索者

Success Response（字段示例）:

```json
{
  "success": true,
  "data": {
    "primary_type": "戏剧沉浸者",
    "secondary_type": "自我投射者",
    "traits": [
      "情绪投入",
      "高代入感",
      "戏剧浓度高",
      "现实映照"
    ],
    "dimensions": {
      "healing": 0.52,
      "dark": 0.84,
      "passion": 0.41,
      "fantasy": 0.57,
      "realism": 0.69,
      "projection": 0.88,
      "escape": 0.36,
      "stimulation": 0.63,
      "analytical": 0.55,
      "emotional": 0.91,
      "relationship_focus": 0.67,
      "individual_focus": 0.48,
      "plot_complex": 0.72,
      "daily": 0.33
    },
    "analysis": "你的 ACG 偏好显示出明显的理想主义与共情倾向...",
    "works": [
      {
        "title": "Clannad",
        "features": ["治愈", "成长", "情感"]
      }
    ],
    "feature_cloud": [
      {
        "text": "成长",
        "value": 12
      }
    ],
    "aggregated_features": {
      "治愈": 0.71,
      "黑暗": 0.84,
      "代入": 0.89,
      "情感": 0.76
    }
  }
}
```

Error Response:

```json
{
  "success": false,
  "error": "anime_list length must be between 3 and 9 after deduplication"
}
```

### 4) 前端调用约定（当前实现）

前端统一通过 `frontend/lib/api.js` 调用：

- `analyzeAnimeList(animeList)` -> `POST /api/analyze`

调用端默认假设返回结构为：

- `response.ok === true`
- `payload.success === true`
- 数据在 `payload.data`

### 5) 新模块接口预留（发布 + 推荐）

以下是组员开发二期功能时需要遵守的接口草案，先统一协议再实现。

#### 5.1 发布模块（Posts）

##### POST `/api/posts`

创建一条发布内容（可关联人格分析结果）。

Request:

```json
{
  "title": "我的 ACG 人格测试结果",
  "content": "原来我是理想主义型！",
  "visibility": "public",
  "tags": ["戏剧沉浸者", "高代入"],
  "analysis_snapshot": {
    "primary_type": "戏剧沉浸者",
    "secondary_type": "自我投射者"
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "post_xxx",
    "title": "我的 ACG 人格测试结果",
    "created_at": "2026-04-30T07:00:00.000Z"
  }
}
```

##### GET `/api/posts?page=1&page_size=20`

获取发布列表（按时间倒序）。

##### GET `/api/posts/:id`

获取单条发布详情。

##### DELETE `/api/posts/:id`

删除指定发布内容。

#### 5.2 推荐模块（Recommendations）

##### POST `/api/recommendations`

基于作品输入 + 人格结果返回推荐列表。

Request:

```json
{
  "anime_list": ["Clannad", "进击的巨人", "Re:从零开始的异世界生活"],
  "personality": {
    "primary_type": "戏剧沉浸者",
    "secondary_type": "自我投射者"
  },
  "limit": 10
}
```

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "title": "紫罗兰永恒花园",
        "type": "anime",
        "reason": "与你的高共情和成长叙事偏好匹配",
        "score": 0.91
      }
    ]
  }
}
```

### 6) 团队联调 Checklist

- 新增接口必须在 README 追加请求/响应示例
- 错误返回必须包含 `success: false` 与 `error`
- 参数校验失败优先返回 `400`（建议）
- PR 描述中必须附带至少 1 个可复现的请求示例

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
