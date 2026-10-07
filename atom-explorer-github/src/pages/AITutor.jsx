import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import useStore from "../store/useStore.js";
import { generateAnswer, getAnswerByLevel, generateAnswerRemote } from "../utils/llmService.js";
import { formatRetrievalSummary } from "../utils/ragEngine.js";
import { knowledgeBaseSize } from "../data/knowledgeBase.js";
import NextStep from "../components/NextStep.jsx";

const levelMeta = {
  1: { label: "基础", color: "#22d3ee", desc: "通俗易懂 · 面向普通公众" },
  2: { label: "科学", color: "#fbbf24", desc: "含原理推导 · 面向学生" },
  3: { label: "工程", color: "#a78bfa", desc: "含工程参数 · 面向探索者" },
};

const suggestions = [
  "为什么核电是清洁能源？",
  "什么是核裂变？",
  "核电安全吗？会不会爆炸？",
  "控制棒是干什么用的？",
  "核废料怎么处理？",
  "什么是压水堆？",
  "核聚变和核裂变有什么区别？",
  "中国有哪些自主三代核电技术？",
];

// ============ 消息气泡 ============
function MessageBubble({ role, level, children, typing, sources, ragInfo }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${
          isUser ? "bg-surface2 text-ink" : "bg-accent/15 text-accent"
        }`}
      >
        {isUser ? "你" : "⚛"}
      </div>
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && (
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs text-accent">AI 核能导师</span>
            {level && (
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                style={{
                  background: `${levelMeta[level].color}1a`,
                  color: levelMeta[level].color,
                }}
              >
                L{level} · {levelMeta[level].label}
              </span>
            )}
            {ragInfo && ragInfo.matched && (
              <span className="rounded bg-ok/10 px-1.5 py-0.5 font-mono text-[10px] text-ok">
                RAG 检索 · {ragInfo.docCount} 条
              </span>
            )}
            {ragInfo && ragInfo.engine && (
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                  ragInfo.engine === "deepseek"
                    ? "bg-accent/10 text-accent"
                    : "bg-surface2/60 text-muted"
                }`}
              >
                {ragInfo.engine === "deepseek" ? "DeepSeek 生成" : "本地知识库"}
              </span>
            )}
          </div>
        )}
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-accent/15 text-ink"
              : "rounded-tl-sm border border-line bg-surface/70 text-ink"
          } ${typing ? "typing-cursor" : ""}`}
        >
          {children}
        </div>
        {/* RAG 检索来源展示 */}
        {!isUser && sources && sources.length > 0 && !typing && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className="font-mono text-[10px] text-muted">知识来源：</span>
            {sources.map((s, i) => (
              <span
                key={i}
                className="rounded border border-line bg-surface2/50 px-1.5 py-0.5 font-mono text-[10px] text-muted"
              >
                {s.topic} · {s.scorePercent}%
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ RAG 流程可视化面板 ============
function RAGPipelinePanel({ visible, query, retrievedDocs, phase }) {
  if (!visible) return null;

  const phases = {
    searching: { label: "检索中", color: "#22d3ee", icon: "🔍" },
    generating: { label: "生成中", color: "#fbbf24", icon: "✍" },
    done: { label: "完成", color: "#34d399", icon: "✓" },
  };

  const current = phases[phase] || phases.searching;

  return (
    <div className="mx-auto mb-2 max-w-[80%] rounded-lg border border-line bg-surface2/60 p-2.5 backdrop-blur">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-xs" style={{ color: current.color }}>
          {current.icon}
        </span>
        <span className="font-mono text-[10px] text-muted">RAG Pipeline</span>
        <span
          className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
          style={{ background: `${current.color}1a`, color: current.color }}
        >
          {current.label}
        </span>
        <span className="ml-auto truncate font-mono text-[10px] text-muted">
          query: "{query.slice(0, 30)}{query.length > 30 ? "…" : ""}"
        </span>
      </div>
      {retrievedDocs && retrievedDocs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {retrievedDocs.map((d, i) => (
            <span
              key={i}
              className="rounded border border-line bg-bg/40 px-1.5 py-0.5 font-mono text-[10px] text-muted"
            >
              #{i + 1} {d.topic} ({Math.round(d.score * 100)}%)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ 主组件 ============
export default function AITutor() {
  const { messages, addMessage, knowledgeLevel, setKnowledgeLevel, markVisited } = useStore();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [ragPanel, setRagPanel] = useState({ visible: false, query: "", retrievedDocs: [], phase: "searching" });
  const scrollRef = useRef(null);
  const welcomeAdded = useRef(false);

  useEffect(() => {
    markVisited("tutor");
  }, [markVisited]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, ragPanel]);

  // 首次进入欢迎语（使用 ref 防止 StrictMode 双重渲染导致重复添加）
  useEffect(() => {
    if (welcomeAdded.current) return;
    welcomeAdded.current = true;
    if (useStore.getState().messages.length === 0) {
      addMessage({
        role: "ai",
        level: 1,
        text: `你好！我是 Atom Explorer 的 AI 核能导师。\n\n我基于 RAG（检索增强生成）架构工作：先从 ${knowledgeBaseSize} 条核能知识库中检索相关内容，再生成回答。\n\n你可以在顶部切换「基础 / 科学 / 工程」三个解释深度，也可以直接输入问题自由提问。`,
        typing: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 流式输出辅助函数
  const streamText = useCallback(async (fullText, msgIndex) => {
    const chunks = fullText.match(/.{1,4}/g) || [fullText];
    let acc = "";
    for (const chunk of chunks) {
      acc += chunk;
      useStore.setState((s) => ({
        messages: s.messages.map((m, i) =>
          i === msgIndex ? { ...m, text: acc } : m
        ),
      }));
      await new Promise((r) => setTimeout(r, 18));
    }
  }, []);

  // 发送问题
  const sendQuestion = useCallback(async (question) => {
    const q = question.trim();
    if (!q || isTyping) return;

    addMessage({ role: "user", text: q });
    setInput("");
    setIsTyping(true);

    // Step 1: RAG 检索阶段
    setRagPanel({
      visible: true,
      query: q,
      retrievedDocs: [],
      phase: "searching",
    });

    // 模拟检索延迟
    await new Promise((r) => setTimeout(r, 400));

    // 调用本地 RAG 服务（同步检索，同时生成兜底回答）
    const result = generateAnswer(q, knowledgeLevel);

    // 更新 RAG 面板显示检索结果
    const summary = formatRetrievalSummary(result.retrievedDocs);
    setRagPanel({
      visible: true,
      query: q,
      retrievedDocs: result.retrievedDocs,
      phase: "generating",
    });

    // Step 2: 生成阶段 —— 优先真实 LLM（服务端代理，密钥不落地前端），失败回退本地 RAG
    await new Promise((r) => setTimeout(r, 400));
    const llmAnswer = await generateAnswerRemote(q, knowledgeLevel, result.context);
    const finalAnswer = llmAnswer || result.answer;
    const engine = llmAnswer ? "deepseek" : "rag";

    // 添加 AI 消息并流式输出
    addMessage({
      role: "ai",
      level: knowledgeLevel,
      text: "",
      typing: true,
      sources: summary,
      ragInfo: {
        matched: result.retrievedDocs.length > 0 && result.retrievedDocs[0].score > 0.01,
        docCount: result.retrievedDocs.length,
        engine,
      },
      sourceTopics: result.sourceTopics,
      query: q,
      context: result.context,
    });

    // 更新 RAG 面板为完成
    setRagPanel((prev) => ({ ...prev, phase: "done" }));

    // 流式输出回答
    const msgIndex = useStore.getState().messages.length - 1;
    await streamText(finalAnswer, msgIndex);

    // 完成流式
    useStore.setState((s) => ({
      messages: s.messages.map((m, i) =>
        i === s.messages.length - 1 ? { ...m, typing: false } : m
      ),
    }));

    // 隐藏 RAG 面板
    setTimeout(() => setRagPanel({ visible: false, query: "", retrievedDocs: [], phase: "searching" }), 1000);
    setIsTyping(false);
  }, [isTyping, knowledgeLevel, addMessage, streamText]);

  // 层级切换：重新生成已有回答的对应深度
  const handleLevelChange = async (newLevel) => {
    const oldLevel = knowledgeLevel;
    setKnowledgeLevel(newLevel);

    // 找到最后一条 AI 消息
    const msgs = useStore.getState().messages;
    let lastAIMsg = null;
    let lastAIMsgIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "ai" && msgs[i].sourceTopics) {
        lastAIMsg = msgs[i];
        lastAIMsgIndex = i;
        break;
      }
    }

    if (lastAIMsg && (lastAIMsg.sourceTopics || lastAIMsg.query)) {
      // 上一条是 DeepSeek 回答：按新深度重新调用 DeepSeek，保证深度切换一致；否则用本地知识库切换
      let newText = "";
      if (lastAIMsg.ragInfo?.engine === "deepseek" && lastAIMsg.query) {
        newText = (await generateAnswerRemote(lastAIMsg.query, newLevel, lastAIMsg.context)) || "";
      }
      if (!newText) {
        newText = getAnswerByLevel(lastAIMsg.sourceTopics, newLevel);
      }
      if (newText) {
        // 流式更新
        useStore.setState((s) => ({
          messages: s.messages.map((m, i) =>
            i === lastAIMsgIndex
              ? { ...m, text: "", level: newLevel, typing: true }
              : m
          ),
        }));

        const chunks = newText.match(/.{1,4}/g) || [newText];
        let acc = "";
        for (const chunk of chunks) {
          acc += chunk;
          useStore.setState((s) => ({
            messages: s.messages.map((m, i) =>
              i === lastAIMsgIndex ? { ...m, text: acc } : m
            ),
          }));
          await new Promise((r) => setTimeout(r, 15));
        }
        useStore.setState((s) => ({
          messages: s.messages.map((m, i) =>
            i === lastAIMsgIndex ? { ...m, typing: false } : m
          ),
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 animate-fade-in">
      {/* 面包屑 */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted">
        <Link to="/" className="hover:text-accent transition">首页</Link>
        <span className="text-muted/40">/</span>
        <Link to="/experiment" className="hover:text-accent transition">反应堆控制台</Link>
        <span className="text-muted/40">/</span>
        <span className="text-accent font-medium">AI 核能导师</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 font-mono text-xs text-accent">07 / AI 解释「为什么」</div>
        <h1 className="text-3xl font-bold text-ink">AI 核能导师</h1>
        <p className="mt-2 text-muted">
          刚才的反应堆实验让你好奇了？在这里提问，AI 会从 {knowledgeBaseSize} 条知识库中检索，给出你能理解的解答。
        </p>
      </div>

      {/* Level selector */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">解释深度：</span>
        {[1, 2, 3].map((lvl) => {
          const meta = levelMeta[lvl];
          const active = knowledgeLevel === lvl;
          return (
            <button
              key={lvl}
              onClick={() => handleLevelChange(lvl)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
                active ? "bg-surface2" : "border-line bg-surface/40 hover:border-accent/40"
              }`}
              style={active ? { borderColor: meta.color } : {}}
            >
              <span className="font-mono text-xs font-bold" style={{ color: meta.color }}>
                L{lvl}
              </span>
              <span className={active ? "text-ink" : "text-muted"}>{meta.label}</span>
            </button>
          );
        })}
        <span className="ml-auto text-xs text-muted">
          {levelMeta[knowledgeLevel].desc}
        </span>
      </div>

      {/* Chat area */}
      <div className="flex h-[540px] flex-col rounded-xl border border-line bg-surface/40">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              role={m.role}
              level={m.level}
              typing={m.typing}
              sources={m.sources}
              ragInfo={m.ragInfo}
            >
              {m.text || (m.role === "ai" && m.typing ? "思考中…" : "")}
            </MessageBubble>
          ))}
          {isTyping && messages[messages.length - 1]?.role === "user" && (
            <RAGPipelinePanel
              visible={ragPanel.visible}
              query={ragPanel.query}
              retrievedDocs={ragPanel.retrievedDocs}
              phase={ragPanel.phase}
            />
          )}
          {isTyping && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent">
                ⚛
              </div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-line bg-surface/70 px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions —— 常驻展示：用户不知道问什么时可以直接点 */}
        <div className="border-t border-line px-3 pt-2 pb-1">
          <div className="mb-1.5 text-xs text-muted">💡 不知道怎么问？直接点这些：</div>
          <div className="flex gap-2 overflow-x-auto pb-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendQuestion(s)}
                disabled={isTyping}
                className="shrink-0 rounded-full border border-line bg-surface/60 px-3 py-1.5 text-sm text-muted transition hover:border-accent/40 hover:text-accent disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-line p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的核能问题…"
            className="flex-1 rounded-lg border border-line bg-bg/50 px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent"
          />
          <button type="submit" disabled={isTyping} className="btn-primary text-sm disabled:opacity-40">
            发送
          </button>
        </form>
      </div>

      {/* RAG Architecture Info */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="card">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-xs text-accent">01</span>
            <span className="text-sm font-semibold text-ink">知识库</span>
          </div>
          <p className="text-xs text-muted">
            {knowledgeBaseSize} 条三级标注条目，覆盖核物理、反应堆、安全、燃料循环、辐射防护等
          </p>
        </div>
        <div className="card">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-xs text-accent2">02</span>
            <span className="text-sm font-semibold text-ink">检索引擎</span>
          </div>
          <p className="text-xs text-muted">
            中文分词 + TF-IDF 向量化 + 余弦相似度，Top-3 相关文档检索
          </p>
        </div>
        <div className="card">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-xs" style={{ color: "#a78bfa" }}>03</span>
            <span className="text-sm font-semibold text-ink">生成回答</span>
          </div>
          <p className="text-xs text-muted">
            基于检索 context 生成回答，遵循准确、通俗、避免夸张原则
          </p>
        </div>
      </div>

      {/* 叙事性闭环: "我还想知道更多" */}
      <NextStep
        to="/map"
        step="循环 → 08"
        hint="好奇心没有终点"
        title="我还想知道更多"
        narrative="你走完了整条探索线：能源 → 核电站 → 反应堆 → 实验 → AI 解答。但这只是入口。回到地图，选另一座核电站，或者带着新的问题回到这里——探索永无止境。"
        color="#22d3ee"
      />
    </div>
  );
}
