import { Link } from "react-router-dom";

/**
 * 叙事性"下一步"引导组件
 * 用于页面底部,自然引导用户进入探索流程的下一站
 */
export default function NextStep({
  to,
  step,
  title,
  hint,
  narrative,
  color = "#22d3ee",
}) {
  return (
    <Link
      to={to}
      className="group mt-8 block overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface/60 to-bg/80 p-6 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {/* 步骤编号 */}
          <div className="mb-2 flex items-center gap-2">
            <span
              className="font-mono text-xs font-bold"
              style={{ color }}
            >
              {step}
            </span>
            <span
              className="h-px flex-1 max-w-[60px]"
              style={{ background: `${color}40` }}
            />
            <span className="text-xs text-muted">{hint}</span>
          </div>
          {/* 叙事标题 */}
          <h3 className="text-xl font-bold text-ink transition group-hover:text-accent">
            {title}
          </h3>
          {/* 叙事描述 */}
          {narrative && (
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
              {narrative}
            </p>
          )}
        </div>
        {/* 箭头 */}
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="grid h-12 w-12 place-items-center rounded-full text-lg transition group-hover:scale-110"
            style={{
              background: `${color}15`,
              color,
            }}
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
