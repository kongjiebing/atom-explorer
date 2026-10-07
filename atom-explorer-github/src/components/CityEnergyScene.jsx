// ============================================================
// 城市能源 · 夜景互动场景
// 布局：左边核电站 → 中间输电网 → 右边城市灯光（层层递进）
// 切换城市规模：城市建筑增多、地标逐级点亮（电视塔 → 双子塔 → 摩天轮）、
// 电网电流变强、城市光晕变亮 —— 直观感受"一座核电站点亮多少灯火"
// ============================================================
import { Link } from "react-router-dom";

/* ---------- 三级城市配置（层层递进） ---------- */
const TIERS = [
  {
    lit: 3, // 窗户点亮密度 (0-10)
    sparks: 2, // 电网流动电光数量
    glow: 0.45, // 城市光晕强度
    buildings: [
      { x: 668, w: 24, h: 48 },
      { x: 700, w: 20, h: 70 },
      { x: 726, w: 30, h: 44 },
      { x: 760, w: 22, h: 84 },
      { x: 788, w: 32, h: 58 },
      { x: 826, w: 24, h: 70 },
      { x: 856, w: 28, h: 50 },
      { x: 890, w: 22, h: 76 },
      { x: 918, w: 26, h: 56 },
    ],
    landmarks: [],
  },
  {
    lit: 5,
    sparks: 4,
    glow: 0.65,
    buildings: [
      { x: 668, w: 24, h: 48 },
      { x: 700, w: 20, h: 70 },
      { x: 726, w: 30, h: 44 },
      { x: 760, w: 22, h: 84 },
      { x: 788, w: 32, h: 58 },
      { x: 826, w: 24, h: 70 },
      { x: 856, w: 28, h: 50 },
      { x: 890, w: 22, h: 76 },
    ],
    landmarks: [{ type: "tv", x: 934 }],
  },
  {
    lit: 8,
    sparks: 6,
    glow: 0.9,
    buildings: [
      { x: 730, w: 24, h: 70 },
      { x: 760, w: 22, h: 50 },
      { x: 788, w: 30, h: 44 },
      { x: 822, w: 22, h: 88 },
      { x: 850, w: 32, h: 60 },
      { x: 884, w: 24, h: 76 },
      { x: 912, w: 26, h: 56 },
    ],
    landmarks: [
      { type: "twins", x: 666 },
      { type: "tv", x: 948 },
      { type: "wheel", x: 978, y: 310, r: 34 },
    ],
  },
];

const GROUND = 400; // 地面基线

/* ---------- 楼宇（窗户随城市规模点亮，部分闪烁） ---------- */
function Building({ b, lit, delay }) {
  const wins = [];
  const cols = Math.max(2, Math.floor(b.w / 8));
  const rows = Math.max(3, Math.floor(b.h / 11));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const on = (r * 5 + c * 3 + b.x) % 10 < lit;
      const flicker = (r * 7 + c * 11) % 13 === 0;
      wins.push(
        <rect
          key={`${r}-${c}`}
          x={b.x + 3 + c * 7}
          y={GROUND - b.h + 5 + r * 9}
          width={3.6}
          height={4.5}
          rx={0.5}
          fill={on ? (flicker ? "#fcd34d" : "#ffe9b0") : "none"}
          className={on && flicker ? "win-flicker" : undefined}
        />
      );
    }
  }
  return (
    <g key={`b${b.x}`} className="build-rise" style={{ animationDelay: `${delay}s` }}>
      <rect x={b.x} y={GROUND - b.h} width={b.w} height={b.h} rx={1.5} fill="#131c2b" stroke="#223049" strokeWidth={0.6} />
      <rect x={b.x + 2} y={GROUND - b.h + 2} width={b.w - 4} height={3} rx={1} fill="#0d1522" opacity={0.8} />
      {wins}
    </g>
  );
}

