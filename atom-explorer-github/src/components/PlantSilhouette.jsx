// ============================================================
// PlantSilhouette · 核电站抽象轮廓夜景插画
// 每个电站一套独立构图：穹顶形态(压水堆/AP1000/VVER/高温气冷堆)、
// 冷却塔、汽机房、输电塔架，外加各自地景特征（山海/海湾/工地/供暖/雪原）
// 悬停时浮现内部剖面示意图 —— 轮廓之上，一探究竟
// ============================================================

/* ---------- 确定性伪随机（按电站 id 播种，避免每次渲染抖动） ---------- */
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE = 110; // 结构基线（海平面）
const FILL = "#0b1322";
const STROKE = "#2a3a52";

/* ---------- 各电站构图配置 ---------- */
const ART = {
  qinshan: {
    towers: [{ x: 46, w: 12, h: 33 }, { x: 146, w: 12, h: 33 }, { x: 170, w: 12, h: 30 }],
    domes: [
      { x: 78, w: 16, h: 20, style: "cnp" },
      { x: 98, w: 16, h: 20, style: "cnp" },
      { x: 118, w: 16, h: 20, style: "cnp" },
    ],
    hall: { x: 64, w: 34 },
    pylons: [32, 56],
    extras: ["mountain", "pier", "bridge", "glowline"],
  },
  sanmen: {
    towers: [{ x: 48, w: 13, h: 34 }, { x: 150, w: 13, h: 34 }],
    domes: [
      { x: 82, w: 26, h: 22, style: "ap1000" },
      { x: 118, w: 26, h: 22, style: "ap1000" },
    ],
    hall: { x: 70, w: 32 },
    pylons: [34, 58],
    extras: ["mountain", "pier", "glowline"],
  },
  tianwan: {
    towers: [{ x: 44, w: 12, h: 33 }, { x: 150, w: 12, h: 33 }],
    stack: { x: 172, w: 7, h: 42 },
    domes: [
      { x: 78, w: 20, h: 24, style: "vver" },
      { x: 106, w: 20, h: 24, style: "vver" },
      { x: 134, w: 19, h: 21, style: "cpr" },
    ],
    hall: { x: 64, w: 34 },
    pylons: [32, 56],
    extras: ["mountain", "stack", "glowline"],
  },
  dayawan: {
    towers: [{ x: 46, w: 12, h: 33 }, { x: 140, w: 12, h: 33 }],
    domes: [
      { x: 82, w: 19, h: 21, style: "cpr" },
      { x: 108, w: 19, h: 21, style: "cpr" },
    ],
    hall: { x: 70, w: 32 },
    pylons: [32, 56],
    extras: ["mountain", "city", "pier", "boat", "glowline"],
  },
  lingao: {
    towers: [{ x: 42, w: 12, h: 32 }, { x: 140, w: 12, h: 32 }, { x: 166, w: 12, h: 29 }],
    domes: [
      { x: 76, w: 16, h: 20, style: "cpr" },
      { x: 96, w: 16, h: 20, style: "cpr" },
      { x: 116, w: 16, h: 20, style: "cpr" },
      { x: 136, w: 16, h: 20, style: "cpr" },
    ],
    hall: { x: 62, w: 34 },
    pylons: [32, 56],
    extras: ["mountain", "glowline"],
  },
  yangjiang: {
    towers: [{ x: 40, w: 12, h: 32 }, { x: 160, w: 12, h: 32 }],
    domes: [
      { x: 76, w: 15, h: 19, style: "cpr" },
      { x: 95, w: 15, h: 19, style: "cpr" },
      { x: 114, w: 15, h: 19, style: "cpr" },
      { x: 133, w: 15, h: 19, style: "cpr" },
    ],
    domesBack: [
      { x: 86, w: 14, h: 16, style: "cpr" },
      { x: 122, w: 14, h: 16, style: "cpr" },
    ],
    hall: { x: 62, w: 32 },
    pylons: [32, 56],
    extras: ["mountain", "city", "glowline"],
  },
  taipingling: {
    towers: [{ x: 52, w: 12, h: 30 }],
    domes: [
      { x: 92, w: 20, h: 22, style: "cpr" },
      { x: 122, w: 20, h: 22, style: "cpr" },
    ],
    hall: { x: 66, w: 26 },
    crane: { x: 72 },
    pylons: [32, 56],
    extras: ["mountain", "construction", "glowline"],
  },
  hongyanhe: {
    towers: [{ x: 42, w: 12, h: 32 }, { x: 168, w: 12, h: 32 }],
    domes: [
      { x: 78, w: 15, h: 19, style: "cpr" },
      { x: 97, w: 15, h: 19, style: "cpr" },
      { x: 116, w: 15, h: 19, style: "cpr" },
    ],
    domesBack: [
      { x: 84, w: 13, h: 16, style: "cpr" },
      { x: 103, w: 13, h: 16, style: "cpr" },
      { x: 122, w: 13, h: 16, style: "cpr" },
    ],
    hall: { x: 62, w: 34 },
    pylons: [32, 56],
    extras: ["pines", "snow", "aurora", "glowline"],
  },
  haiyang: {
    towers: [{ x: 46, w: 13, h: 34 }, { x: 150, w: 13, h: 34 }],
    domes: [
      { x: 82, w: 24, h: 21, style: "ap1000" },
      { x: 116, w: 24, h: 21, style: "ap1000" },
    ],
    hall: { x: 68, w: 30 },
    pylons: [32, 56],
    extras: ["pipe", "mountain", "glowline"],
  },
  shidao: {
    towers: [{ x: 48, w: 11, h: 38 }, { x: 158, w: 11, h: 38 }],
    domes: [
      { x: 92, w: 22, h: 16, style: "htr" },
      { x: 124, w: 22, h: 16, style: "htr" },
    ],
    hall: { x: 70, w: 30 },
    pylons: [32, 56],
    extras: ["particles", "mountain", "boat", "glowline"],
  },
  xudabu: {
    towers: [{ x: 46, w: 13, h: 36 }],
    domes: [
      { x: 86, w: 22, h: 24, style: "vver" },
      { x: 118, w: 22, h: 24, style: "vver" },
    ],
    hall: { x: 66, w: 30 },
    crane: { x: 148 },
    pylons: [32, 56],
    extras: ["snow", "construction", "aurora", "glowline"],
  },
};

