import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clusters } from "../data/nuclearPlants.js";
import useStore from "../store/useStore.js";
import NextStep from "../components/NextStep.jsx";
import PlantSilhouette from "../components/PlantSilhouette.jsx";

/* ---------- 缩放视图 ---------- */
const clampView = (v) => {
  const k = Math.min(4, Math.max(1, v.k));
  const min = 100 * (1 - k);
  return {
    k,
    tx: Math.min(0, Math.max(min, v.tx)),
    ty: Math.min(0, Math.max(min, v.ty)),
  };
};

/* ---------- 中国轮廓（风格化夜景示意，含台湾/海南/南海诸岛） ---------- */
const MAINLAND_PATH =
  "M 16 20 L 14 34 L 20 42 L 26 50 L 24 58 L 30 66 L 34 74 L 40 80 L 44 84 " +
  "L 48 82 L 52 78 L 58 76 L 64 72 L 68 66 L 72 60 L 70 54 L 74 50 L 78 46 " +
  "L 80 42 L 82 38 L 86 36 L 88 34 L 86 31 L 82 29 L 86 26 L 88 23 L 92 20 " +
  "L 90 16 L 82 10 L 74 6 L 66 8 L 58 6 L 50 10 L 44 14 L 40 12 L 34 16 L 24 14 L 18 16 Z";

// 海岸线（雷州半岛 → 辽东半岛），用于发光描边
const COAST_PATH =
  "M 48 82 Q 50 79 52 78 Q 55 77 58 76 Q 61 74 64 72 Q 66 69 68 66 " +
  "Q 70 63 72 60 Q 71 57 70 54 Q 72 52 74 50 Q 76 48 78 46 Q 79 44 80 42 " +
  "Q 81 40 82 38 Q 84 37 86 36 Q 87 35 88 34 Q 87 32 86 31 Q 84 30 82 29 " +
  "Q 84 27 86 26 Q 87 24 88 23 Q 90 21 92 20";

// 沿海骨干输电通道：环渤海 → 长三角 → 珠三角
const BACKBONE_PATH =
  "M 82 30 C 78 38 74 45 72 52 C 67 60 63 68 60 76";

const CITIES = [
  { x: 80, y: 22, n: "北京", c: "#fcd34d" },
  { x: 84, y: 27, n: "天津", c: "#fcd34d" },
  { x: 85, y: 25, n: "唐山", c: "#fcd34d" },
  { x: 91, y: 22, n: "大连", c: "#67e8f9" },
  { x: 89, y: 32, n: "烟台", c: "#67e8f9" },
  { x: 87, y: 35, n: "青岛", c: "#67e8f9" },
  { x: 76, y: 47, n: "上海", c: "#fcd34d" },
  { x: 72, y: 51, n: "杭州", c: "#67e8f9" },
  { x: 73, y: 48, n: "宁波", c: "#67e8f9" },
  { x: 69, y: 61, n: "福州", c: "#67e8f9" },
  { x: 67, y: 64, n: "厦门", c: "#67e8f9" },
  { x: 62, y: 71, n: "汕头", c: "#67e8f9" },
  { x: 59, y: 74, n: "广州", c: "#fcd34d" },
  { x: 61, y: 76.4, n: "深圳", c: "#67e8f9" },
  { x: 60, y: 76.8, n: "香港", c: "#67e8f9" },
  { x: 58, y: 76.4, n: "澳门", c: "#67e8f9" },
  { x: 77, y: 70, n: "台北", c: "#fcd34d" },
  { x: 77.6, y: 73.4, n: "高雄", c: "#67e8f9" },
  { x: 42, y: 88.6, n: "海口", c: "#67e8f9" },
];

