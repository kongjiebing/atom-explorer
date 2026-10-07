// ============================================================
// 森林减排卡片 — 把"发电量 → 火电等效排放 → 核电减排 → 种树"的逻辑链可视化
// 布局：左边绿色树林（随城市规模变化密度/高度），右边数据链，底部参考文献
// ============================================================

/* 萤火虫光点（按城市规模增减，确定性伪随机位置） */
const FIREFLY_LAYOUT = [
  [18, 46], [52, 24], [88, 52], [126, 30], [162, 48], [200, 26],
  [34, 92], [74, 78], [112, 96], [148, 82], [186, 92], [210, 64],
];

/* 每排树的列坐标（排 0 最远 → 排 2 最近） */
const ROW_LAYOUT = [
  { y: 150, gap: 30, scale: 0.55, cols: [28, 58, 88, 118, 148, 178, 198] },
  { y: 188, gap: 38, scale: 0.78, cols: [24, 62, 100, 138, 176] },
  { y: 224, gap: 46, scale: 1, cols: [30, 76, 122, 168] },
];

const ROW_COLORS = [
  ["#0a3d28", "#0d5c3a"], // 最远排：深暗绿
  ["#0f5c3c", "#14996a"], // 中间排：中绿
  ["#17a16b", "#34d399"], // 最近排：亮绿
];

/* 主角树（最近排中央，静态柔光强调） */
function HeroTree({ x, base, h, color }) {
  return (
    <g>
      <circle cx={x} cy={base - h * 0.62} r={h * 0.9} fill={color} opacity="0.16" />
      {/* 树冠三层 */}
      <ellipse cx={x} cy={base - h * 0.32} rx={h * 0.52} ry={h * 0.26} fill={color} />
      <ellipse cx={x} cy={base - h * 0.55} rx={h * 0.4} ry={h * 0.24} fill={color} opacity="0.92" />
      <ellipse cx={x} cy={base - h * 0.78} rx={h * 0.26} ry={h * 0.2} fill={color} opacity="0.85" />
      {/* 树干 */}
      <rect x={x - 3} y={base - h * 0.3} width="6" height={h * 0.34} rx="2" fill="#3b2417" />
      <circle cx={x} cy={base - h * 0.05} r="4" fill="#065f46" />
    </g>
  );
}

/* 普通树：三椭圆锥形树冠 + 树干 */
function Tree({ x, base, h, colors }) {
  return (
    <g>
      <ellipse cx={x} cy={base - h * 0.32} rx={h * 0.5} ry={h * 0.25} fill={colors[0]} />
      <ellipse cx={x} cy={base - h * 0.56} rx={h * 0.38} ry={h * 0.23} fill={colors[0]} opacity="0.9" />
      <ellipse cx={x} cy={base - h * 0.79} rx={h * 0.24} ry={h * 0.19} fill={colors[1]} opacity="0.85" />
      <rect x={x - 2.5} y={base - h * 0.3} width="5" height={h * 0.32} rx="2" fill="#2e1d12" opacity="0.8" />
    </g>
  );
}

