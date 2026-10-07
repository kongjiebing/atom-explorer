// ============================================================
// RAG 引擎 — 文本检索核心
// 流程: 查询 → 分词 → TF-IDF 向量化 → 余弦相似度 → Top-K 检索
// ============================================================

import { knowledgeBase } from "../data/knowledgeBase.js";

// ============ 中文分词 ============
// 采用 N-gram + 关键词匹配的轻量级中文分词方案
// 适用于前端 Demo，无需加载完整分词库

// 核能领域词典（优先匹配）
const NUCLEAR_DICT = [
  "核裂变", "核聚变", "压水堆", "沸水堆", "重水堆", "快堆", "高温气冷堆",
  "反应堆", "控制棒", "安全壳", "压力容器", "蒸汽发生器", "堆芯", "燃料组件",
  "核燃料", "乏燃料", "核废料", "放射性", "辐射", "剂量", "屏蔽",
  "冷却剂", "慢化剂", "一回路", "二回路", "链式反应", "临界", "反应性",
  "纵深防御", "安全文化", "严重事故", "熔毁", "核安全",
  "铀235", "铀-235", "二氧化铀", "浓缩", "富集", "后处理", "玻璃固化",
  "核不扩散", "IAEA", "保障监督", "退役", "去污",
  "核电站", "汽轮机", "发电机", "主泵", "稳压器", "传热管",
  "切尔诺贝利", "福岛", "三哩岛", "华龙一号", "玲龙一号", "国和一号",
  "小型堆", "SMR", "模块化", "托卡马克", "ITER", "等离子体",
  "清洁能源", "碳排放", "温室气体", "基荷", "调峰", "容量因子",
  "经济性", "度电成本", "建设周期", "退役",
  "供热", "制氢", "海水淡化", "热电联产",
  "中子", "质子", "伽马", "阿尔法", "贝塔", "希沃特",
  "银铟镉", "Ag-In-Cd", "硼酸", "MOX", "Inconel",
  "SCRAM", "安注", "喷淋", "LCOE",
];

// 通用停用词
const STOP_WORDS = new Set([
  "的", "了", "是", "在", "我", "有", "和", "就", "不", "人", "都",
  "一", "一个", "上", "也", "很", "到", "说", "要", "去", "你",
  "会", "着", "没有", "看", "好", "自己", "这", "那", "什么", "怎么",
  "为什么", "可以", "什么", "哪些", "哪个", "怎样", "如何",
  "吗", "呢", "吧", "啊", "哦", "嗯", "呀",
  "它", "他", "她", "它们", "他们", "这个", "那个", "这些", "那些",
  "关于", "对于", "根据", "通过", "由于", "因为", "所以", "但是",
  "而且", "并且", "或者", "还是", "以及", "以", "为",
  "把", "被", "让", "使", "给", "跟", "和", "与", "及",
  "从", "向", "往", "到", "在", "于", "中", "上", "下",
  "比较", "比", "更", "最", "非常", "特别", "十分",
  "已经", "正在", "将", "会", "能", "可以", "可能", "应该",
  "问", "请问", "请", "想", "知道", "了解", "告诉",
  "the", "a", "an", "is", "are", "was", "were", "what", "how", "why",
]);

/**
 * 中文分词
 * 策略：1) 词典优先匹配 2) 英文单词提取 3) 中文二元/三元 gram
 */
export function tokenize(text) {
  if (!text) return [];
  const tokens = [];
  let remaining = text.toLowerCase();

  // 1) 优先匹配领域词典
  for (const word of NUCLEAR_DICT) {
    const lower = word.toLowerCase();
    let idx = remaining.indexOf(lower);
    while (idx !== -1) {
      tokens.push(lower);
      // 用空格替换已匹配的部分，避免重复匹配
      remaining =
        remaining.slice(0, idx) +
        " ".repeat(lower.length) +
        remaining.slice(idx + lower.length);
      idx = remaining.indexOf(lower);
    }
  }

  // 2) 英文单词提取
  const englishWords = remaining.match(/[a-z]+/g) || [];
  for (const w of englishWords) {
    if (w.length > 1 && !STOP_WORDS.has(w)) {
      tokens.push(w);
    }
  }

  // 3) 中文二元 gram（对未匹配的中文部分）
  const chineseChars = remaining.match(/[\u4e00-\u9fff]+/g) || [];
  for (const segment of chineseChars) {
    if (segment.length <= 2) {
      if (!STOP_WORDS.has(segment)) tokens.push(segment);
    } else {
      for (let i = 0; i < segment.length - 1; i++) {
        const bigram = segment.slice(i, i + 2);
        if (!STOP_WORDS.has(bigram)) tokens.push(bigram);
      }
      // 单字（用于短查询）
      for (const ch of segment) {
        if (!STOP_WORDS.has(ch)) tokens.push(ch);
      }
    }
  }

  return tokens;
}