/* ---------- 地标建筑 ---------- */
function Landmarks({ list }) {
  return list.map((lm, i) => {
    const delay = 0.15 + i * 0.15;
    if (lm.type === "tv")
      return (
        <g key={`lm${i}`} className="build-rise" style={{ animationDelay: `${delay}s` }}>
          {/* 塔腿 */}
          <path d={`M${lm.x - 8} ${GROUND} L${lm.x} 300 L${lm.x + 8} ${GROUND} Z`} fill="#0f1826" />
          {/* 塔身 */}
          <rect x={lm.x - 2.5} y={170} width={5} height={230} fill="#1a2740" />
          {/* 观光球 + 红色航空灯 */}
          <circle cx={lm.x} cy={165} r={9} fill="#2a3c58" stroke="#f87171" strokeWidth={1.2} className="beacon" />
          <circle cx={lm.x} cy={150} r={2.5} fill="#f87171" className="beacon" />
          {/* 横梁 */}
          <rect x={lm.x - 6} y={300} width={12} height={6} rx={1} fill="#223049" />
          <rect x={lm.x - 10} y={330} width={20} height={5} rx={1} fill="#223049" />
          <rect x={lm.x - 14} y={360} width={28} height={5} rx={1} fill="#223049" />
        </g>
      );
    if (lm.type === "twins")
      return (
        <g key={`lm${i}`} className="build-rise" style={{ animationDelay: `${delay}s` }}>
          <rect x={lm.x} y={230} width={26} height={170} fill="#152033" stroke="#2c425e" strokeWidth={0.8} rx={1.5} />
          <rect x={lm.x + 30} y={190} width={26} height={210} fill="#182640" stroke="#2c425e" strokeWidth={0.8} rx={1.5} />
          <rect x={lm.x + 3} y={234} width={20} height={10} fill="#22d3ee" opacity={0.85} className="win-flicker" />
          <rect x={lm.x + 33} y={194} width={20} height={10} fill="#22d3ee" opacity={0.85} className="win-flicker" />
          <rect x={lm.x - 4} y={248} width={34} height={4} fill="#fbbf24" opacity={0.5} />
        </g>
      );
    // 摩天轮：外圈 + 辐条 + 吊舱，整圈缓慢旋转
    // 注意：SVG 元素同时带 transform 属性和 CSS transform 动画时，CSS 会覆盖属性值，
    // 所以把平移放在外层 g（属性 transform），旋转只放在内层 g（CSS 动画，绕自身轴心）
    return (
      <g key={`lm${i}`} className="build-rise" style={{ animationDelay: `${delay}s` }}>
        <line x1={lm.x} y1={GROUND} x2={lm.x} y2={lm.y} stroke="#223049" strokeWidth={3} />
        <g transform={`translate(${lm.x} ${lm.y})`}>
          <g className="wheel-spin">
            <circle cx={0} cy={0} r={lm.r} fill="none" stroke="#2c425e" strokeWidth={2.5} />
            <circle cx={0} cy={0} r={3} fill="#fbbf24" />
            {Array.from({ length: 8 }).map((_, k) => {
              const a = (k * Math.PI) / 4;
              const cx = Math.cos(a) * lm.r;
              const cy = Math.sin(a) * lm.r;
              return (
                <g key={k}>
                  <line x1={0} y1={0} x2={cx} y2={cy} stroke="#223049" strokeWidth={1.5} />
                  <rect x={cx - 3.5} y={cy - 3.5} width={7} height={7} rx={1.5} fill={k % 2 ? "#fcd34d" : "#67e8f9"} opacity={0.9} />
                </g>
              );
            })}
          </g>
        </g>
      </g>
    );
  });
}

/* ---------- 输电网铁塔 ---------- */
function Tower({ x }) {
  return (
    <g>
      <path d={`M${x - 16} ${GROUND} L${x} 305 L${x + 16} ${GROUND}`} fill="none" stroke="#26374e" strokeWidth={1.4} />
      <line x1={x - 10} y1={330} x2={x + 10} y2={330} stroke="#26374e" strokeWidth={1.2} />
      <line x1={x - 12} y1={360} x2={x + 12} y2={360} stroke="#26374e" strokeWidth={1.2} />
      <line x1={x - 14} y1={390} x2={x + 14} y2={390} stroke="#26374e" strokeWidth={1.2} />
      <rect x={x - 2} y={296} width={4} height={10} fill="#2c425e" />
      <circle cx={x} cy={298} r={2} fill="#f87171" opacity={0.7} className="beacon" />
    </g>
  );
}

