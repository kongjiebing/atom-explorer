import { useEffect, useState, Suspense } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getPlantById, clusters } from "../data/nuclearPlants.js";
import { plantComponents, getComponent } from "../data/plantComponents.js";
import useStore from "../store/useStore.js";
import PlantScene from "../scenes/PlantScene.jsx";
import SceneErrorBoundary from "../components/SceneErrorBoundary.jsx";
import { isWebGLAvailable } from "../utils/webglDetect.js";
import NextStep from "../components/NextStep.jsx";
import PlantSilhouette from "../components/PlantSilhouette.jsx";

const levelMeta = {
  1: { label: "基础了解", desc: "普通用户 · 口语化", color: "#22d3ee" },
  2: { label: "科学原理", desc: "有兴趣用户 · 含推导", color: "#fbbf24" },
  3: { label: "工程探索", desc: "深入用户 · 工程参数", color: "#a78bfa" },
};

export default function PlantDetail() {
  const { plantId } = useParams();
  const navigate = useNavigate();
  const { selectedComponent, setSelectedComponent, knowledgeLevel, setKnowledgeLevel, markVisited } = useStore();
  const [hoveredId, setHoveredId] = useState(null);
  const [cutaway, setCutaway] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [viewMode, setViewMode] = useState("art"); // "art" 展示图 / "3d" 内部结构

  useEffect(() => {
    markVisited("plant-detail");
  }, [markVisited]);

  const result = getPlantById(plantId);

  if (!result) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-ink mb-2">未找到该核电站</h1>
        <p className="text-muted mb-6">可能链接已过期或参数错误</p>
        <Link to="/map" className="btn-primary">
          返回地图
        </Link>
      </div>
    );
  }

  const { plant, cluster } = result;
  const comp = selectedComponent ? getComponent(selectedComponent) : null;
  const siblings = cluster.plants.filter((p) => p.id !== plant.id);
  const otherClusters = clusters.filter((c) => c.id !== cluster.id);

  return (
    <div className="flex flex-col">
      {/* 面包屑 */}
      <div className="mx-auto w-full max-w-7xl px-5 pt-4">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Link to="/" className="hover:text-accent transition">
            首页
          </Link>
          <span className="text-muted/40">/</span>
          <Link to="/map" className="hover:text-accent transition">
            核电站地图
          </Link>
          <span className="text-muted/40">/</span>
          <span className="text-muted/40">{cluster.shortName}</span>
          <span className="text-muted/40">/</span>
          <span style={{ color: cluster.color }} className="font-medium">
            {plant.name}
          </span>
        </div>
      </div>

      {/* ===== 沉浸式 3D 场景区域 ===== */}
      <div className="relative mx-auto mt-4 w-full max-w-7xl px-5">
        <div className="relative h-[70vh] min-h-[500px] overflow-hidden rounded-2xl border border-line bg-bg">
          {viewMode === "art" ? (
            <PlantSilhouette plant={plant} cluster={cluster} className="h-full w-full" />
          ) : isWebGLAvailable() ? (
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
                当前环境不支持 WebGL 渲染。你仍可浏览下方的电站信息与组件知识。
              </p>
            </div>
          )}

          {/* 顶部叠加: 电站名 + 信息切换 */}
          <div className="pointer-events-none absolute left-0 top-0 right-0 flex items-start justify-between p-5">
            <div className="pointer-events-auto">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    background: cluster.color,
                    boxShadow: `0 0 10px ${cluster.color}`,
                  }}
                />
                <span
                  className="font-mono text-xs font-medium"
                  style={{ color: cluster.color }}
                >
                  {cluster.shortName}集群 · {plant.location}
                </span>
              </div>
              <h1 className="mt-1.5 text-2xl font-bold text-ink drop-shadow-lg md:text-3xl">
                {plant.name}
              </h1>
              <div className="mt-1 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    plant.status === "运行中"
                      ? "bg-ok/15 text-ok"
                      : "bg-accent2/15 text-accent2"
                  }`}
                >
                  ● {plant.status}
                </span>
                <span className="rounded-full bg-bg/60 px-2 py-0.5 text-xs text-muted backdrop-blur">
                  {plant.type}
                </span>
              </div>
            </div>

            {/* 右上角控制 */}
            <div className="pointer-events-auto flex flex-col gap-2">
              {/* 视图切换：展示图 / 3D 内部 */}
              <div className="flex overflow-hidden rounded-lg border border-line bg-bg/70 backdrop-blur">
                <button
                  onClick={() => setViewMode("art")}
                  className={`px-3 py-1.5 font-mono text-xs font-semibold transition ${
                    viewMode === "art"
                      ? "bg-accent/20 text-accent"
                      : "text-muted hover:text-accent"
                  }`}
                >
                  展示图
                </button>
                <button
                  onClick={() => setViewMode("3d")}
                  className={`px-3 py-1.5 font-mono text-xs font-semibold transition ${
                    viewMode === "3d"
                      ? "bg-accent/20 text-accent"
                      : "text-muted hover:text-accent"
                  }`}
                >
                  3D 内部
                </button>
              </div>
              {viewMode === "3d" && isWebGLAvailable() && (
                <button
                  onClick={() => setCutaway((v) => !v)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold backdrop-blur transition ${
                    cutaway
                      ? "border-accent bg-accent/20 text-accent shadow-glow"
                      : "border-line bg-bg/70 text-muted hover:border-accent/50 hover:text-accent"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${cutaway ? "bg-accent" : "bg-muted"}`} />
                  {cutaway ? "剖面 · 开" : "剖面 · 关"}
                </button>
              )}
              <button
                onClick={() => setShowInfo((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-line bg-bg/70 px-3 py-1.5 font-mono text-xs font-semibold text-muted backdrop-blur transition hover:border-accent/50 hover:text-accent"
              >
                {showInfo ? "隐藏信息" : "显示信息"}
              </button>
            </div>
          </div>

          {/* 底部提示条 */}
          {viewMode === "art" ? (
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-bg/70 px-3 py-1.5 font-mono text-xs text-muted backdrop-blur">
              悬停轮廓 · 浮现内部剖面示意
            </div>
          ) : (
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-bg/70 px-3 py-1.5 font-mono text-xs text-muted backdrop-blur">
              🖱 拖动旋转 · 滚轮缩放 · 点击组件高亮
            </div>
          )}

          {/* 右下角组件快速选择条（仅 3D 模式） */}
          {viewMode === "3d" && (
            <div className="absolute bottom-3 right-3 flex gap-1.5">
              {plantComponents.slice(0, 6).map((c) => {
                const active = selectedComponent === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedComponent(active ? null : c.id)}
                    onMouseEnter={() => setHoveredId(c.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[10px] font-semibold backdrop-blur transition ${
                      active
                        ? "border-accent bg-accent/20 text-accent shadow-glow"
                        : "border-line bg-bg/70 text-muted hover:border-accent/40 hover:text-ink"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: c.color }}
                    />
                    {c.code}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== 组件知识弹窗 ===== */}
      {comp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedComponent(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* ===== 电站信息区域 (可展开/收起) ===== */}
      {showInfo && (
        <div className="mx-auto w-full max-w-7xl px-5 py-8">
          {/* 描述 */}
          <div
            className="mb-6 rounded-2xl border p-6"
            style={{ borderColor: `${cluster.color}30` }}
          >
            <p className="text-base leading-relaxed text-ink/90">
              {plant.description}
            </p>

            {/* 关键参数 */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "投运年份", value: plant.year, icon: "📅" },
                { label: "装机容量", value: plant.capacity, icon: "⚡" },
                { label: "机组数", value: `${plant.units} 台`, icon: "⚛" },
                { label: "运营单位", value: plant.operator, icon: "🏢" },
              ].map((s, i) => (
                <div key={i} className="rounded-lg border border-line bg-bg/40 p-3">
                  <div className="text-sm">{s.icon}</div>
                  <div className="mt-1 font-mono text-sm font-bold text-ink">
                    {s.value}
                  </div>
                  <div className="text-xs text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 核心亮点 */}
          <div className="mb-6">
            <h2 className="mb-4 text-lg font-bold text-ink">核心亮点</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {plant.highlights.map((h, i) => (
                <div
                  key={i}
                  className="card flex items-start gap-2"
                  style={{ borderTopColor: cluster.color, borderTopWidth: 2 }}
                >
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: cluster.color }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-ink">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 同集群其他电站 */}
          {siblings.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-bold text-ink">
                {cluster.shortName}集群其他电站
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {siblings.map((p) => (
                  <Link
                    key={p.id}
                    to={`/plant/${p.id}`}
                    className="card group transition hover:-translate-y-0.5 hover:border-accent/40"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-ink group-hover:text-accent transition">
                        {p.name}
                      </h4>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: cluster.color }}
                      />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-muted">
                      <span>{p.location}</span>
                      <span
                        className={
                          p.status === "运行中" ? "text-ok" : "text-accent2"
                        }
                      >
                        ● {p.status}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {p.units} 台 · {p.capacity}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 其他集群 + 继续探索 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h2 className="mb-4 text-lg font-bold text-ink">其他集群</h2>
              <div className="space-y-3">
                {otherClusters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate("/map")}
                    className="card group flex w-full items-center gap-3 text-left transition hover:-translate-y-0.5 hover:shadow-glow"
                    style={{ borderLeftColor: c.color, borderLeftWidth: 3 }}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: c.color, boxShadow: `0 0 8px ${c.color}88` }}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-ink group-hover:text-accent transition">
                        {c.name}
                      </h4>
                      <p className="text-xs text-muted">{c.plants.length} 座核电站</p>
                    </div>
                    <span className="text-muted transition group-hover:translate-x-1">→</span>
                  </button>
                ))}
              </div>
            </div>

          {/* 叙事性下一步: 引导进入反应堆内部构造 */}
          <NextStep
            to="/plant"
            step="下一步 → 05"
            hint="外观看完了，里面长什么样？"
            title="深入反应堆内部"
            narrative="刚才你看到的是电站外观。现在潜入安全壳，3D 拆解压水堆：压力容器、堆芯、控制棒、蒸汽发生器——看看裂变能量如何一步步变成电。"
            color="#a78bfa"
          />
        </div>
      </div>
      )}
    </div>
  );
}