// ============ TF-IDF 向量化 ============

/**
 * 计算词频 (Term Frequency)
 */
function computeTF(tokens) {
  const tf = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  // 归一化
  const total = tokens.length;
  for (const key in tf) {
    tf[key] = tf[key] / total;
  }
  return tf;
}

/**
 * 计算逆文档频率 (Inverse Document Frequency)
 * IDF(t) = log(N / (df(t) + 1))，使用平滑处理
 */
let _idfCache = null;

function computeIDF() {
  if (_idfCache) return _idfCache;

  const N = knowledgeBase.length;
  const df = {}; // 每个词出现在多少篇文档中

  for (const doc of knowledgeBase) {
    // 将 topic + tags + 三级文本都作为文档内容
    const fullText = [
      doc.topic,
      doc.tags.join(" "),
      doc.basic,
      doc.science,
      doc.engineering,
    ].join(" ");

    const tokens = tokenize(fullText);
    const uniqueTokens = new Set(tokens);

    for (const t of uniqueTokens) {
      df[t] = (df[t] || 0) + 1;
    }
  }

  const idf = {};
  for (const t in df) {
    idf[t] = Math.log((N + 1) / (df[t] + 1)) + 1; // +1 平滑
  }

  _idfCache = idf;
  return idf;
}

/**
 * 构建文档的 TF-IDF 向量
 */
function buildDocVector(tokens, idf) {
  const tf = computeTF(tokens);
  const vector = {};
  for (const t in tf) {
    const idfValue = idf[t] || 1; // 未登录词给默认 IDF
    vector[t] = tf[t] * idfValue;
  }
  return vector;
}

// ============ 余弦相似度 ============

/**
 * 计算两个向量的余弦相似度
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  // 计算 A·B 和 |A|
  for (const key in vecA) {
    normA += vecA[key] * vecA[key];
    if (key in vecB) {
      dotProduct += vecA[key] * vecB[key];
    }
  }

  // 计算 |B|
  for (const key in vecB) {
    normB += vecB[key] * vecB[key];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============ 预构建文档向量索引 ============

let _docVectors = null;

// Topic/tags 权重倍率：让主题名和标签匹配获得更高得分
const TOPIC_WEIGHT = 3.0;
const TAG_WEIGHT = 2.0;

function buildDocumentIndex() {
  if (_docVectors) return _docVectors;

  const idf = computeIDF();
  _docVectors = knowledgeBase.map((doc, index) => {
    // 分层构建文档向量：topic + tags 给更高权重
    const topicTokens = tokenize(doc.topic);
    const tagTokens = tokenize(doc.tags.join(" "));
    const contentTokens = tokenize(doc.basic + " " + doc.science + " " + doc.engineering);

    // 合并 tokens，topic 和 tags 重复多次以提升权重
    const weightedTokens = [
      ...topicTokens, ...topicTokens, ...topicTokens, // 3x topic
      ...tagTokens, ...tagTokens,                     // 2x tags
      ...contentTokens,                                // 1x content
    ];

    const vector = buildDocVector(weightedTokens, idf);
    return { index, doc, vector };
  });

  return _docVectors;
}

// ============ 检索接口 ============

/**
 * RAG 检索：查询 → Top-K 最相关文档
 * @param {string} query - 用户查询
 * @param {number} topK - 返回前 K 条结果
 * @returns {{ topic, score, doc }[]} 检索结果，按相似度降序排列
 */
export function retrieve(query, topK = 3) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return [];
  }

  const idf = computeIDF();
  const queryVector = buildDocVector(queryTokens, idf);
  const docIndex = buildDocumentIndex();

  const results = docIndex.map(({ index, doc, vector }) => {
    const score = cosineSimilarity(queryVector, vector);
    return { index, doc, score };
  });

  // 按相似度降序排列
  results.sort((a, b) => b.score - a.score);

  // 过滤掉相似度为 0 的结果，取 Top-K
  const filtered = results.filter((r) => r.score > 0);
  const topResults = (filtered.length > 0 ? filtered : results).slice(0, topK);

  return topResults.map((r) => ({
    topic: r.doc.topic,
    score: r.score,
    doc: r.doc,
  }));
}

/**
 * 根据知识层级获取对应深度的文本
 * @param {object} doc - 知识条目
 * @param {number} level - 1=基础, 2=科学, 3=工程
 * @returns {string} 对应层级的文本
 */
export function getLevelText(doc, level) {
  if (!doc) return "";
  switch (level) {
    case 1:
      return doc.basic;
    case 2:
      return doc.science;
    case 3:
      return doc.engineering;
    default:
      return doc.basic;
  }
}

/**
 * 格式化检索结果摘要（用于 UI 展示）
 */
export function formatRetrievalSummary(results) {
  return results.map((r, i) => ({
    rank: i + 1,
    topic: r.topic,
    score: r.score,
    scorePercent: Math.round(r.score * 100),
  }));
}
