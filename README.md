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

- 前端: `http://localhost:3001`（首页人格分析 / 推荐）
- 社区发布: `http://localhost:3001/community`
- Node 分析后端: `http://localhost:4100`
- Python 用户发布后端（可选）: `http://127.0.0.1:5000`

社区发布需单独启动 Flask（见 `backend/user_post_backend/README.md`）：

```bash
cd backend/user_post_backend
pip install -r requirements.txt
python app.py
```

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
NEXT_PUBLIC_POST_API_URL=http://127.0.0.1:5000
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


测试部署同步