/* ---------- 基础构件 ---------- */
function Tower({ t, color }) {
  const cx = t.x + t.w / 2;
  const top = BASE - t.h;
  return (
    <g>
      <path
        d={`M ${t.x} ${BASE} Q ${t.x + t.w * 0.02} ${BASE - t.h * 0.55} ${cx} ${top} Q ${t.x + t.w * 0.98} ${BASE - t.h * 0.55} ${t.x + t.w} ${BASE} Z`}
        fill={FILL}
        stroke={STROKE}
        strokeWidth="0.7"
      />
      <ellipse cx={cx} cy={top} rx={t.w * 0.1} ry={1.5} fill={FILL} stroke={STROKE} strokeWidth="0.5" />
      <path d={`M ${t.x + t.w * 0.12} ${BASE} v-3 M ${cx} ${BASE} v-3 M ${t.x + t.w * 0.88} ${BASE} v-3`} stroke={STROKE} strokeWidth="0.5" opacity="0.55" />
      {/* 塔内隐约管束（hover 浮现） */}
      <path d={`M ${t.x + t.w * 0.3} ${BASE - 4} v-${t.h * 0.5} M ${cx} ${BASE - 4} v-${t.h * 0.55} M ${t.x + t.w * 0.7} ${BASE - 4} v-${t.h * 0.5}`} stroke={color} strokeWidth="0.35" opacity="0.5" className="detail-hidden" />
      {/* 顶部蒸汽 */}
      <circle cx={cx} cy={top - 2} r="2.4" fill="#9fb4d8" opacity="0.4" className="steam" style={{ animationDelay: `${(cx * 13) % 30 / 10}s` }} />
    </g>
  );
}

