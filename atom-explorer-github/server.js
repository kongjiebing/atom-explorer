// ============================================================
// Atom Explorer 生产服务器
// 职责：
//   1. 托管构建后的前端（dist/），SPA 路由回退到 index.html
//   2. POST /api/chat 代理 DeepSeek API —— API 密钥只保存在服务端
//      环境变量 DEEPSEEK_API_KEY 中，绝不进入前端代码
//
// 运行：
//   npm run build
//   DEEPSEEK_API_KEY=sk-xxxx PORT=3000 node server.js
//
// 部署：任意支持 Node 的平台（Render / Railway / Fly.io / VPS 均可）
// ============================================================
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;
const DIST = path.join(__dirname, "dist");
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

const app = express();
app.use(express.json({ limit: "1mb" }));

// 健康检查（前端也可用来探测 LLM 是否已配置）
app.get("/api/health", (req, res) => {
  res.json({ ok: true, llm: !!DEEPSEEK_API_KEY });
});

// AI 导师对话代理：前端把 RAG context 发来，这里拼 prompt 调 DeepSeek
app.post("/api/chat", async (req, res) => {
  try {
    const { query, level, context } = req.body || {};
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query 不能为空" });
    }
    if (!DEEPSEEK_API_KEY) {
      // 未配置密钥：前端会收到 503 并回退到本地 RAG 模拟
      return res.status(503).json({ error: "LLM 未配置，请使用本地 RAG" });
    }

    const levelName = level === 1 ? "基础" : level === 2 ? "科学" : "工程";
    const system = [
      "你是一位核能科普导师，面向普通公众和学生解答核能相关问题。",
      "",
      "回答原则：",
      "1. 准确：优先基于提供的知识库内容回答，不编造数据或参数",
      "2. 通俗：使用日常语言解释，必要时用类比帮助理解",
      "3. 避免夸张：不使用极端措辞",
      "4. 如知识库中无直接相关内容，诚实告知并建议方向",
      "5. 区分事实与观点，对有争议的话题保持中立",
      `6. 用户当前选择「${levelName}」深度，请用符合该深度的话术回答。`,
    ].join("\n");
    const userMsg = context
      ? `以下是从核能知识库中检索到的相关内容：\n${context}\n\n---\n用户问题：${query}`
      : `用户问题：${query}`;

    const r = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        temperature: 0.6,
        max_tokens: 1200,
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error("DeepSeek 返回错误:", r.status, detail.slice(0, 300));
      return res.status(502).json({ error: `DeepSeek API 错误 ${r.status}` });
    }

    const data = await r.json();
    const answer = data.choices?.[0]?.message?.content || "";
    if (!answer) {
      return res.status(502).json({ error: "DeepSeek 返回内容为空" });
    }
    res.json({ answer, source: "deepseek", level });
  } catch (e) {
    console.error("/api/chat 异常:", e.message);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// 静态托管 + SPA 回退（Express 5 兼容写法）
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(DIST, "index.html"));
  });
} else {
  app.get("/", (req, res) =>
    res.send("前端尚未构建。请先运行 npm run build 生成 dist/ 目录。")
  );
}

app.listen(PORT, () => {
  console.log(`Atom Explorer 服务已启动: http://localhost:${PORT}`);
  console.log(
    DEEPSEEK_API_KEY
      ? "DeepSeek LLM: 已配置"
      : "DeepSeek LLM: 未配置（AI 导师将使用本地 RAG 兜底）"
  );
});
