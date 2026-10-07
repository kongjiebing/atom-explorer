import { useEffect } from "react";
import { Link } from "react-router-dom";
import useStore from "../store/useStore.js";
import { cityScales, formatNumber } from "../data/energyData.js";
import NextStep from "../components/NextStep.jsx";
import CityEnergyScene from "../components/CityEnergyScene.jsx";
import ForestCard from "../components/ForestCard.jsx";

function StatCard({ label, value, unit, accent }) {
  return (
    <div className="card">
      <div className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className="font-mono text-3xl font-bold"
          style={{ color: accent }}
        >
          {value}
        </span>
        <span className="text-sm text-muted">{unit}</span>
      </div>
    </div>
  );
}

export default function EnergyImpact() {
  const { cityScale, setCityScale, markVisited } = useStore();
  const selected = cityScales.find((c) => c.id === cityScale) || cityScales[1];

  useEffect(() => {
    markVisited("energy");
  }, [markVisited]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 animate-fade-in">
      {/* 面包屑 */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted">
        <Link to="/" className="hover:text-accent transition">首页</Link>
        <span className="text-muted/40">/</span>
        <span className="text-accent font-medium">城市的能源</span>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <div className="mb-2 font-mono text-xs text-accent">02 / 城市的能源</div>
        <h1 className="text-3xl font-bold text-ink">一座核电站，能点亮多少灯火？</h1>
        <p className="mt-2 max-w-2xl text-muted">
          深夜的城市里，每扇亮着的窗都连着电网那头的反应堆。切换城市规模，看看电网如何一层层点亮更多灯火——以及每一度核电为大气省下了多少二氧化碳。
        </p>
      </div>

      {/* 夜景互动场景：核电站 → 输电网 → 城市（层层递进） */}
      <div className="mb-8">
        <CityEnergyScene
          tier={Math.max(0, cityScales.findIndex((c) => c.id === cityScale))}
          cities={cityScales}
          activeId={cityScale}
          onSelect={setCityScale}
        />
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="年发电量"
          value={selected.annualPower}
          unit="亿 kWh"
          accent={selected.color}
        />
        <StatCard
          label="可服务人口"
          value={formatNumber(selected.population)}
          unit="人"
          accent={selected.color}
        />
        <StatCard
          label="等效减排 CO₂"
          value={selected.co2Reduction}
          unit="万吨/年"
          accent="#34d399"
        />
        <StatCard
          label="装机容量"
          value={selected.capacity}
          unit={selected.reactors}
          accent={selected.color}
        />
      </div>

      {/* 同样的电量，两份环境账单：火电 vs 核电排放对照 */}
      <div className="card mb-8">
        <div className="mb-1 text-sm font-semibold text-ink">
          同样的电量，两份环境账单
        </div>
        <p className="mb-4 text-sm text-muted">
          以「{selected.label}」年用电量 {selected.annualPower} 亿 kWh 为例：核电把火电本该排放的碳省了下来——
        </p>
        <div className="space-y-4">
          {/* 火电 */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between font-mono text-xs text-muted">
              <span>🔥 燃煤火电 · 同电量排放</span>
              <span className="font-bold text-amber-300">≈ {selected.thermalCo2} 万吨 CO₂/年</span>
            </div>
            <div className="h-8 overflow-hidden rounded-md bg-surface2">
              <div
                className="flex h-full items-center justify-end rounded-md px-2 font-mono text-xs font-bold text-amber-100 transition-all duration-500"
                style={{
                  width: "100%",
                  background: "linear-gradient(90deg, #78350f, #b45309, #d97706)",
                  boxShadow: "0 0 18px rgba(217,119,6,0.35)",
                }}
              >
                {selected.thermalCo2} 万吨
              </div>
            </div>
          </div>
          {/* 核电 */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between font-mono text-xs text-muted">
              <span>⚛ 核电站 · 同电量排放</span>
              <span className="font-bold text-emerald-300">≈ 0 万吨 CO₂/年</span>
            </div>
            <div className="h-8 overflow-hidden rounded-md bg-surface2">
              <div
                className="flex h-full items-center rounded-md pl-2 font-mono text-xs font-bold text-emerald-200 transition-all duration-500"
                style={{
                  width: "2%",
                  background: "linear-gradient(90deg, #059669, #34d399)",
                  boxShadow: "0 0 18px rgba(52,211,153,0.5)",
                }}
              >
                ≈0
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">
          核电运行期不烧煤不排碳——这 {selected.annualPower} 亿 kWh 每年把约{" "}
          <span className="font-mono font-bold text-emerald-300">{selected.co2Reduction} 万吨</span>{" "}
          CO₂ 挡在了大气之外。
        </p>
      </div>

      {/* 减排账单卡片：左树林 · 右数据 · 一次只展示当前选中的一张 */}
      <div className="mb-8">
        <h2 className="mb-1 text-lg font-bold text-ink">
          这些数字意味着什么？减排账单
        </h2>
        <p className="mb-4 text-sm text-muted">
          核电是清洁能源：发电量越大，省下的碳排放越多，就像为城市种下了一片森林。切换城市规模，翻到对应的那张账单——
        </p>

        {/* 分段切换器 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {cityScales.map((c) => {
            const active = c.id === selected.id;
            return (
              <button
                key={c.id}
                onClick={() => setCityScale(c.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur transition ${
                  active
                    ? "border-accent bg-accent/15 text-ink shadow-glow"
                    : "border-line bg-bg/70 text-muted hover:border-accent/40 hover:text-accent"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: c.color, boxShadow: active ? `0 0 8px ${c.color}` : "none" }}
                />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* 当前城市对应的一张卡片（key 切换触发翻页动画） */}
        <div key={selected.id} className="card-swipe-in">
          <ForestCard
            city={selected}
            index={Math.max(0, cityScales.findIndex((c) => c.id === selected.id))}
          />
        </div>
      </div>

      {/* 叙事性下一步: 引导进入核电站地图 */}
      <NextStep
        to="/map"
        step="下一步 → 03"
        hint="能量从哪来？"
        title="走进核电站"
        narrative={`${selected.annualPower} 亿度电从裂变产生，沿管道流动，变成你家的电。这些核电站在哪里？选一座进去看看。`}
        color="#fbbf24"
      />
    </div>
  );
}