export default function ClusterMap() {
  const navigate = useNavigate();
  const markVisited = useStore((s) => s.markVisited);
  const [activeCluster, setActiveCluster] = useState(null);
  const [hoveredCluster, setHoveredCluster] = useState(null);
  const [hoveredPlant, setHoveredPlant] = useState(null);
  const [view, setView] = useState({ k: 1, tx: 0, ty: 0 });
  const mapRef = useRef(null);

  useEffect(() => {
    markVisited("map");
  }, [markVisited]);

  // 滚轮缩放（指向光标中心）
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const svg = el.querySelector("svg");
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      setView((v) => {
        const k = Math.min(4, Math.max(1, v.k * (e.deltaY < 0 ? 1.25 : 0.8)));
        const kk = k / v.k;
        return clampView({ k, tx: p.x - (p.x - v.tx) * kk, ty: p.y - (p.y - v.ty) * kk });
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomAt = (fx, fy, factor) =>
    setView((v) => {
      const k = Math.min(4, Math.max(1, v.k * factor));
      const kk = k / v.k;
      return clampView({ k, tx: fx - (fx - v.tx) * kk, ty: fy - (fy - v.ty) * kk });
    });

  const handleClusterClick = (clusterId) => {
    if (activeCluster === clusterId) {
      setActiveCluster(null);
    } else {
      setActiveCluster(clusterId);
    }
  };

  const handlePlantClick = (plantId) => {
    navigate(`/plant/${plantId}`);
  };

  // 统计
  const totalPlants = clusters.reduce((sum, c) => sum + c.plants.length, 0);
  const totalUnits = clusters.reduce(
    (sum, c) => sum + c.plants.reduce((s, p) => s + p.units, 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 animate-fade-in">
      {/* 面包屑导航 */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted">
        <Link to="/" className="hover:text-accent transition">首页</Link>
        <span className="text-muted/40">/</span>
        <Link to="/energy" className="hover:text-accent transition">城市的能源</Link>
        <span className="text-muted/40">/</span>
        <span className="text-accent font-medium">核电站地图</span>
      </div>

      {/* 标题区 */}
      <div className="mb-8">
        <div className="mb-2 font-mono text-xs text-accent">03 / 进入核电站</div>
        <h1 className="text-3xl font-bold text-ink md:text-4xl">
          中国核电，三大集群
        </h1>
        <p className="mt-3 max-w-3xl text-muted">
          环渤海、长三角、珠三角三大沿海集群，通过输电网连成一条
          <span className="font-semibold text-accent">沿海核电走廊</span>。
          滚轮可缩放地图，点击
          <span className="font-semibold text-accent">脉冲标记</span>展开集群，
          再点电站名进入详情。
        </p>
      </div>

      {/* 统计条 */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "集群数", value: 3, unit: "大集群", color: "#22d3ee" },
          { label: "核电站", value: totalPlants, unit: "座基地", color: "#fbbf24" },
          { label: "机组数", value: totalUnits, unit: "台机组", color: "#a78bfa" },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-line bg-surface/60 p-4 text-center backdrop-blur-sm"
          >
            <div className="font-mono text-3xl font-bold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="mt-1 text-sm font-medium text-ink">{s.unit}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 主体: 左侧地图 + 右侧详情面板 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ===== SVG 地图 ===== */}
        <div
          ref={mapRef}
          className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface/60 to-bg/80 p-2 backdrop-blur-sm"
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-auto"
            style={{ aspectRatio: "1.1" }}
          >
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#0f1622" stopOpacity="0" />
                <stop offset="100%" stopColor="#070b14" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="landGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#111c30" />
                <stop offset="100%" stopColor="#0a1222" />
              </linearGradient>
              <radialGradient id="oceanGrad" cx="70%" cy="55%" r="70%">
                <stop offset="0%" stopColor="#0e2238" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#070b14" stopOpacity="0" />
              </radialGradient>
              <filter id="coastGlow">
                <feGaussianBlur stdDeviation="0.35" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="dotGlow">
                <feGaussianBlur stdDeviation="0.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="100" height="100" fill="url(#mapGlow)" />

            {/* 缩放变换组 */}
            <g transform={`translate(${view.tx} ${view.ty}) scale(${view.k})`}>
              {/* 底色（放大后不露空） */}
              <rect x="-60" y="-60" width="220" height="220" fill="#070b14" />

              {/* 东侧海洋氛围 */}
              <rect x="0" y="0" width="100" height="100" fill="url(#oceanGrad)" />
              {/* 经纬格网（雷达图质感） */}
              {[30, 50, 70].map((x) => (
                <line key={`gx${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#22d3ee" strokeWidth="0.05" opacity="0.05" />
              ))}
              {[25, 50, 75].map((y) => (
                <line key={`gy${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#22d3ee" strokeWidth="0.05" opacity="0.05" />
              ))}

              {/* 河流 */}
              <path
                d="M 18 28 Q 30 25 44 26 Q 58 29 70 28 Q 80 29 84 30"
                fill="none"
                stroke="#1d3a5c"
                strokeWidth="0.16"
                opacity="0.55"
              />
              <path
                d="M 20 48 Q 34 50 46 49 Q 58 48 66 47 Q 72 48 75 50"
                fill="none"
                stroke="#1d3a5c"
                strokeWidth="0.16"
                opacity="0.55"
              />

              {/* 中国大陆 */}
              <path d={MAINLAND_PATH} fill="url(#landGrad)" stroke="#26374e" strokeWidth="0.35" />
              {/* 海岸线发光描边 */}
              <path d={COAST_PATH} fill="none" stroke="#22d3ee" strokeWidth="0.3" opacity="0.28" filter="url(#coastGlow)" />
              <path d={COAST_PATH} fill="none" stroke="#22d3ee" strokeWidth="0.12" opacity="0.75" />

              {/* 台湾岛 */}
              <path
                d="M 76.2 65.6 Q 78.6 66 79.1 68.2 L 78.9 71.6 L 77.5 74.2 L 75.8 71.4 L 75.2 68.4 Z"
                fill="url(#landGrad)"
                stroke="#26374e"
                strokeWidth="0.25"
              />
              <circle cx="77.3" cy="69.4" r="0.6" fill="#fcd34d" opacity="0.6" filter="url(#dotGlow)" />

              {/* 海南岛 */}
              <path
                d="M 39.6 86.8 Q 42.8 85.4 45 87 L 45.5 89.8 L 43.6 91.8 L 40.8 90.8 L 39.2 89 Z"
                fill="url(#landGrad)"
                stroke="#26374e"
                strokeWidth="0.25"
              />
              <circle cx="42.2" cy="88.8" r="0.5" fill="#67e8f9" opacity="0.6" filter="url(#dotGlow)" />

              {/* 南海诸岛（示意点） */}
              {[
                [33, 92.8], [28, 94.2], [23, 95.4], [18, 94.2],
              ].map(([ix, iy], i) => (
                <g key={`is${i}`}>
                  <circle cx={ix} cy={iy} r="0.4" fill="#0e1728" stroke="#26374e" strokeWidth="0.12" />
                  <circle cx={ix} cy={iy} r="0.18" fill="#67e8f9" opacity="0.5" />
                </g>
              ))}
              <text x="27" y="97.4" textAnchor="middle" fill="#5a6c85" fontSize="1.25" opacity="0.8">
                南海诸岛
              </text>

              {/* 城市光点 */}
              {CITIES.map((c, i) => (
                <g key={`c${i}`}>
                  <circle cx={c.x} cy={c.y} r={i % 5 === 0 ? 0.55 : 0.4} fill={c.c} opacity="0.85" filter="url(#dotGlow)" className="star" style={{ animationDelay: `${(i * 0.4) % 3}s` }} />
                  {(c.n === "北京" || c.n === "上海" || c.n === "广州" || c.n === "台北" || c.n === "香港") && (
                    <text x={c.x} y={c.y - 1.1} textAnchor="middle" fill="#6b7f9c" fontSize="1.3" opacity="0.7">
                      {c.n}
                    </text>
                  )}
                </g>
              ))}

              {/* ===== 三集群电网互联 ===== */}
              {/* 沿海骨干输电通道（底 + 缓慢流动光，节奏舒缓不似货运） */}
              <path d={BACKBONE_PATH} fill="none" stroke="#223049" strokeWidth="0.5" opacity="0.6" />
              <path d={BACKBONE_PATH} fill="none" stroke="#22d3ee" strokeWidth="0.32" strokeDasharray="1.4 1.6" className="energy-wire" style={{ animationDuration: "9s" }} />
              {/* 内陆互联弧线：环渤海 ⇄ 长三角 */}
              <path d="M 82 30 C 76 36 70 40 72 52" fill="none" stroke="#a78bfa" strokeWidth="0.22" strokeDasharray="1 1.4" opacity="0.4" className="energy-wire" style={{ animationDuration: "8s", animationDelay: "-2s" }} />
              {/* 内陆互联弧线：长三角 ⇄ 珠三角 */}
              <path d="M 72 52 C 64 58 56 64 60 76" fill="none" stroke="#fbbf24" strokeWidth="0.22" strokeDasharray="1 1.4" opacity="0.4" className="energy-wire" style={{ animationDuration: "8s", animationDelay: "-4s" }} />
              {/* 骨干上的能量脉冲（缓慢流动，仅两粒，如电网谐振） */}
              <circle r="0.5" fill="#67e8f9" opacity="0.8">
                <animateMotion dur="16s" repeatCount="indefinite" path={BACKBONE_PATH} />
              </circle>
              <circle r="0.45" fill="#fbbf24" opacity="0.7">
                <animateMotion dur="16s" begin="-8s" repeatCount="indefinite" path={BACKBONE_PATH} />
              </circle>
              {/* 骨干中途节点（变电站） */}
              {[
                { x: 77, y: 41, c: "#a78bfa" },
                { x: 66, y: 64, c: "#fbbf24" },
              ].map((n, i) => (
                <g key={`sub${i}`}>
                  <rect x={n.x - 0.6} y={n.y - 0.6} width="1.2" height="1.2" rx="0.25" fill="#0f1622" stroke={n.c} strokeWidth="0.14" />
                  <circle cx={n.x} cy={n.y} r="0.55" fill="none" stroke={n.c} strokeWidth="0.12" opacity="0.5">
                    <animate attributeName="r" values="0.4;1.1;0.4" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                </g>
              ))}

              {/* 集群区域光晕 */}
              {clusters.map((c) => {
                const isActive = activeCluster === c.id;
                const isHovered = hoveredCluster === c.id;
                const r = isActive ? 11 : isHovered ? 9 : 6.5;
                return (
                  <circle
                    key={`glow-${c.id}`}
                    cx={c.mapX}
                    cy={c.mapY}
                    r={r}
                    fill={c.color}
                    opacity={isActive ? "0.14" : isHovered ? "0.09" : "0.045"}
                    className="transition-all duration-500"
                  />
                );
              })}

              {/* 集群脉冲点 */}
              {clusters.map((c) => {
                const isActive = activeCluster === c.id;
                const isHovered = hoveredCluster === c.id;
                return (
                  <g key={c.id}>
                    {/* 外脉冲环 */}
                    <circle
                      cx={c.mapX}
                      cy={c.mapY}
                      r={isActive ? 3.5 : 2.5}
                      fill="none"
                      stroke={c.color}
                      strokeWidth="0.2"
                      opacity="0.4"
                    >
                      <animate attributeName="r" values="2;5.2;2" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* 中心点 */}
                    <circle
                      cx={c.mapX}
                      cy={c.mapY}
                      r={isActive ? 1.9 : 1.5}
                      fill={c.color}
                      filter="url(#dotGlow)"
                      className="cursor-pointer transition-all duration-300"
                      onClick={() => handleClusterClick(c.id)}
                      onMouseEnter={() => setHoveredCluster(c.id)}
                      onMouseLeave={() => setHoveredCluster(null)}
                    />
                    {/* 集群标签 */}
                    <text
                      x={c.mapX}
                      y={c.mapY - 4}
                      textAnchor="middle"
                      fill={isActive ? c.color : isHovered ? "#aabccf" : "#8a9bb3"}
                      fontSize={isActive ? 2.9 : 2.4}
                      fontWeight="bold"
                      className="cursor-pointer transition-all duration-300"
                      onClick={() => handleClusterClick(c.id)}
                      onMouseEnter={() => setHoveredCluster(c.id)}
                      onMouseLeave={() => setHoveredCluster(null)}
                    >
                      {c.shortName}
                    </text>

                    {/* 集群下电站小点 */}
                    {isActive &&
                      c.plants.map((p, i) => {
                        const angle = (i / c.plants.length) * Math.PI * 2 - Math.PI / 2;
                        const offset = 5;
                        const px = c.mapX + Math.cos(angle) * offset;
                        const py = c.mapY + Math.sin(angle) * offset;
                        return (
                          <g key={p.id}>
                            <line x1={c.mapX} y1={c.mapY} x2={px} y2={py} stroke={c.color} strokeWidth="0.14" opacity="0.4" />
                            <circle
                              cx={px}
                              cy={py}
                              r={hoveredPlant === p.id ? 1.6 : 1.1}
                              fill={c.color}
                              opacity={hoveredPlant === p.id ? 1 : 0.7}
                              filter="url(#dotGlow)"
                              className="cursor-pointer transition-all duration-200"
                              onClick={() => handlePlantClick(p.id)}
                              onMouseEnter={() => setHoveredPlant(p.id)}
                              onMouseLeave={() => setHoveredPlant(null)}
                            />
                            <text
                              x={px}
                              y={py + 2.6}
                              textAnchor="middle"
                              fill={hoveredPlant === p.id ? c.color : "#8a9bb3"}
                              fontSize="1.4"
                              className="cursor-pointer transition-colors duration-200"
                              onClick={() => handlePlantClick(p.id)}
                              onMouseEnter={() => setHoveredPlant(p.id)}
                              onMouseLeave={() => setHoveredPlant(null)}
                            >
                              {p.name.replace("核电站", "")}
                            </text>
                          </g>
                        );
                      })}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* 缩放控制 */}
          <div className="absolute right-3 top-3 flex flex-col gap-1.5">
            <button
              onClick={() => zoomAt(71, 53, 1.4)}
              className="grid h-7 w-7 place-items-center rounded-md border border-line bg-bg/70 font-mono text-sm font-bold text-ink backdrop-blur transition hover:border-accent hover:text-accent"
              title="放大"
            >
              +
            </button>
            <button
              onClick={() => zoomAt(71, 53, 0.72)}
              className="grid h-7 w-7 place-items-center rounded-md border border-line bg-bg/70 font-mono text-sm font-bold text-ink backdrop-blur transition hover:border-accent hover:text-accent"
              title="缩小"
            >
              −
            </button>
            <button
              onClick={() => setView({ k: 1, tx: 0, ty: 0 })}
              className="grid h-7 w-7 place-items-center rounded-md border border-line bg-bg/70 font-mono text-xs font-bold text-ink backdrop-blur transition hover:border-accent hover:text-accent"
              title="重置视图"
            >
              ⌂
            </button>
            <div className="grid h-7 w-7 place-items-center rounded-md border border-line bg-bg/40 font-mono text-[10px] text-muted">
              ×{view.k.toFixed(1)}
            </div>
          </div>

          {/* 图例 */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-lg border border-line bg-bg/60 p-2.5 backdrop-blur-sm">
            <div className="text-[10px] font-mono text-muted">图例</div>
            {clusters.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                <span className="text-xs text-ink">{c.shortName}集群</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 pt-1">
              <svg width="18" height="4" viewBox="0 0 18 4">
                <line x1="0" y1="2" x2="18" y2="2" stroke="#22d3ee" strokeWidth="2" strokeDasharray="2 2" />
              </svg>
              <span className="text-xs text-muted">沿海核电走廊</span>
            </div>
          </div>

          {/* 地图合规说明 */}
          <div className="absolute bottom-3 right-3 rounded-md bg-bg/50 px-2 py-1 font-mono text-[9px] leading-tight text-muted/80 backdrop-blur">
            风格化教学示意地图 · 非标准测绘
            <br />
            国界与行政区划仅为示意
          </div>
        </div>

        {/* ===== 右侧详情面板 ===== */}
        <div className="flex flex-col gap-4">
          {/* 如果没有选中的集群,显示概览 */}
          {!activeCluster && (
            <div className="flex flex-1 flex-col gap-3">
              <div className="card border-accent/20">
                <div className="mb-2 font-mono text-xs text-accent">提示</div>
                <div className="text-sm text-ink">
                  滚轮 / 按钮<span className="font-bold text-accent">缩放</span>地图，
                  点击
                  <span className="font-bold text-accent">脉冲标记</span>
                  展开该集群的核电站列表。
                </div>
                <div className="mt-1 text-sm text-muted">
                  再点击电站名称，进入详细页面。
                </div>
              </div>
              {clusters.map((c) => (
                <div
                  key={c.id}
                  className="card cursor-pointer transition hover:-translate-y-0.5 hover:shadow-glow"
                  style={{ borderLeftColor: c.color, borderLeftWidth: 3 }}
                  onClick={() => handleClusterClick(c.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: c.color, boxShadow: `0 0 10px ${c.color}88` }} />
                      <h3 className="font-bold text-ink">{c.name}</h3>
                    </div>
                    <span className="font-mono text-xs text-muted">{c.plants.length} 座</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{c.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.plants.map((p) => (
                      <span
                        key={p.id}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: `${c.color}15`, color: c.color }}
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 如果选中了集群,显示电站列表 */}
          {activeCluster &&
            (() => {
              const c = clusters.find((x) => x.id === activeCluster);
              return (
                <div className="flex flex-1 flex-col gap-3">
                  {/* 集群标题 */}
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: `linear-gradient(135deg, ${c.color}15, transparent)`,
                      border: `1px solid ${c.color}30`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold" style={{ color: c.color }}>
                        {c.name}
                      </h3>
                      <button
                        onClick={() => setActiveCluster(null)}
                        className="text-muted transition hover:text-ink"
                      >
                        ← 返回
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-muted">{c.description}</p>
                  </div>

                  {/* 电站列表（含抽象轮廓图） */}
                  {c.plants.map((p, i) => (
                    <div
                      key={p.id}
                      className="card group cursor-pointer transition hover:-translate-y-0.5 hover:border-accent/40"
                      onClick={() => handlePlantClick(p.id)}
                    >
                      <div className="flex items-start gap-3">
                        <PlantSilhouette
                          plant={p}
                          cluster={c}
                          compact
                          withHover={false}
                          className="h-16 w-28 shrink-0 rounded-md border border-line bg-bg/70"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs" style={{ color: c.color }}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <h4 className="truncate font-bold text-ink group-hover:text-accent transition">
                              {p.name}
                            </h4>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-muted">
                            <span>📍 {p.location}</span>
                            <span className={p.status === "运行中" ? "text-ok" : "text-accent2"}>
                              ● {p.status}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted">
                            {p.type} · {p.units} 台机组
                          </div>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold" style={{ color: c.color }}>
                              {p.capacity}
                            </span>
                            <span className="text-muted transition group-hover:translate-x-1 group-hover:text-accent">
                              →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
        </div>
      </div>

      {/* 底部: 叙事性下一步引导 */}
      <NextStep
        to="/plant"
        step="下一步 → 04"
        hint="这些电站里面长什么样？"
        title="认识核反应堆"
        narrative="走进核电站内部，3D 拆解压水堆结构。点击安全壳、压力容器、堆芯、控制棒——看看它们各自扮演什么角色。"
        color="#a78bfa"
      />
    </div>
  );
}
