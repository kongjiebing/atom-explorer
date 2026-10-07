// 反应堆核心可视化：光晕/粒子/蒸汽随功率、温度实时变化
// 性能优化：光晕用 opacity 过渡（合成器层），核心脉冲用 transform 缩放，
//          避免频繁改变 box-shadow 模糊半径引发的重绘卡顿

// 固定粒子轨道配置（CSS 动画负责运动，不随 React 重渲染抖动）
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  angle: (360 / 14) * i + 16,
  dist: 62 + ((i * 37) % 16),
  size: 2.5 + ((i * 13) % 4),
  dur: 2.4 + ((i * 7) % 12) / 10,
  delay: ((i * 29) % 18) / 10,
}));

export default function ReactorCore({ power, temperature, steam = 0 }) {
  const heat = Math.min(1, Math.max(0, power / 100));
  const danger = temperature >= 340 ? 1 : temperature >= 320 ? 0.6 : 0;
  const color =
    temperature >= 340 ? "#f87171" : temperature >= 320 ? "#fbbf24" : "#22d3ee";
  const steamLevel = Math.min(1, steam / 100);
  const auraOpacity = 0.3 + heat * 0.45 + danger * 0.25;
  const label =
    danger >= 1
      ? "临界过热"
      : danger > 0
      ? "接近警戒"
      : heat > 0.5
      ? "功率充足"
      : "低功率";

  return (
    <div className="card relative flex flex-col items-center overflow-hidden">
      <div className="mb-3 text-xs uppercase tracking-wider text-muted">反应堆核心</div>

      {/* 蒸汽（压力高时从堆芯上方升起） */}
      {steamLevel > 0.25 && (
        <div className="pointer-events-none absolute top-2 left-1/2 z-10 h-16 w-28 -translate-x-1/2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute bottom-0 rounded-full animate-steam"
              style={{
                left: `${16 + i * 27}%`,
                width: `${16 + steamLevel * 12}%`,
                height: `${16 + steamLevel * 12}%`,
                background: "rgba(232,238,247,0.8)",
                opacity: 0.3 * steamLevel,
                animationDuration: `${2.2 + i * 0.5}s`,
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative grid h-52 w-52 place-items-center">
        {/* 警戒脉冲光环 */}
        {danger > 0 && (
          <div
            className="absolute inset-0 rounded-full animate-ring"
            style={{ border: `2px solid ${color}`, boxShadow: `0 0 20px ${color}` }}
          />
        )}
        {/* 旋转外圈 */}
        <div className="absolute inset-0 rounded-full border border-dashed border-line animate-spin-slow" />
        <div className="absolute inset-2 rounded-full border border-line/60 animate-spin-rev" />

        {/* 能量粒子轨道：功率越高越亮越密 */}
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full animate-orbit"
            style={{
              width: p.size,
              height: p.size,
              background: color,
              opacity: 0.2 + heat * 0.65,
              ["--a"]: `${p.angle}deg`,
              ["--d"]: `${p.dist}px`,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        {/* 光晕层：opacity 过渡代替 box-shadow 模糊变化，避免卡顿 */}
        <div
          className="absolute h-36 w-36 rounded-full transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle, ${color} 0%, ${color}55 45%, ${color}22 65%, transparent 80%)`,
            opacity: auraOpacity,
            transform: `scale(${0.9 + heat * 0.22 + danger * 0.15})`,
          }}
        />

        {/* 核心主体：呼吸脉冲用 transform 缩放（GPU 合成），光晕大小固定 */}
        <div
          className="absolute h-24 w-24 rounded-full animate-core-pulse"
          style={{
            background: `radial-gradient(circle at 38% 32%, #ffffff88 0%, ${color} 32%, ${color}99 55%, ${color}44 75%, transparent 92%)`,
            boxShadow: `0 0 40px ${color}66, inset 0 0 24px ${color}55`,
          }}
        >
          {/* 高光点 */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_38%_32%,rgba(255,255,255,0.5),transparent_55%)]" />
        </div>

        {/* 燃料棒示意 */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <div
            key={deg}
            className="absolute h-6 w-1 rounded-full transition-opacity duration-300"
            style={{
              transform: `rotate(${deg}deg) translateY(-66px)`,
              background: heat > 0.3 ? "#fbbf24" : "#8a9bb3",
              opacity: 0.35 + heat * 0.45,
            }}
          />
        ))}
      </div>

      {/* 状态栏 */}
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        <span
          className="h-2 w-2 rounded-full transition-colors duration-300"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
        {label} · 功率 {Math.round(power)}%
        {steamLevel > 0.5 && (
          <span className="text-accent2">· 💨 蒸汽 {Math.round(steam)}%</span>
        )}
      </div>
    </div>
  );
}