function Dome({ d, color }) {
  const cx = d.x + d.w / 2;
  const cy = BASE - d.h + (d.style === "htr" ? 5 : 3);
  let body;
  if (d.style === "ap1000") {
    body = (
      <g>
        <path d={`M ${d.x} ${BASE - 3} L ${d.x} ${BASE - d.h + 4} A ${d.w / 2} ${d.h * 0.55} 0 0 1 ${d.x + d.w} ${BASE - d.h + 4} L ${d.x + d.w} ${BASE - 3} Z`} fill={FILL} stroke={STROKE} strokeWidth="0.7" />
        <rect x={cx - d.w * 0.05} y={BASE - d.h + 2} width={d.w * 0.1} height={3} fill={STROKE} />
      </g>
    );
  } else if (d.style === "vver") {
    body = (
      <path
        d={`M ${d.x - 1} ${BASE} L ${d.x - 1} ${BASE - d.h + 5} Q ${d.x} ${BASE - d.h + 1} ${cx} ${BASE - d.h} Q ${d.x + d.w} ${BASE - d.h + 1} ${d.x + d.w + 1} ${BASE - d.h + 5} L ${d.x + d.w + 1} ${BASE} Z`}
        fill={FILL}
        stroke={STROKE}
        strokeWidth="0.7"
      />
    );
  } else if (d.style === "htr") {
    body = (
      <path
        d={`M ${d.x} ${BASE - 3} L ${d.x} ${BASE - d.h + 5} Q ${cx} ${BASE - d.h - 2} ${d.x + d.w} ${BASE - d.h + 5} L ${d.x + d.w} ${BASE - 3} Z`}
        fill={FILL}
        stroke={STROKE}
        strokeWidth="0.7"
      />
    );
  } else {
    const r = d.w * 0.5;
    body = (
      <path
        d={`M ${d.x} ${BASE - 3} L ${d.x} ${BASE - d.h + r} A ${r} ${r * 0.95} 0 0 1 ${d.x + d.w} ${BASE - d.h + r} L ${d.x + d.w} ${BASE - 3} Z`}
        fill={FILL}
        stroke={STROKE}
        strokeWidth="0.7"
      />
    );
  }
  return (
    <g>
      {body}
      {/* 顶部排汽 / 信标 */}
      <circle cx={cx} cy={BASE - d.h - 1} r="0.9" fill={color} opacity="0.85" className="steam" style={{ animationDelay: `${(d.x * 7) % 30 / 10}s` }} />
      {/* 内部剖面（hover 浮现：压力容器 + 一回路示意） */}
      <g className="detail-hidden" opacity="0.75">
        <path d={`M ${cx} ${BASE - d.h + 2} L ${cx} ${BASE - 5}`} stroke={color} strokeWidth="0.45" strokeDasharray="1.5 1.5" />
        <circle cx={cx} cy={cy} r={d.w * 0.22} fill="none" stroke={color} strokeWidth="0.4" strokeDasharray="1.2 1.2" />
        <circle cx={cx} cy={cy} r={d.w * 0.12} fill="none" stroke={color} strokeWidth="0.35" />
        <circle cx={cx} cy={cy} r="0.7" fill={color} opacity="0.9" className="star" style={{ animationDelay: "0.6s" }} />
      </g>
    </g>
  );
}

