import { useEffect, useState, Suspense } from "react";
import { Link } from "react-router-dom";
import useStore from "../store/useStore.js";
import { plantComponents, getComponent } from "../data/plantComponents.js";
import PlantScene from "../scenes/PlantScene.jsx";
import SceneErrorBoundary from "../components/SceneErrorBoundary.jsx";
import { isWebGLAvailable } from "../utils/webglDetect.js";

const levelMeta = {
  1: { label: "基础了解", desc: "普通用户 · 口语化", color: "#22d3ee" },
  2: { label: "科学原理", desc: "有兴趣用户 · 含推导", color: "#fbbf24" },
  3: { label: "工程探索", desc: "深入用户 · 工程参数", color: "#a78bfa" },
};

export default function PlantExplorer() {
  const { selectedComponent, setSelectedComponent, knowledgeLevel, setKnowledgeLevel, markVisited } = useStore();
  const [hoveredId, setHoveredId] = useState(null);
  const [cutaway, setCutaway] = useState(false);

  useEffect(() => {
    markVisited("plant");
  }, [markVisited]);

  const comp = selectedComponent ? getComponent(selectedComponent) : null;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 font-mono text-xs text-accent">02 / 核电站探索</div>
          <h1 className="text-3xl font-bold text-ink">压水堆核电站三维结构</h1>
          <p className="mt-2 text-muted">
            拖动旋转视角 · 点击组件查看三级知识 · 开启剖面透视内部结构
          </p>
        </div>
        <div className="flex gap-2">
          <span className="chip"><span className="h-1.5 w-1.5 rounded-full bg-ok" />可交互</span>
          <span className="chip">6 个核心组件</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* 3D viewport */}
        <div className="relative h-[520px] overflow-hidden rounded-xl border border-line bg-bg lg:h-[600px]">
          {isWebGLAvailable() ? (
            <SceneErrorBoundary>
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-muted">
                    加载三维场景…
                  </div>
                }
              >
                <PlantScene
                  selectedId={selectedComponent}
                  onSelect={setSelectedComponent}
                  hoveredId={hoveredId}
                  onHover={setHoveredId}
                  cutaway={cutaway}
                />
              </Suspense>
            </SceneErrorBoundary>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/10 text-3xl">
                ⚛
              </div>
              <div className="text-lg font-semibold text-ink">
                三维场景暂不可用
              </div>
              <p className="max-w-md text-sm text-muted">
                当前环境不支持 WebGL 渲染。你仍可通过右侧组件列表点击查看每个组件的三级知识解释。
              </p>
              <p className="max-w-md font-mono text-xs text-muted/70">
                WebGL context 不可用 — 请在支持 WebGL 的浏览器中查看完整三维场景
              </p>
            </div>
          )}
          {/* Hint overlay */}
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-bg/70 px-3 py-1.5 font-mono text-xs text-muted backdrop-blur">
            🖱 拖动旋转 · 滚轮缩放 · 点击组件高亮
          </div>
          {/* Cutaway toggle */}
          <button
            onClick={() => setCutaway((v) => !v)}
            className={`absolute right-3 top-3 flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xs font-semibold backdrop-blur transition ${
              cutaway
                ? "border-accent bg-accent/20 text-accent shadow-glow"
                : "border-line bg-bg/70 text-muted hover:border-accent/50 hover:text-accent"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${cutaway ? "bg-accent" : "bg-muted"}`} />
            {cutaway ? "剖面模式 · 开" : "剖面模式 · 关"}
          </button>
          {/* Legend */}
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-bg/70 px-3 py-1.5 font-mono text-[10px] text-muted backdrop-blur">
            {cutaway ? "🔍 透视内部结构" : "🏠 完整外观视图"}
          </div>
        </div>

        {/* Component list sidebar */}
        <aside className="space-y-2">
          <div className="mb-1 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted">
            <span>组件列表</span>
            <span className="font-mono text-[10px] text-accent">6 / 8 可视化</span>
          </div>
          {plantComponents.map((c, i) => {
            const active = selectedComponent === c.id;
            const has3D = i < 6;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedComponent(c.id)}
                onMouseEnter={() => has3D && setHoveredId(c.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                  active
                    ? "border-accent bg-accent/10"
                    : "border-line bg-surface/50 hover:border-accent/40"
                }`}
              >
                <span
                  className="h-8 w-1 rounded-full"
                  style={{ background: c.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate text-sm font-semibold text-ink">
                      {c.name}
                    </span>
                    {has3D ? (
                      <span className="rounded bg-accent/15 px-1 py-0.5 font-mono text-[9px] text-accent">
                        3D
                      </span>
                    ) : (
                      <span className="rounded bg-muted/10 px-1 py-0.5 font-mono text-[9px] text-muted">
                        下游
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted">
                    {c.role}
                  </div>
                </div>
              </button>
            );
          })}
        </aside>
      </div>

      {/* Info modal popup */}
      {comp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedComponent(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface/95 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <span
                  className="h-10 w-1.5 rounded-full"
                  style={{ background: comp.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">
                      {comp.code}
                    </span>
                    <h2 className="text-xl font-bold text-ink">{comp.name}</h2>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                    <span>角色：{comp.role}</span>
                    <span>·</span>
                    <span>能量流：{comp.energyFlow}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedComponent(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-ink"
              >
                ✕
              </button>
            </div>

            {/* Level selector */}
            <div className="flex gap-2 p-5 pb-3">
              {[1, 2, 3].map((lvl) => {
                const meta = levelMeta[lvl];
                const active = knowledgeLevel === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => setKnowledgeLevel(lvl)}
                    className={`flex-1 rounded-lg border p-3 text-left transition ${
                      active ? "bg-surface2" : "border-line bg-surface/40 hover:border-accent/40"
                    }`}
                    style={active ? { borderColor: meta.color } : {}}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: meta.color }}
                      >
                        L{lvl}
                      </span>
                      <span className="text-sm font-semibold text-ink">
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted">{meta.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Knowledge text */}
            <div className="px-5 pb-5">
              <div className="rounded-lg border border-line bg-bg/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="rounded px-2 py-0.5 font-mono text-xs font-bold"
                    style={{
                      background: `${levelMeta[knowledgeLevel].color}1a`,
                      color: levelMeta[knowledgeLevel].color,
                    }}
                  >
                    Level {knowledgeLevel}
                  </span>
                  <span className="text-sm text-muted">
                    {levelMeta[knowledgeLevel].label}
                  </span>
                </div>
                <p className="text-[15px] leading-relaxed text-ink">
                  {comp.levels[knowledgeLevel]}
                </p>
              </div>
            </div>

            {/* Next step */}
            <div className="flex items-center justify-between gap-4 border-t border-line bg-surface/50 p-5">
              <span className="text-sm text-muted">
                想亲手调节这些参数？进入实验模式
              </span>
              <Link to="/experiment" className="btn-primary text-sm">
                互动实验 →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
