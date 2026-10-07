import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import useStore from "../store/useStore.js";

const stats = [
  { value: "22", unit: "条知识库", sub: "三级深度标注" },
  { value: "6", unit: "大3D组件", sub: "可交互拆解" },
  { value: "3", unit: "层知识深度", sub: "基础/科学/工程" },
  { value: "0", unit: "门槛", sub: "无需专业背景" },
];

// 探索故事线的 8 个章节
const journey = [
  { step: "01", title: "一场探索", desc: "你即将开始一段从城市灯火到原子核内部的旅程", icon: "\u{1F50D}" },
  { step: "02", title: "城市的能源", desc: "一座核电站能为多少家庭供电？先感受它的能量量级", icon: "\u26A1" },
  { step: "03", title: "进入核电站", desc: "中国三大核电集群在哪里？选一座走进去看看", icon: "\u{1F5FA}" },
  { step: "04", title: "认识核反应堆", desc: "3D 拆解压水堆结构，点击每个组件了解它的角色", icon: "\u269B" },
  { step: "05", title: "亲手改变参数", desc: "调节功率、控制棒、冷却，亲手感受反应堆的脾气", icon: "\u{1F39B}" },
  { step: "06", title: "系统反馈", desc: "温度升高、触发警报、紧急停堆——你的操作会带来真实后果", icon: "\u{1F4C8}" },
  { step: "07", title: "AI 解释为什么", desc: "不懂为什么？AI 导师基于知识库检索，给出三级深度解答", icon: "\u{1F916}" },
  { step: "08", title: "我还想知道更多", desc: "选择你想要的深度，从基础到工程，探索永无止境", icon: "\u{1F30C}" },
];

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef(null);
  const target = parseInt(value) || 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const duration = 1200;
          const start = Date.now();
          const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.floor(eased * target).toString());
            if (progress < 1) requestAnimationFrame(animate);
          };
          animate();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="font-mono">
      {display}
    </span>
  );
}

export default function Landing() {
  const markVisited = useStore((s) => s.markVisited);

  useEffect(() => {
    markVisited("landing");
  }, [markVisited]);

  return (
    <div className="relative">
      {/* ============ Hero ============ */}
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-5">
        {/* Animated background rings */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-[700px] w-[700px] opacity-40">
            <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-accent/15" />
            <div className="absolute inset-8 animate-spin-rev rounded-full border border-accent2/15" />
            <div className="absolute inset-16 animate-spin-slow rounded-full border border-accent/10" />
            <div className="absolute inset-28 animate-spin-rev rounded-full border border-accent2/8" />
            {/* Orbiting dots */}
            <div className="absolute inset-0 animate-spin-slow">
              <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-accent shadow-glow" />
            </div>
            <div className="absolute inset-8 animate-spin-rev">
              <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-accent2 shadow-glow-amber" />
            </div>
            {/* Center glow */}
            <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-glow" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 font-mono text-xs text-accent backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse-slow rounded-full bg-accent" />
            AI 驱动 · 三维可视化 · 交互模拟 · 科普教育
          </div>

          <h1 className="mb-4 text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl">
            <span className="text-ink">Atom</span>{" "}
            <span className="bg-gradient-to-r from-accent via-accent2 to-accent bg-300% bg-clip-text text-transparent animate-gradient">
              Explorer
            </span>
          </h1>

          <p className="mb-2 text-2xl font-bold text-ink md:text-3xl">
            一场探索，从城市灯火到原子核
          </p>

          <p className="mx-auto mb-10 max-w-2xl text-base text-muted md:text-lg">
            不是教科书，不是 Wiki。是一段你可以亲手触碰的旅程——
            看能量从裂变产生，沿管道流动，变成你家的电。
          </p>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/energy"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-8 py-3.5 text-base font-bold text-bg shadow-glow transition hover:scale-105 hover:shadow-glow active:scale-95"
            >
              <span className="text-lg">▶</span>
              开始探索
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>
            <Link
              to="/tutor"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-6 py-3.5 text-base font-medium text-ink backdrop-blur-sm transition hover:border-accent/50 hover:text-accent"
            >
              <span className="text-lg">🤖</span>
              直接问 AI
            </Link>
          </div>

          {/* Quick stats */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-line bg-surface/40 p-3 backdrop-blur-sm transition hover:border-accent/30"
              >
                <div className="font-mono text-2xl font-bold text-accent">
                  {s.value === "0" ? s.value : <AnimatedNumber value={s.value} />}
                </div>
                <div className="mt-0.5 text-xs font-medium text-ink">{s.unit}</div>
                <div className="text-[10px] text-muted">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 旅程地图 ============ */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="text-center">
          <div className="mb-3 inline-block rounded-full border border-accent/30 bg-accent/5 px-3 py-1 font-mono text-xs text-accent">
            探索旅程
          </div>
          <h2 className="mb-3 text-3xl font-bold text-ink">
            八站旅程，层层深入
          </h2>
          <p className="mb-10 max-w-2xl mx-auto text-muted">
            每一步都自然引导到下一步。你不需要知道全部，只需要跟着好奇心走。
          </p>
        </div>

        {/* 旅程时间线 */}
        <div className="relative">
          {/* 竖线 */}
          <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-accent/40 via-accent2/30 to-accent/10 md:left-1/2" />

          {journey.map((j, i) => (
            <div
              key={i}
              className={`relative mb-6 flex items-center gap-4 ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* 节点 */}
              <div className="relative z-10 shrink-0 md:w-1/2">
                <div
                  className={`card flex items-center gap-3 transition hover:-translate-y-0.5 hover:shadow-glow ${
                    i % 2 === 1 ? "md:flex-row-reverse md:text-right" : ""
                  }`}
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/10 text-xl">
                    {j.icon}
                  </span>
                  <div className={i % 2 === 1 ? "md:text-right" : ""}>
                    <div className="flex items-center gap-2 md:justify-end">
                      <span className="font-mono text-xs text-accent">{j.step}</span>
                    </div>
                    <h3 className="font-bold text-ink">{j.title}</h3>
                    <p className="mt-0.5 text-sm text-muted">{j.desc}</p>
                  </div>
                </div>
              </div>
              {/* 竖线上的圆点 */}
              <div className="absolute left-6 -translate-x-1/2 md:left-1/2 md:-translate-x-1/2">
                <div className="h-3 w-3 rounded-full bg-accent shadow-glow" />
              </div>
              {/* 占位 */}
              <div className="hidden md:block md:w-1/2" />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            to="/energy"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-8 py-3.5 text-base font-bold text-bg shadow-glow transition hover:scale-105 active:scale-95"
          >
            <span className="text-lg">▶</span>
            从第一步开始
            <span className="transition group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      {/* ============ Mission ============ */}
      <section className="mx-auto max-w-4xl px-5 py-16 text-center">
        <div className="card border-accent/20 bg-surface/40">
          <p className="text-lg leading-relaxed text-ink">
            这不是工业级核反应堆仿真软件。
            <br />
            所有物理过程采用<strong className="text-accent">教育级简化模型</strong>
            ，保留因果关系，牺牲数值精度。
            <br />
            核心是
            <strong className="text-accent2">科学传播</strong>、
            <strong className="text-accent2">交互体验</strong>与
            <strong className="text-accent2">AI 解释能力</strong>。
          </p>
        </div>
      </section>
    </div>
  );
}