function Hall({ h, color }) {
  return (
    <g>
      <rect x={h.x} y={BASE - h.h} width={h.w} height={h.h} fill={FILL} stroke={STROKE} strokeWidth="0.6" />
      <path d={`M ${h.x} ${BASE - h.h} L ${h.x + h.w * 0.25} ${BASE - h.h - 3} L ${h.x + h.w * 0.5} ${BASE - h.h} L ${h.x + h.w * 0.75} ${BASE - h.h - 3} L ${h.x + h.w} ${BASE - h.h}`} fill="none" stroke={STROKE} strokeWidth="0.5" />
      {/* 厂房屋面采光窗 */}
      {[0.08, 0.3, 0.52, 0.74].map((f, i) => (
        <line key={i} x1={h.x + h.w * f} y1={BASE - h.h + 3} x2={h.x + h.w * f + h.w * 0.16} y2={BASE - h.h + 3} stroke={color} strokeWidth="0.5" opacity="0.55" className="star" style={{ animationDelay: `${i * 0.9}s` }} />
      ))}
    </g>
  );
}

function Pylon({ x, color }) {
  const h = 26;
  return (
    <g>
      <path d={`M ${x - 7} ${BASE} L ${x} ${BASE - h} L ${x + 7} ${BASE} Z`} fill="none" stroke={STROKE} strokeWidth="0.7" />
      <line x1={x - 4.5} y1={BASE - h * 0.72} x2={x + 4.5} y2={BASE - h * 0.72} stroke={STROKE} strokeWidth="0.5" />
      <line x1={x - 6} y1={BASE - h * 0.42} x2={x + 6} y2={BASE - h * 0.42} stroke={STROKE} strokeWidth="0.5" />
      <circle cx={x} cy={BASE - h} r="0.8" fill="#f87171" opacity="0.8" className="star" style={{ animationDelay: "0.3s" }} />
      {/* 顺线（向右侧厂区送电） */}
      <path d={`M ${x + 6} ${BASE - h * 0.42} Q ${x + 18} ${BASE - h * 0.62} ${x + 30} ${BASE - h * 0.42}`} fill="none" stroke={color} strokeWidth="0.4" strokeDasharray="2 3" opacity="0.6" className="energy-wire" />
    </g>
  );
}

function Stack({ s, color }) {
  const top = BASE - s.h;
  return (
    <g>
      <rect x={s.x} y={top} width={s.w} height={s.h} fill={FILL} stroke={STROKE} strokeWidth="0.6" />
      {/* 俄式红白条纹（示意） */}
      {Array.from({ length: 4 }).map((_, i) => (
        <rect key={i} x={s.x} y={top + 6 + i * 7} width={s.w} height={2.4} fill={color} opacity="0.4" />
      ))}
      <circle cx={s.x + s.w / 2} cy={top} r="1.4" fill="#fbbf24" opacity="0.5" className="star" style={{ animationDelay: "1.2s" }} />
    </g>
  );
}