/* ---------- 主场景 ---------- */
export default function CityEnergyScene({ tier, cities, activeId, onSelect }) {
  const cfg = TIERS[Math.max(0, Math.min(2, tier))];
  const color = cities[tier].color;
  const sparks = Array.from({ length: cfg.sparks });
  const gridPath =
    "M300 306 Q322 320 345 308 L470 308 Q532 322 595 308 L650 310";
  const wireStyle = {
    stroke: "#67e8f9",
    strokeWidth: 1.6 + cfg.sparks * 0.22,
    opacity: 0.5 + cfg.sparks * 0.08,
  };

  return (
    <div className="relative w-full overflow-x-auto rounded-2xl border border-line bg-[#050a16] shadow-glow">
      <div className="relative w-full min-w-[640px]" style={{ aspectRatio: "1000 / 420" }}>
        <svg
          viewBox="0 0 1000 420"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#04070f" />
              <stop offset="60%" stopColor="#0a1424" />
              <stop offset="100%" stopColor="#12203a" />
            </linearGradient>
            <radialGradient id="cityGlow" cx="50%" cy="100%" r="65%">
              <stop offset="0%" stopColor={color} stopOpacity={0.3 * cfg.glow} />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="moonHalo">
              <stop offset="0%" stopColor="#dbe4ff" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#dbe4ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#dbe4ff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="domeGlow">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ---- 夜空 ---- */}
          <rect x="0" y="0" width="1000" height="420" fill="url(#sky)" />
          {/* 星星 */}
          {[
            [40, 40], [90, 70], [150, 30], [210, 90], [260, 45], [310, 110], [360, 55],
            [420, 30], [470, 95], [520, 60], [560, 120], [620, 40], [680, 85], [730, 50],
            [780, 110], [830, 65], [880, 40], [940, 90], [980, 55], [120, 120], [560, 20],
            [700, 25], [880, 105],
          ].map(([sx, sy], i) => (
            <circle key={i} cx={sx} cy={sy} r={1 + (i % 2)} fill="#cfe0ff" opacity={0.5 + ((i * 7) % 5) * 0.1} className="star" style={{ animationDelay: `${(i * 0.7) % 4}s` }} />
          ))}
          {/* 月亮 */}
          <circle cx="430" cy="80" r="38" fill="url(#moonHalo)" />
          <circle cx="430" cy="80" r="20" fill="#dbe4ff" opacity="0.92" />
          <circle cx="423" cy="74" r="5" fill="#c3cef0" opacity="0.6" />
          <circle cx="438" cy="90" r="3" fill="#c3cef0" opacity="0.5" />

          {/* ---- 地面 ---- */}
          <rect x="0" y="385" width="1000" height="35" fill="#0a1220" />
          <line x1="0" y1="385" x2="1000" y2="385" stroke="#16233a" strokeWidth="1" />

          {/* ---- 核电站（左） ---- */}
          {/* 冷却塔 + 蒸汽 */}
          <path d="M56 400 L64 268 Q90 244 116 268 L124 400 Z" fill="#1c2a3a" stroke="#2a3c52" strokeWidth="1" />
          <path d="M140 400 L148 272 Q174 248 200 272 L208 400 Z" fill="#1c2a3a" stroke="#2a3c52" strokeWidth="1" />
          {[
            [84, 258], [96, 253], [108, 258],
          ].map(([px, py], i) => (
            <circle key={`s1${i}`} cx={px} cy={py} r="9" fill="#9fb4d8" opacity="0.5" className="steam" style={{ animationDelay: `${i * 1.1}s` }} />
          ))}
          {[
            [164, 262], [176, 257], [188, 262],
          ].map(([px, py], i) => (
            <circle key={`s2${i}`} cx={px} cy={py} r="8" fill="#9fb4d8" opacity="0.45" className="steam" style={{ animationDelay: `${0.5 + i * 1.1}s` }} />
          ))}
          {/* 反应堆安全壳（穹顶）+ 脉冲光晕 */}
          <circle cx="255" cy="288" r="46" fill="url(#domeGlow)" className="plant-pulse" />
          <rect x="220" y="300" width="70" height="100" fill="#16202e" stroke="#223049" strokeWidth="1" />
          <path d="M224 300 Q255 258 286 300 Z" fill="#1c2a3a" stroke="#22d3ee" strokeWidth="1.2" opacity="0.9" />
          <rect x="292" y="340" width="42" height="60" fill="#131c2b" stroke="#223049" strokeWidth="1" />
          {/* 安全区围栏 + 警示灯 */}
          <line x1="212" y1="398" x2="338" y2="398" stroke="#223049" strokeWidth="1" />
          {[222, 262, 302, 328].map((fx) => (
            <line key={fx} x1={fx} y1="390" x2={fx} y2="398" stroke="#223049" strokeWidth="1.2" />
          ))}
          <circle cx="255" cy="268" r="2.5" fill="#f87171" className="beacon" />

          {/* ---- 输电网（中） ---- */}
          {/* 电线（静态底 + 流动光效） */}
          <path d="M300 306 Q322 320 345 308" fill="none" stroke="#223049" strokeWidth="2" />
          <path d="M345 308 L470 308" fill="none" stroke="#223049" strokeWidth="2" />
          <path d="M470 308 Q532 322 595 308" fill="none" stroke="#223049" strokeWidth="2" />
          <path d="M595 308 L650 310" fill="none" stroke="#223049" strokeWidth="2" />
          <path d="M300 306 Q322 320 345 308" fill="none" className="energy-wire" strokeDasharray="10 16" style={wireStyle} />
          <path d="M345 308 L470 308" fill="none" className="energy-wire" strokeDasharray="10 16" style={{ ...wireStyle, animationDelay: "-0.6s" }} />
          <path d="M470 308 Q532 322 595 308" fill="none" className="energy-wire" strokeDasharray="10 16" style={{ ...wireStyle, animationDelay: "-1.2s" }} />
          <path d="M595 308 L650 310" fill="none" className="energy-wire" strokeDasharray="10 16" style={{ ...wireStyle, animationDelay: "-1.8s" }} />
          {/* 流动电光（随城市规模变多） */}
          {sparks.map((_, i) => (
            <circle key={i} r="3" fill={i % 2 ? "#fbbf24" : "#67e8f9"}>
              <animateMotion dur="6s" begin={`${i * (6 / cfg.sparks)}s`} repeatCount="indefinite" path={gridPath} />
            </circle>
          ))}
          {/* 变电站 */}
          <rect x="642" y="360" width="20" height="24" fill="#16202e" stroke="#223049" strokeWidth="1" />
          <rect x="648" y="372" width="8" height="6" fill="#22d3ee" opacity="0.8" className="win-flicker" />
          {/* 铁塔 */}
          <Tower x={345} />
          <Tower x={470} />
          <Tower x={595} />

          {/* ---- 城市（右） ---- */}
          <rect x="660" y="230" width="340" height="160" fill="url(#cityGlow)" />
          {cfg.buildings.map((b, i) => (
            <Building key={b.x} b={b} lit={cfg.lit} delay={i * 0.06} />
          ))}
          <Landmarks list={cfg.landmarks} />
        </svg>

        {/* ---- HTML 覆盖层：分区标签 + 城市切换 ---- */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="chip">⚛ 核电站</span>
        </div>
        <div className="absolute left-1/2 top-3 -translate-x-1/2">
          <span className="chip">⚡ 输电网</span>
        </div>
        <div className="absolute right-3 top-3">
          <span className="chip">🌃 城市 · 深夜</span>
        </div>
        <div className="absolute left-3 bottom-2 hidden md:block">
          <span className="font-mono text-[10px] text-muted/70">
            核裂变 → 输电 → 灯火
          </span>
        </div>
        {/* 城市规模切换（层层递进的核心交互） */}
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2 px-2">
          {cities.map((c) => {
            const active = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition ${
                  active
                    ? "border-accent bg-accent/15 text-ink shadow-glow"
                    : "border-line bg-bg/70 text-muted hover:border-accent/40 hover:text-accent"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: c.color, boxShadow: active ? `0 0 8px ${c.color}` : "none" }} />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
