import axios from "axios";

function buildAnimeFallbackAnalysis({ primaryType, secondaryType, traits, sourceTitles }) {
  const joinedTraits = traits.slice(0, 4).join("、") || "偏好较均衡";
  return {
    analysis: `你的 ACG 偏好整体更接近“${primaryType}”，副人格表现为“${secondaryType}”。从《${sourceTitles.join("》《")}》的组合来看，你会被${joinedTraits}这类体验持续吸引，更容易在作品里寻找情绪共鸣、世界观代入或叙事刺激。这是一种娱乐向的口味画像，不代表严格心理测量结果，但很适合用来描述你看番时最稳定的快乐来源。`,
    provider: "fallback",
  };
}

function buildAnimePrompt({ primaryType, secondaryType, traits, dimensions, sourceTitles }) {
  return `
你是 ACG 偏好人格分析助手。请根据以下结果，用简体中文输出一段 220-320 字的娱乐性分析，不要使用列表。

作品：${sourceTitles.join("、")}
主人格：${primaryType}
副人格：${secondaryType}
特征：${traits.join("、")}
维度：${Object.entries(dimensions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key, value]) => `${key}:${value}`)
    .join(", ")}

请覆盖：
1. 用户偏好解释
2. 性格描述（娱乐性）
3. 情感需求分析

要求：语言自然、不要太像心理咨询、明确说明这是 ACG 娱乐型画像。
`.trim();
}

async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return null;
  }

  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const model = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324:free";
  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    },
    {
      timeout: 20000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3001",
        "X-Title": process.env.SITE_NAME || "ACG Personality Analyzer",
      },
    },
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || null;
}

export async function generateAnalysis(payload) {
  try {
    const analysis = await callOpenRouter(buildAnimePrompt(payload));
    if (analysis) {
      return { analysis, provider: "openrouter" };
    }
  } catch (_error) {
    // fall through
  }

  return buildAnimeFallbackAnalysis(payload);
}