/* ---------- 地景特征 ---------- */
function Extras({ list, color, rand }) {
  return list.map((k) => {
    if (k === "mountain")
      return (
        <g key={k} opacity="0.5">
          <path d="M 0 104 L 22 86 Q 30 79 38 86 L 56 104 Z" fill="#0a1426" />
          <path d="M 26 104 L 46 89 Q 54 83 61 89 L 74 104 Z" fill="#0c182b" opacity="0.7" />
          <path d="M 182 104 L 199 87 Q 205 81 211 87 L 220 104 Z" fill="#0a1426" />
        </g>
      );
    if (k === "pier")
      return (
        <g key={k}>
          <line x1={60} y1={BASE} x2={40} y2={119} stroke="#1c2f4c" strokeWidth="1" />
          <line x1={40} y1={119} x2={36} y2={125} stroke="#1c2f4c" strokeWidth="1" />
          {[48, 56, 66].map((px, i) => (
            <circle key={i} cx={px} cy={BASE + 4 + i * 3} r="0.5" fill="#fcd34d" opacity="0.4" className="star" style={{ animationDelay: `${i * 0.7}s` }} />
          ))}
        </g>
      );
    if (k === "bridge")
      return <path key={k} d="M 24 113 Q 56 101 88 112" fill="none" stroke="#1e3250" strokeWidth="0.8" opacity="0.55" />;
    if (k === "boat")
      return (
        <g key={k}>
          <path d="M 26 120 q 5 -3.5 10 0 l 1 2.5 l -12 0 Z" fill="#13233c" stroke="#2c425e" strokeWidth="0.5" />
          <circle cx={34} cy={115} r="1" fill="#fcd34d" opacity="0.75" className="star" style={{ animationDelay: "1.4s" }} />
        </g>
      );
    if (k === "city") {
      const blocks = [
        { x: 168, w: 3, h: 4 }, { x: 173, w: 4, h: 7 }, { x: 179, w: 3, h: 5 },
        { x: 184, w: 4, h: 9 }, { x: 190, w: 3, h: 6 }, { x: 195, w: 4, h: 8 },
      ];
      return (
        <g key={k} opacity="0.85">
          <path d="M 166 110 L 166 106 Q 180 103 200 106 L 200 110 Z" fill="#0c1626" />
          {blocks.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={110 - b.h} width={b.w} height={b.h} fill="#0d1a30" stroke="#223049" strokeWidth="0.3" />
              <rect x={b.x} y={110 - b.h + 1.2} width={b.w} height="0.8" fill="#fcd34d" opacity={rand() < 0.6 ? 0.7 : 0.25} />
            </g>
          ))}
          <circle cx={186} cy={103} r="1.2" fill="#f87171" opacity="0.8" className="star" style={{ animationDelay: "0.5s" }} />
        </g>
      );
    }
    if (k === "pipe") {
      return (
        <g key={k}>
          <path d="M 132 109 L 200 109" stroke="#223049" strokeWidth="1.5" />
          {[140, 152, 164, 176, 188].map((px, i) => (
            <g key={i}>
              <line x1={px} y1={109} x2={px} y2={112} stroke="#223049" strokeWidth="0.5" />
              <circle cx={px + 4} cy={108.2} r="0.6" fill={color} opacity="0.7" className="energy-wire" />
            </g>
          ))}
          <g opacity="0.9">
            <rect x={182} y={103} width={3} height={6} fill="#12203a" stroke="#223049" strokeWidth="0.3" />
            <rect x={189} y={100} width={4} height={9} fill="#12203a" stroke="#223049" strokeWidth="0.3" />
            <rect x={196} y={104} width={3} height={5} fill="#12203a" stroke="#223049" strokeWidth="0.3" />
            {[183, 190, 197].map((wx) => (
              <rect key={wx} x={wx} y={102} width={2} height="1" fill="#fcd34d" opacity="0.6" className="star" style={{ animationDelay: "0.4s" }} />
            ))}
          </g>
        </g>
      );
    }
    if (k === "crane") {
      return (
        <g key={k}>
          <line x1={72} y1={110} x2={72} y2={88} stroke="#223049" strokeWidth="1" />
          <line x1={72} y1={88} x2={86} y2={88} stroke="#223049" strokeWidth="0.8" />
          <line x1={72} y1={92} x2={84} y2={90} stroke="#223049" strokeWidth="0.5" />
          <line x1={86} y1={88} x2={85} y2={96} stroke="#223049" strokeWidth="0.5" />
          <line x1={68} y1={110} x2={72} y2={95} stroke="#223049" strokeWidth="0.5" />
          <rect x={85} y={95} width="1.4" height="2.6" fill="#f87171" opacity="0.8" className="star" style={{ animationDelay: "0.2s" }} />
        </g>
      );
    }
    if (k === "construction") {
      return (
        <g key={k}>
          <circle cx={100} cy={108} r="34" fill={color} opacity="0.07" />
          <circle cx={100} cy={108} r="16" fill="#fbbf24" opacity="0.05" />
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx={60 + rand() * 90} cy={108.5} r="0.6" fill="#fcd34d" opacity="0.5" className="star" style={{ animationDelay: `${(i * 0.6).toFixed(1)}s` }} />
          ))}
        </g>
      );
    }
    if (k === "pines") {
      const trees = [40, 54, 158, 172];
      return (
        <g key={k}>
          {trees.map((tx, i) => (
            <g key={i}>
              <path d={`M ${tx} 105 L ${tx + 5} 97 L ${tx + 10} 105 Z`} fill="#0e1830" stroke="#223049" strokeWidth="0.4" />
              <path d={`M ${tx + 1.6} 105 L ${tx + 5} 100 L ${tx + 8.4} 105 Z`} fill="#101d38" stroke="#223049" strokeWidth="0.3" />
            </g>
          ))}
        </g>
      );
    }
    if (k === "snow") {
      return (
        <g key={k}>
          {Array.from({ length: 14 }).map((_, i) => (
            <circle
              key={i}
              cx={rand() * 216 + 2}
              cy={rand() * 84 + 10}
              r={rand() < 0.4 ? 1 : 0.6}
              fill="#dbe8ff"
              opacity={0.4 + rand() * 0.4}
              className="star"
              style={{ animationDelay: `${(rand() * 3).toFixed(1)}s` }}
            />
          ))}
        </g>
      );
    }
    if (k === "aurora") {
      return (
        <g key={k} className="detail-hidden">
          <path d="M 0 28 Q 60 12 120 24 T 220 16 L 220 42 Q 150 32 100 44 T 0 40 Z" fill="#34d399" opacity="0.05" />
          <path d="M 0 34 Q 80 18 160 28 T 220 24 L 220 40 Q 160 34 118 44 T 0 46 Z" fill="#a78bfa" opacity="0.04" />
        </g>
      );
    }
    if (k === "particles") {
      return (
        <g key={k}>
          <path d="M 90 100 Q 100 86 122 98" fill="none" stroke={color} strokeWidth="0.5" strokeDasharray="2 3" className="energy-wire" />
          <path d="M 92 104 Q 100 94 120 102" fill="none" stroke={color} strokeWidth="0.35" strokeDasharray="1.5 2.5" className="energy-wire" style={{ animationDuration: "2.6s" }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <circle key={i} cx={88 + i * 8} cy={102 - Math.sin((i / 4) * Math.PI) * 6} r="0.7" fill={color} opacity="0.5" className="star" style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </g>
      );
    }
    if (k === "glowline") {
      const dots = [76, 86, 96, 106, 116, 126, 136, 146, 156];
      return (
        <g key={k}>
          <path d="M 70 111.6 L 162 111.6" stroke="#1c2f4c" strokeWidth="0.4" />
          {dots.map((dx, i) => (
            <circle key={i} cx={dx} cy={111.6} r="0.6" fill="#fcd34d" opacity="0.55" className="star" style={{ animationDelay: `${(i * 0.35).toFixed(1)}s` }} />
          ))}
        </g>
      );
    }
    return null;
  });
}

