// ============================================================
// LLM 服务 — 基于 RAG 检索结果生成回答
// 模拟真实 LLM 的工作方式：
//   1. 接收用户查询
//   2. 从知识库检索相关文档（RAG 检索）
//   3. 拼接 system prompt + retrieved context
//   4. 生成符合「准确、通俗、避免夸张」原则的回答
// ============================================================

import { retrieve, getLevelText } from "./ragEngine.js";
import { findByTopic } from "../data/knowledgeBase.js";

// ============ Prompt 构建 ============

/**
 * 构建 system prompt — 约束 AI 的回答风格和原则
 */
const SYSTEM_PROMPT = [
  "你是一位核能科普导师，面向普通公众和学生解答核能相关问题。",
  "",
  "回答原则：",
  "1. 准确：基于提供的知识库内容回答，不编造数据或参数",
  "2. 通俗：使用日常语言解释，必要时用类比帮助理解",
  "3. 避免夸张：不使用极端措辞",
  "4. 如知识库中无直接相关内容，诚实告知并建议方向",
  "5. 区分事实与观点，对有争议的话题保持中立",
].join("\n");

/**
 * 构建 RAG context — 将检索到的文档拼入 prompt
 */
function buildContext(retrievedDocs, level) {
  if (!retrievedDocs || retrievedDocs.length === 0) {
    return "[知识库未检索到相关内容]";
  }

  const levelName = level === 1 ? "基础" : level === 2 ? "科学" : "工程";

  const contextParts = retrievedDocs.map((r, i) => {
    const text = getLevelText(r.doc, level);
    return "【条目" + (i + 1) + "】主题：" + r.topic + "\n相关度：" + Math.round(r.score * 100) + "%\n" + levelName + "级解释：" + text;
  });

  return contextParts.join("\n\n---\n\n");
}

// ============ 回答生成 ============

/**
 * 模拟 LLM 生成回答
 * 在完整版本中，这里会调用真实的大语言模型 API（如 GPT/Claude/通义千问）
 *
 * @param {string} query - 用户问题
 * @param {number} level - 知识层级 1/2/3
 * @returns {{
 *   answer: string,
 *   retrievedDocs: array,
 *   context: string,
 *   sourceTopics: string[]
 * }}
 */
export function generateAnswer(query, level) {
  if (level === undefined || level === null) level = 1;

  // Step 1: RAG 检索
  const retrievedDocs = retrieve(query, 3);

  // Step 2: 构建 context
  const context = buildContext(retrievedDocs, level);

  // Step 3: 生成回答
  let answer = "";

  if (retrievedDocs.length === 0 || retrievedDocs[0].score < 0.01) {
    // 无匹配结果
    answer = generateNoMatchResponse(query, level);
  } else if (retrievedDocs[0].score > 0.15) {
    // 高置信度匹配：直接使用知识库内容，添加引导语
    answer = generateHighConfidenceResponse(query, retrievedDocs, level);
  } else {
    // 中低置信度：综合多个条目生成回答
    answer = generateMediumConfidenceResponse(query, retrievedDocs, level);
  }

  return {
    answer,
    retrievedDocs: retrievedDocs.map((r) => ({
      topic: r.topic,
      score: r.score,
    })),
    context,
    sourceTopics: retrievedDocs.map((r) => r.topic),
  };
}

/**
 * 高置信度回答（直接使用知识库内容）
 */
function generateHighConfidenceResponse(query, docs, level) {
  const primary = docs[0];
  const text = getLevelText(primary.doc, level);

  let response = text;

  // 如果有第二个相关条目，添加补充信息
  if (docs.length > 1 && docs[1].score > 0.05) {
    const supplement = getLevelText(docs[1].doc, level);
    // 取补充内容的前半段作为概述
    const supplementShort = supplement.length > 80
      ? supplement.slice(0, 80) + "..."
      : supplement;
    response += "\n\n补充：关于「" + docs[1].topic + "」，" + supplementShort;
  }

  return response;
}

/**
 * 中低置信度回答（综合多个条目）
 */
function generateMediumConfidenceResponse(query, docs, level) {
  const parts = [];
  const mainDoc = docs[0];
  const text = getLevelText(mainDoc.doc, level);

  parts.push(text);

  // 添加来源说明
  parts.push(
    "\n（以上信息基于知识库中「" + mainDoc.topic + "」等条目整理，相关度约 " +
    Math.round(mainDoc.score * 100) + "%）"
  );

  return parts.join("\n\n");
}

/**
 * 无匹配回答
 */
function generateNoMatchResponse(query, level) {
  const suggestions = {
    1: "我目前的知识库主要覆盖核裂变原理、压水堆、核安全、控制棒、核废料、辐射防护、核聚变、核电经济性、小型堆（SMR）、中国核电发展等主题。你可以试试这些问题，或者换个方式提问。",
    2: "当前知识库覆盖核物理基础、反应堆工程、核安全、核燃料循环、辐射防护等约 22 个主题。建议尝试：什么是核裂变？压水堆如何工作？核废料怎么处理？",
    3: "RAG 知识库包含约 22 条三级标注条目，覆盖核工程全谱系。当前查询未匹配到高相关度内容。可尝试更具体的关键词，如「压力容器材料」「控制棒落棒时间」「一回路参数」等。",
  };

  return "这个问题在我的知识库中没有找到直接相关的内容。\n\n" + suggestions[level];
}

// ============ 真实 LLM 调用（生产服务器代理） ============

/**
 * 调用生产服务器代理的 DeepSeek —— API 密钥只存在服务端环境变量里，
 * 前端代码不接触任何密钥。失败（未配置/网络错误）时返回 null，
 * 由调用方回退到本地 RAG 模拟，保证任何环境都能用。
 *
 * @param {string} query - 用户问题
 * @param {number} level - 知识层级 1/2/3
 * @param {string} context - RAG 检索拼接的 context（可选）
 * @returns {Promise<string|null>}
 */
export async function generateAnswerRemote(query, level, context) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, level, context }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.answer === "string" && data.answer ? data.answer : null;
  } catch {
    return null;
  }
}

// ============ 层级切换：仅返回对应深度文本 ============

/**
 * 当用户切换知识层级时，直接从已检索的文档中返回对应层级的文本
 * 不需要重新检索，只需切换文本深度
 *
 * @param {array} sourceTopics - 之前检索到的主题列表
 * @param {number} level - 新的知识层级
 * @returns {string} 对应层级的文本
 */
export function getAnswerByLevel(sourceTopics, level) {
  if (!sourceTopics || sourceTopics.length === 0) return "";

  const primary = findByTopic(sourceTopics[0]);
  if (!primary) return "";

  let text = getLevelText(primary, level);

  // 如果有多个来源，添加补充
  if (sourceTopics.length > 1) {
    const second = findByTopic(sourceTopics[1]);
    if (second) {
      const supplement = getLevelText(second, level);
      const supplementShort =
        supplement.length > 80 ? supplement.slice(0, 80) + "..." : supplement;
      text += "\n\n补充：关于「" + sourceTopics[1] + "」，" + supplementShort;
    }
  }

  return text;
}