export default function ForestCard({ city, index }) {
  const base = 236; // 地面基线
  const g = city.treeGrowth; // 主角树高度基准（随规模增长）
  const rows = Math.max(1, Math.min(3, city.treeDensity)); // 树林排数

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-5 md:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
        {/* ===== 左：绿色树林 ===== */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-900/50">
          <svg viewBox="0 0 220 250" preserveAspectRatio="xMidYMid slice" className="h-full min-h-[250px] w-full" role="img" aria-label={`${city.label} 减排等效森林示意图`}>
            <defs>
              <linearGradient id={`forest-bg-${city.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#061a12" />
                <stop offset="70%" stopColor="#0b3d28" />
                <stop offset="100%" stopColor="#052012" />
              </linearGradient>
            </defs>
            <rect width="220" height="250" fill={`url(#forest-bg-${city.id})`} />

            {/* 地面 */}
            <path d="M0 236 Q55 228 110 234 T220 232 L220 250 L0 250 Z" fill="#04170e" />
            <ellipse cx="110" cy="240" rx="120" ry="8" fill="#34d399" opacity="0.16" />

            {/* 后排 → 前排（排数随城市规模：1/2/3） */}
            {ROW_LAYOUT.slice(0, rows).map((row, ri) => {
              const isFront = ri === rows - 1;
              const palette = ROW_COLORS[ri + (3 - rows)];
              const treeH = g * row.scale;
              return row.cols.map((x, i) => (
                <g key={`${ri}-${i}`} className="build-rise" style={{ animationDelay: `${i * 0.12}s` }}>
                  {isFront && i === Math.floor(row.cols.length / 2) ? (
                    <HeroTree x={x} base={row.y} h={treeH} color={palette[1]} />
                  ) : (
                    <Tree x={x} base={row.y} h={treeH} colors={palette} />
                  )}
                </g>
              ));
            })}

            {/* 萤火虫（数量随规模增加） */}
            {FIREFLY_LAYOUT.slice(0, 6 + rows * 2).map(([fx, fy], i) => (
              <circle key={`ff${i}`} cx={fx} cy={fy} r={i % 3 === 0 ? 1.6 : 1.1} fill="#a7f3d0" opacity="0.8" className="star" style={{ animationDelay: `${(i * 0.9) % 3.2}s` }} />
            ))}
          </svg>
          <span className="absolute left-2 top-2 font-mono text-[10px] text-emerald-300/60">
            🌲 树林 · {city.treeCount} 棵
          </span>
        </div>

        {/* ===== 右：数据逻辑链 ===== */}
        <div className="flex max-w-2xl flex-col justify-between">
          <div>
            <div className="mb-1 font-mono text-xs text-accent">减排账单 · 0{index + 1}</div>
            <h3 className="text-lg font-bold text-ink">
              {city.label}，省下了一片森林
            </h3>
            <p className="mt-1 text-sm text-muted">
              核电不烧煤不排碳。同样一年发出的电量，换成火电要烧掉多少煤、排出多少 CO₂？逻辑如下——
            </p>

            {/* 逻辑链 */}
            <div className="mt-4 space-y-0">
              {/* ① 发电量 */}
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cyan-500/40 bg-cyan-500/10 font-mono text-xs font-bold text-cyan-300">①</span>
                <div className="flex-1">
                  <div className="text-xs text-muted">核电年发电量</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xl font-bold text-ink">{city.annualPower}</span>
                    <span className="text-sm text-muted">亿 kWh</span>
                  </div>
                </div>
              </div>
              <div className="ml-4 h-4 w-px bg-gradient-to-b from-cyan-400/60 to-amber-400/60" />

              {/* ② 火电等效排放 */}
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-amber-500/40 bg-amber-500/10 font-mono text-xs font-bold text-amber-300">②</span>
                <div className="flex-1">
                  <div className="text-xs text-muted">同样的电若来自燃煤火电</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xl font-bold text-amber-300">{city.thermalCo2}</span>
                    <span className="text-sm text-muted">万吨 CO₂ / 年</span>
                  </div>
                </div>
              </div>
              <div className="ml-4 h-4 w-px bg-gradient-to-b from-amber-400/60 to-emerald-400/60" />

              {/* ③ 核电减排 */}
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 font-mono text-xs font-bold text-emerald-300">③</span>
                <div className="flex-1">
                  <div className="text-xs text-muted">核电运行期排放 · 全年减排</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xl font-bold text-emerald-300">{city.nuclearCo2}</span>
                    <span className="text-sm text-muted">万吨/年</span>
                    <span className="mx-1 text-muted/40">→</span>
                    <span className="font-mono text-xl font-bold text-emerald-300">{city.co2Reduction} 万吨</span>
                  </div>
                </div>
              </div>
              <div className="ml-4 h-4 w-px bg-gradient-to-b from-emerald-400/60 to-emerald-300/60" />

              {/* ④ 种树 */}
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-sm">🌳</span>
                <div className="flex-1">
                  <div className="text-xs text-muted">这份减排，相当于</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xl font-bold text-emerald-300">{city.treeCount}</span>
                    <span className="text-sm text-muted">棵树 吸收一整年</span>
                  </div>
                </div>
              </div>

              {/* 折算口径注脚 */}
              <div className="mt-3 rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-xs text-muted">
                🌱 折算口径：一棵成年树年吸收约 18 kg CO₂，见文末参考文献 [3]
              </div>
            </div>
          </div>

          {/* 参考文献 */}
          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted/60">参考文献</div>
            <ul className="space-y-0.5 font-mono text-[10px] leading-relaxed text-muted/70">
              <li>[1] 中国电力企业联合会，《中国电力行业年度发展报告》，全国火电度电 CO₂ 排放约 0.85 kg。</li>
              <li>[2] World Nuclear Association，核电站运行阶段不排放温室气体。</li>
              <li>[3] 国家林业和草原局 / 中国林科院科普口径：一棵成年树年吸收 CO₂ 约 18 kg。</li>
              <li className="text-muted/50">* 以上为教育示意计算，非精确工程参数。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