/* ---------- 主组件 ---------- */
export default function PlantSilhouette({ plant, cluster, className = "", compact = false, withHover = true }) {
  const color = cluster.color;
  const cfg = ART[plant.id] || ART.qinshan;
  const rand = mulberry32(hashStr(plant.id));
  const gid = `ps-${plant.id}`;

  const stars = compact
    ? []
    : Array.from({ length: 22 }, () => ({
        x: rand() * 216 + 2,
        y: rand() * 92 + 6,
        r: rand() < 0.3 ? 1.1 : 0.7,
        o: 0.3 + rand() * 0.55,
        d: (rand() * 4).toFixed(2),
      }));

  return (
    <svg
      viewBox="0 0 220 132"
      className={`${className}${withHover ? " silhouette-hover" : ""}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${plant.name} 夜景轮廓示意图`}
    >
      <defs>
        <linearGradient id={`${gid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050a14" />
          <stop offset="55%" stopColor="#0a1222" />
          <stop offset="100%" stopColor="#0d1a30" />
        </linearGradient>
        <linearGradient id={`${gid}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1526" />
          <stop offset="100%" stopColor="#060c18" />
        </linearGradient>
        <radialGradient id={`${gid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${gid}-moon`}>
          <stop offset="0%" stopColor="#dbe4ff" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#dbe4ff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#dbe4ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 夜空 */}
      <rect width="220" height={BASE + 2} fill={`url(#${gid}-sky)`} />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#cfe0ff" opacity={s.o} className="star" style={{ animationDelay: `${s.d}s` }} />
      ))}
      {/* 月亮 */}
      <circle cx="180" cy="26" r="16" fill={`url(#${gid}-moon)`} />
      <circle cx="180" cy="26" r="8" fill="#dbe4ff" opacity="0.92" />
      <circle cx="176" cy="23" r="2" fill="#c3cef0" opacity="0.55" />
      <circle cx="184" cy="29" r="1.4" fill="#c3cef0" opacity="0.5" />

      {/* 集群光晕 */}
      <circle cx="104" cy="92" r="58" fill={`url(#${gid}-glow)`} />

      {/* 背景山 */}
      {!compact && cfg.extras.includes("mountain") && <Extras list={["mountain"]} color={color} rand={rand} />}

      {/* 主结构（分层：后排 → 主体 → 输电 → 特征） */}
      <g>
        {cfg.domesBack?.map((d, i) => <Dome key={`db${i}`} d={d} color={color} />)}
        {cfg.towers.map((t, i) => <Tower key={`t${i}`} t={t} color={color} />)}
        {cfg.stack && <Stack s={cfg.stack} color={color} />}
        {cfg.domes.map((d, i) => <Dome key={`d${i}`} d={d} color={color} />)}
        {cfg.hall && <Hall h={cfg.hall} color={color} />}
        {cfg.crane && (
          <g transform={`translate(${cfg.crane.x - 72} 0)`}>
            <Extras list={["crane"]} color={color} rand={rand} />
          </g>
        )}
      </g>

      {/* 输电线塔架 */}
      {cfg.pylons.map((px, i) => <Pylon key={`p${i}`} x={px} color={color} />)}

      {/* 岸线 */}
      <path d="M 0 110 L 0 105 Q 40 102.6 90 104.4 L 130 104.4 Q 180 102.6 220 105 L 220 110 Z" fill={FILL} stroke="#1c2f4c" strokeWidth="0.5" />
      {/* 沿海围墙 */}
      <path d="M 56 110 L 160 110" stroke="#223049" strokeWidth="0.6" />

      {/* 特征（部分元素自带 hover 隐藏细节） */}
      <g>
        <Extras list={cfg.extras} color={color} rand={rand} />
      </g>

      {/* 海面 + 倒影 */}
      <rect y={BASE} width="220" height="22" fill={`url(#${gid}-sea)`} />
      <line x1="0" y1={BASE} x2="220" y2={BASE} stroke="#1e3352" strokeWidth="0.8" />
      {!compact &&
        [113, 118, 123, 128].map((y, i) => (
          <path key={i} d={`M ${10 + i * 40} ${y} Q ${40 + i * 40} ${y - 1.2} ${70 + i * 40} ${y}`} fill="none" stroke="#1c3550" strokeWidth="0.5" opacity="0.6" />
        ))}
      {/* 灯光倒影 */}
      {!compact &&
        [72, 92, 112, 132, 152].map((x, i) => (
          <line key={i} x1={x} y1={112} x2={x} y2={112 + 4 + i} stroke={color} strokeWidth="0.5" opacity={0.22 - i * 0.02} />
        ))}
      <rect x="0" y="128" width="220" height="4" fill="#04080f" />
    </svg>
  );
}
