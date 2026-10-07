import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useStore from "../store/useStore.js";
import NextStep from "../components/NextStep.jsx";
import ReactorCore from "../components/ReactorCore.jsx";
import {
  computeStep,
  judgeStatus,
  INITIAL_TEMP,
  WARN_TEMP,
  LIMIT_TEMP,
} from "../utils/reactorSim.js";

/* ============ 关卡配置：像列车游戏一样逐关解锁操作 ============
   列车游戏：加速刹车 → 控速 → 鸣喇叭 → 暴风雪擦窗户
   反应堆：点火功率 → 冷却控温 → 蒸汽排放 → 故障应急 → 发电冲刺 → 全面操纵
   refPower：本关推荐功率，用于星级评分（平均功率利用率）
   elecTarget：满负荷发电关，发电量达标即通关
   timeout：超时未达目标则失败
   events：突发设备故障（QTE 快速反应）
*/
const levels = [
  {
    id: 1,
    icon: "🔥",
    name: "点火启堆",
    sub: "加速 · 踩下功率油门",
    desc: "反应堆刚刚启动。你的第一个任务：把反应功率调到 40% ~ 70% 的安全区间，保持 8 秒即可点火成功。",
    check: (s) => s.power >= 40 && s.power <= 70,
    duration: 8,
    init: { power: 35, controlRod: 30, cooling: 70 },
    refPower: 70,
    tips: ["功率就像油门——调大了产热多，调小了没能量"],
  },
  {
    id: 2,
    icon: "🌡️",
    name: "掌控温度",
    sub: "控速 · 冷却系统解锁",
    desc: "把功率提到 65% 以上，同时用新解锁的冷却系统把温度稳定在 300 ~ 335°C，保持 10 秒。",
    check: (s) => s.temp >= 300 && s.temp <= 335 && s.power >= 65,
    duration: 10,
    init: { power: 50, controlRod: 30, cooling: 60 },
    refPower: 85,
    tips: ["冷却系统像散热器——温度高了就加大冷却"],
  },
  {
    id: 3,
    icon: "💨",
    name: "蒸汽压力",
    sub: "鸣笛 · 主动排放蒸汽",
    desc: "蒸汽会持续积累（功率越高积累越快）。压力超过 80% 就点击「排放蒸汽」，坚持 12 秒不爆管。",
    check: (s) => s.power >= 60 && s.steam < 100,
    duration: 12,
    init: { power: 70, controlRod: 30, cooling: 80 },
    refPower: 85,
    tips: ["压力像高压锅——及时排放才能保证安全", "大约每 5 秒排一次，别等变红"],
  },
  {
    id: 4,
    icon: "⚠️",
    name: "突发故障",
    sub: "应急 · 冷却泵降效",
    desc: "冷却泵突然故障，实际效率只剩一半！解锁控制棒，用它降功率，把温度压在 360°C 以下坚持 15 秒。",
    check: (s) => s.temp < 360,
    duration: 15,
    init: { power: 80, controlRod: 25, cooling: 80 },
    refPower: 70,
    tips: ["控制棒是刹车——插得越深反应越弱"],
  },
  {
    id: 5,
    icon: "📡",
    name: "突发故障II",
    sub: "应急 · 设备故障弹窗",
    desc: "冷却泵喘振、蒸汽阀卡涩、传感器干扰——设备开始随机出故障！弹窗出现后 3 秒内点击处理，同时把温度稳定在 300 ~ 350°C，坚持 20 秒。",
    check: (s) => s.temp >= 300 && s.temp <= 350,
    duration: 20,
    init: { power: 65, controlRod: 35, cooling: 85 },
    refPower: 80,
    events: true,
    tips: ["故障弹窗出现后要快——3 秒倒计时", "处理成功还会奖励发电量"],
  },
  {
    id: 6,
    icon: "⚡",
    name: "满负荷发电",
    sub: "冲刺 · 高功率赚电",
    desc: "把功率稳定在 75% ~ 90% 的高位，同时用冷却和控制棒压住温度（300 ~ 355°C）。累计发电量达到 80 kWh 即过关！超时 35 秒则失败。",
    check: (s) => s.temp >= 300 && s.temp <= 355 && s.power >= 75 && s.power <= 90,
    duration: 0,
    elecTarget: 80,
    timeout: 35,
    init: { power: 50, controlRod: 30, cooling: 80 },
    refPower: 90,
    tips: ["功率越高发电越多——但热量也越高，注意冷却", "发电量实时累计，达标即胜利"],
  },
  {
    id: 7,
    icon: "🌪️",
    name: "终极考验",
    sub: "全能 · 所有故障叠加",
    desc: "冷却泵降效、功率随机波动、蒸汽持续积累、突发设备故障接连来袭。坚持 20 秒，让温度保持在 280 ~ 360°C，别让任何指标失控。",
    check: (s) => s.temp >= 280 && s.temp <= 360,
    duration: 20,
    init: { power: 75, controlRod: 30, cooling: 90 },
    refPower: 75,
    coolingFail: true,
    events: true,
    tips: ["故障弹窗优先处理，其余时间微调参数", "你是最后的防线——冷静！"],
  },
];

// 突发设备故障池（QTE）
const eventPool = [
  { id: "pump", icon: "🔧", title: "冷却泵喘振！", desc: "不处理的话冷却效率将骤降 30%", action: "立即重启", bad: "冷却 ×0.7（5 秒）" },
  { id: "valve", icon: "⚙️", title: "蒸汽阀卡涩！", desc: "蒸汽排不出去，压力正在飙升", action: "手动开阀", bad: "蒸汽 +25%" },
  { id: "sensor", icon: "📡", title: "传感器干扰！", desc: "温度读数即将失真", action: "屏蔽干扰", bad: "温度跳变 ±12°C" },
];
const EVENT_WINDOW = 3; // 处理时限（秒）
const EVENT_BONUS_ELEC = 8; // 成功处理奖励发电量 (kWh)

// 参数定义（unlock = 解锁关卡号）
const params = [
  {
    key: "power",
    label: "反应功率",
    en: "Power",
    unit: "%",
    min: 0,
    max: 100,
    color: "#fbbf24",
    unlock: 1,
    desc: "堆芯裂变强度，影响温度上升趋势",
  },
  {
    key: "cooling",
    label: "冷却能力",
    en: "Cooling",
    unit: "%",
    min: 0,
    max: 100,
    color: "#60a5fa",
    unlock: 2,
    desc: "冷却剂流量，影响散热速率",
  },
  {
    key: "controlRod",
    label: "控制棒位置",
    en: "Control Rod",
    unit: "%",
    min: 0,
    max: 100,
    color: "#a78bfa",
    unlock: 4,
    desc: "0% = 完全拔出（反应最强），100% = 完全插入（停堆）",
  },
];

const statusStyles = {
  shutdown: { icon: "🛑", bg: "bg-surface2", text: "text-muted", dot: "bg-muted", glow: "" },
  stable: { icon: "✅", bg: "bg-ok/10", text: "text-ok", dot: "bg-ok", glow: "shadow-[0_0_20px_rgba(52,211,153,0.3)]" },
  cooling: { icon: "❄️", bg: "bg-ok/10", text: "text-ok", dot: "bg-ok", glow: "" },
  heating: { icon: "🌡️", bg: "bg-accent2/10", text: "text-accent2", dot: "bg-accent2", glow: "" },
  warning: { icon: "⚠️", bg: "bg-accent2/15", text: "text-accent2", dot: "bg-accent2 animate-pulse-slow", glow: "shadow-glow-amber" },
  scram: { icon: "🚨", bg: "bg-danger/15", text: "text-danger", dot: "bg-danger animate-pulse-slow", glow: "shadow-glow-danger" },
};

// 本地最佳星级
function loadBest() {
  try {
    return JSON.parse(localStorage.getItem("reactor-stars")) || {};
  } catch {
    return {};
  }
}

/* ============ 滑块（未解锁时锁定） ============ */
function Slider({ param, value, onChange, locked }) {
  return (
    <div className="card relative">
      {locked && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-bg/75 backdrop-blur-[2px]">
          <div className="text-center">
            <div className="text-2xl">🔒</div>
            <div className="mt-1 text-sm font-semibold text-muted">
              第 {param.unlock} 关解锁
            </div>
          </div>
        </div>
      )}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: param.color }} />
          <span className="font-semibold text-ink">{param.label}</span>
          <span className="font-mono text-xs text-muted">{param.en}</span>
        </div>
        <span className="font-mono text-lg font-bold" style={{ color: param.color }}>
          {value}
          <span className="text-xs text-muted">{param.unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={param.min}
        max={param.max}
        value={value}
        disabled={locked}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: param.color }}
      />
      <p className="mt-2 text-xs text-muted">{param.desc}</p>
    </div>
  );
}

/* ============ 星级展示 ============ */
function Stars({ n, size = "text-3xl", delay = 0 }) {
  return (
    <div className="flex justify-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`animate-star ${size} ${i < n ? "text-accent2" : "text-surface2"}`}
          style={{ animationDelay: `${delay + i * 0.18}s` }}
        >
          {i < n ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

/* ============ 关卡进度条 ============ */
function LevelProgress({ current, completed, best }) {
  return (
    <div className="mb-6 flex items-center gap-1.5">
      {levels.map((l, i) => {
        const done = completed.includes(l.id) || i < current;
        const active = i === current;
        const n = best[l.id] || 0;
        return (
          <div key={l.id} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                done ? "bg-accent" : active ? "bg-accent/50 animate-pulse-slow" : "bg-surface2"
              }`}
            />
            <div
              className={`mt-1.5 text-center text-[10px] font-medium transition-colors ${
                active ? "text-accent" : done ? "text-ink/60" : "text-muted/40"
              }`}
            >
              {l.icon} {l.name}
            </div>
            {done && n > 0 && (
              <div className="text-center text-[10px] leading-none tracking-tighter text-accent2">
                {"★".repeat(n)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============ 温度趋势条 ============ */
function TempTrend({ temperature }) {
  const [history, setHistory] = useState(Array(40).fill(INITIAL_TEMP));
  useEffect(() => {
    setHistory((h) => [...h.slice(1), temperature]);
  }, [temperature]);

  const max = Math.max(...history, WARN_TEMP + 10);
  const min = Math.min(...history, 200);
  const range = max - min || 1;

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted">温度趋势（最近 8 秒）</span>
        <span className="font-mono text-xs text-muted">实时刷新</span>
      </div>
      <div className="flex h-28 items-end gap-0.5">
        {history.map((t, i) => {
          const pct = ((t - min) / range) * 100;
          const color = t >= LIMIT_TEMP ? "#f87171" : t >= WARN_TEMP ? "#fbbf24" : "#22d3ee";
          return (
            <div
              key={i}
              className="flex-1 rounded-t transition-all duration-200"
              style={{
                height: `${Math.max(2, pct)}%`,
                background: color,
                opacity: 0.3 + (i / history.length) * 0.7,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ============ 突发故障弹窗（QTE） ============ */
function EventPopup({ event, onResolve }) {
  const [left, setLeft] = useState(EVENT_WINDOW);
  useEffect(() => {
    const iv = setInterval(() => setLeft((l) => Math.max(0, +(l - 0.1).toFixed(1))), 100);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    if (left <= 0) onResolve("timeout");
  }, [left, onResolve]);

  const pct = (left / EVENT_WINDOW) * 100;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-bg/70 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-danger/40 bg-surface p-6 text-center shadow-[0_0_50px_rgba(248,113,113,0.35)] animate-shake">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-danger/15 text-4xl">
          {event.icon}
        </div>
        <div className="mt-3 text-xl font-bold text-ink">{event.title}</div>
        <p className="mt-1 text-sm text-muted">{event.desc}</p>
        {/* 倒计时环 */}
        <div className="relative mx-auto mt-4 h-16 w-16">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(${left <= 1 ? "#f87171" : "#fbbf24"} ${pct * 3.6}deg, #1e2939 0deg)`,
            }}
          />
          <div className="absolute inset-1.5 grid place-items-center rounded-full bg-surface">
            <span className={`font-mono text-xl font-bold ${left <= 1 ? "text-danger" : "text-accent2"}`}>
              {left.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted">处理失败：{event.bad}</div>
        <button
          onClick={() => onResolve("success")}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-danger to-accent2 px-6 py-3 font-bold text-bg transition hover:scale-105 active:scale-95"
        >
          {event.action} ⚡ +{EVENT_BONUS_ELEC} kWh
        </button>
      </div>
    </div>
  );
}

/* ============ 主页面 ============ */
export default function Experiment() {
  const { power, controlRod, cooling, setParam, markVisited } = useStore();
  const paramValues = { power, controlRod, cooling };

  // 关卡状态
  const [currentLevel, setCurrentLevel] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [bestStars, setBestStars] = useState(loadBest);
  // 模拟状态
  const [temperature, setTemperature] = useState(INITIAL_TEMP);
  const [status, setStatus] = useState({
    key: "stable",
    label: "稳定运行",
    color: "ok",
    tip: "产热与散热达到平衡，堆芯温度稳定。",
  });
  const [deltaT, setDeltaT] = useState(0);
  const [steam, setSteam] = useState(0);
  const [stableTime, setStableTime] = useState(0);
  const [elec, setElec] = useState(0); // 本关累计发电量 kWh
  const [stars, setStars] = useState(0); // 本关获得星级
  const [failed, setFailed] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [preparing, setPreparing] = useState(true); // 关卡准备阶段：模拟暂停
  const [eventItem, setEventItem] = useState(null); // 当前突发故障
  const [pumpDown, setPumpDown] = useState(false); // 泵喘振降效中

  const tempRef = useRef(INITIAL_TEMP);
  const steamRef = useRef(0);
  const stableRef = useRef(0);
  const elecRef = useRef(0);
  const failedRef = useRef(false);
  const winRef = useRef(false);
  // 评分/事件辅助
  const powerSumRef = useRef(0);
  const ticksRef = useRef(0);
  const nextEventAtRef = useRef(30);
  const eventActiveRef = useRef(false);
  const pumpUntilRef = useRef(0);
  const pumpDownRef = useRef(false);

  const level = levels[currentLevel];
  const lv = currentLevel + 1; // 1-based 关卡号
  const totalStars = Object.values(bestStars).reduce((a, b) => a + (b || 0), 0);
  const maxStars = levels.length * 3;

  useEffect(() => {
    markVisited("experiment");
  }, [markVisited]);

  // 重置关卡：恢复初始参数（偏低合适）与模拟状态
  const startLevel = useCallback(
    (idx) => {
      const init = levels[idx].init;
      setParam("power", init.power);
      setParam("controlRod", init.controlRod);
      setParam("cooling", init.cooling);
      tempRef.current = INITIAL_TEMP;
      setTemperature(INITIAL_TEMP);
      steamRef.current = 0;
      setSteam(0);
      stableRef.current = 0;
      setStableTime(0);
      elecRef.current = 0;
      setElec(0);
      setStars(0);
      setDeltaT(0);
      failedRef.current = false;
      setFailed(false);
      winRef.current = false;
      setShowWin(false);
      setPreparing(true); // 进入准备阶段，读完规则再开始
      powerSumRef.current = 0;
      ticksRef.current = 0;
      nextEventAtRef.current = 25;
      eventActiveRef.current = false;
      pumpUntilRef.current = 0;
      pumpDownRef.current = false;
      setPumpDown(false);
      setEventItem(null);
    },
    [setParam]
  );

  // 进入新关卡时初始化
  useEffect(() => {
    startLevel(currentLevel);
  }, [currentLevel, startLevel]);

  // 突发事件：QTE 结果处理
  const resolveEvent = useCallback(
    (result) => {
      if (result === "success") {
        elecRef.current += EVENT_BONUS_ELEC;
        setElec(elecRef.current);
      } else {
        const ev = eventItem;
        if (ev?.id === "pump") {
          pumpUntilRef.current = ticksRef.current + 25; // 5 秒
          pumpDownRef.current = true;
          setPumpDown(true);
        } else if (ev?.id === "valve") {
          steamRef.current = Math.min(120, steamRef.current + 25);
          setSteam(steamRef.current);
        } else if (ev?.id === "sensor") {
          const j = Math.round(Math.random() * 24 - 12);
          const t = Math.min(400, Math.max(200, tempRef.current + j));
          tempRef.current = t;
          setTemperature(t);
        }
      }
      eventActiveRef.current = false;
      setEventItem(null);
      // 下次事件间隔 8~14 秒
      nextEventAtRef.current = ticksRef.current + 40 + Math.round(Math.random() * 30);
    },
    [eventItem]
  );

  // 通关结算：星级 = 平均功率利用率
  const finishWin = () => {
    const avgP = ticksRef.current > 0 ? powerSumRef.current / ticksRef.current : 0;
    const ref = level.refPower || 75;
    const ratio = avgP / ref;
    const n = ratio >= 0.85 ? 3 : ratio >= 0.55 ? 2 : 1;
    setStars(n);
    setBestStars((prev) => {
      const b = { ...prev, [lv]: Math.max(prev[lv] || 0, n) };
      localStorage.setItem("reactor-stars", JSON.stringify(b));
      return b;
    });
    winRef.current = true;
    setShowWin(true);
  };

  // 主模拟循环
  useEffect(() => {
    const interval = setInterval(() => {
      if (failedRef.current || winRef.current) return;
      if (preparing) return; // 准备阶段：模拟完全暂停，等玩家读完规则

      const p = power;
      const now = ticksRef.current;
      // 冷却泵降效（第 4、7 关永久；事件惩罚临时）
      const failCool = lv === 4 || lv === 7 || levels[currentLevel].coolingFail;
      const pumpPenalty = pumpDownRef.current ? 0.7 : 1;
      let effCooling = cooling * (failCool ? 0.5 : 1) * pumpPenalty;

      // 泵喘振结束
      if (pumpDownRef.current && now >= pumpUntilRef.current) {
        pumpDownRef.current = false;
        setPumpDown(false);
      }

      const current = tempRef.current;
      const next = computeStep(p, controlRod, effCooling, current);
      const dT = next - current;
      setDeltaT(dT);
      setTemperature(next);
      tempRef.current = next;
      const st = judgeStatus(p, controlRod, effCooling, next, dT);
      setStatus(st);

      // 蒸汽积累（第 3 关起，第 4 关专注温度应急不参与）
      let stm = steamRef.current;
      if (lv >= 3 && lv !== 4) {
        stm = Math.min(120, stm + (p / 100) * 3 + 0.8);
        steamRef.current = stm;
        setSteam(stm);
      }

      // 发电量：功率越高发电越多，处于目标窗口时效率更高
      const inWindow = level.check({ temp: next, power: p, steam: stm, elec: elecRef.current });
      const gain = (p / 100) * 1.0 * (inWindow ? 1.5 : 0.8);
      elecRef.current = elecRef.current + gain;
      setElec(elecRef.current);
      powerSumRef.current += p;
      ticksRef.current += 1;

      // 突发设备故障调度（第 5、7 关）
      if (level.events && !eventActiveRef.current && now >= nextEventAtRef.current) {
        const ev = eventPool[Math.floor(Math.random() * eventPool.length)];
        eventActiveRef.current = true;
        setEventItem(ev);
        return; // 等待处理，模拟暂停
      }

      // 失败判定
      if (st.key === "scram" || (lv >= 3 && lv !== 4 && stm >= 100)) {
        failedRef.current = true;
        setFailed(true);
        return;
      }
      if (level.timeout && now >= level.timeout / 0.2) {
        failedRef.current = true;
        setFailed(true);
        return;
      }

      // 通关判定
      if (level.elecTarget) {
        if (elecRef.current >= level.elecTarget) {
          finishWin();
          return;
        }
      } else {
        if (inWindow) {
          stableRef.current += 0.2;
        } else {
          stableRef.current = 0;
        }
        setStableTime(stableRef.current);
        if (stableRef.current >= level.duration) {
          finishWin();
        }
      }
    }, 200);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, power, controlRod, cooling, lv, level, eventItem, preparing]);

  // 第 5、7 关：随机功率扰动（每 2 秒）
  useEffect(() => {
    const fluctuate = currentLevel === 4 || currentLevel === 6;
    if (!fluctuate || preparing) return; // 准备阶段不扰动功率
    const t = setInterval(() => {
      const cur = useStore.getState().power;
      setParam(
        "power",
        Math.min(100, Math.max(10, Math.round(cur + (Math.random() * 16 - 8))))
      );
    }, 2000);
    return () => clearInterval(t);
  }, [currentLevel, setParam, preparing]);

  const ventSteam = () => {
    steamRef.current = Math.max(0, steamRef.current - 40);
    setSteam(steamRef.current);
  };

  const handleNextLevel = () => {
    setCompleted((c) => [...c, lv]);
    if (currentLevel < levels.length - 1) {
      // 先关闭通关弹窗，再切关，避免一帧闪现错误文案
      winRef.current = false;
      setShowWin(false);
      setCurrentLevel(currentLevel + 1);
    }
    // 最后一关：保留弹窗，让 allDone 变为 true，展示「全部通关」庆祝与跳转
  };

  const handleRetry = () => startLevel(currentLevel);
  const handleReplay = () => startLevel(currentLevel);

  const style = statusStyles[status.key] || statusStyles.stable;
  const tempColor =
    temperature >= LIMIT_TEMP
      ? "#f87171"
      : temperature >= WARN_TEMP
      ? "#fbbf24"
      : "#22d3ee";
  const tempPct = Math.min(100, Math.max(0, ((temperature - 200) / 250) * 100));
  // 全部通关：仅在刚完成最后一关时庆祝（重玩旧关不算）
  const allDone = lv === levels.length && completed.includes(lv);
  const failReason =
    lv === 3 && steamRef.current >= 100
      ? "蒸汽压力达到 100%，管道破裂！"
      : level.timeout && ticksRef.current >= level.timeout / 0.2
      ? "时间到！未达到本关目标。"
      : "温度超过安全极限，保护系统触发自动紧急停堆。";
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 animate-fade-in">
      {/* 面包屑 */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted">
        <Link to="/" className="hover:text-accent transition">首页</Link>
        <span className="text-muted/40">/</span>
        <Link to="/plant" className="hover:text-accent transition">核电站探索</Link>
        <span className="text-muted/40">/</span>
        <span className="text-accent font-medium">反应堆控制台</span>
      </div>

      <div className="mb-6">
        <div className="mb-2 font-mono text-xs text-accent">05 / 亲手改变参数</div>
        <h1 className="text-3xl font-bold text-ink">反应堆操纵员训练</h1>
        <p className="mt-2 max-w-2xl text-muted">
          七关递进，像开火车一样——先学会点火，再学会控温、排放、应急，最后冲刺发电、直面所有故障。每通关一关，解锁一个新操作。
        </p>
        {/* HUD：星数 + 发电量 */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="chip">
            <span className="text-accent2">★</span> {totalStars} / {maxStars} 星
          </span>
          <span className="chip">
            ⚡ {elec.toFixed(1)} kWh <span className="text-muted/50">本关发电</span>
          </span>
          {lv === 6 && (
            <span className="chip">
              🎯 目标 {level.elecTarget} kWh · 限时 {level.timeout}s
            </span>
          )}
        </div>
      </div>

      <LevelProgress current={currentLevel} completed={completed} best={bestStars} />

      {/* 当前关卡卡牌 */}
      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-accent/25 bg-accent/5 p-5 sm:flex-row sm:items-center">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-accent/15 text-3xl">
          {level.icon}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-accent">第 {lv} 关 / {levels.length}</span>
            <span className="rounded bg-accent/15 px-2 py-0.5 font-mono text-[10px] text-accent">
              {level.sub}
            </span>
            {bestStars[lv] > 0 && (
              <span className="rounded bg-accent2/15 px-2 py-0.5 font-mono text-[10px] text-accent2">
                最佳 {"★".repeat(bestStars[lv])}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xl font-bold text-ink">{level.name}</div>
          <p className="mt-1 text-sm text-muted">{level.desc}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {level.tips.map((t, i) => (
              <span key={i} className="rounded border border-line bg-surface/60 px-2 py-0.5 text-[11px] text-muted">
                💡 {t}
              </span>
            ))}
          </div>
        </div>
        {/* 目标进度 */}
        <div className="w-full sm:w-44">
          {level.elecTarget ? (
            <>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted">发电进度</span>
                <span className="font-mono font-bold text-accent2">
                  {Math.min(level.elecTarget, elec).toFixed(0)} / {level.elecTarget} kWh
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent2 to-ok transition-all duration-200"
                  style={{ width: `${(Math.min(level.elecTarget, elec) / level.elecTarget) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted">目标保持</span>
                <span className="font-mono font-bold text-accent">
                  {Math.min(level.duration, stableTime).toFixed(0)} / {level.duration}s
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-ok transition-all duration-200"
                  style={{ width: `${(Math.min(level.duration, stableTime) / level.duration) * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 故障警示横幅 */}
      {(lv === 4 || lv === 7) && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          ⚠️ 冷却泵故障中：实际冷却效率仅为 {Math.round(cooling * 0.5)}%（{cooling}% × 50%），快用控制棒降功率！
        </div>
      )}
      {pumpDown && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-accent2/30 bg-accent2/10 px-4 py-2.5 text-sm text-accent2 animate-shake">
          🔧 冷却泵喘振降效中：实际冷却效率 ×70%，还剩约 {Math.max(0, Math.ceil((pumpUntilRef.current - ticksRef.current) * 0.2))} 秒！
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Left: control panel */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {params.map((p) => (
              <Slider
                key={p.key}
                param={p}
                value={paramValues[p.key]}
                locked={lv < p.unlock}
                onChange={(v) => setParam(p.key, v)}
              />
            ))}
          </div>

          {/* 蒸汽系统（第 3 关解锁；第 4 关专注温度应急） */}
          {lv >= 3 && lv !== 4 && (
            <div className="card">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted">蒸汽压力</span>
                <span
                  className={`font-mono text-lg font-bold ${
                    steam >= 80 ? "text-danger" : steam >= 60 ? "text-accent2" : "text-ink"
                  }`}
                >
                  {Math.round(steam)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface2">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, steam)}%`,
                    background:
                      steam >= 80 ? "#f87171" : steam >= 60 ? "#fbbf24" : "#22d3ee",
                  }}
                />
              </div>
              <button
                onClick={ventSteam}
                className="mt-3 w-full rounded-lg border border-accent/30 bg-accent/10 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20 active:scale-95"
              >
                💨 排放蒸汽（-40%）
              </button>
              <p className="mt-2 text-xs text-muted">
                压力超过 80% 及时排放，100% 会爆管！就像高压锅要放气。
              </p>
            </div>
          )}

          {/* 状态显示 */}
          <div className={`card ${style.bg} ${style.glow} transition-colors`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${style.dot}`} />
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted">当前状态</div>
                  <div className={`flex items-center gap-2 text-2xl font-bold ${style.text}`}>
                    <span className="text-2xl">{style.icon}</span>
                    {status.label}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted">温度变化率</div>
                <div
                  className="font-mono text-lg font-bold"
                  style={{ color: deltaT > 0 ? "#fbbf24" : deltaT < 0 ? "#60a5fa" : "#8a9bb3" }}
                >
                  {deltaT > 0 ? "+" : ""}
                  {deltaT.toFixed(1)} °C/s
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-line bg-bg/40 p-3">
              <div className="flex items-start gap-2">
                <span className="text-accent">💡</span>
                <p className="text-sm text-ink">{status.tip}</p>
              </div>
            </div>
          </div>

          <TempTrend temperature={temperature} />
        </div>

        {/* Right: reactor core + temperature gauge */}
        <div className="space-y-4">
          <ReactorCore power={power} temperature={temperature} steam={steam} />

          <div className="card">
            <div className="mb-3 text-xs uppercase tracking-wider text-muted">堆芯温度</div>
            <div className="flex items-end gap-2">
              <span className="font-mono text-5xl font-bold transition-colors" style={{ color: tempColor }}>
                {Math.round(temperature)}
              </span>
              <span className="mb-1.5 text-lg text-muted">°C</span>
            </div>
            <div className="mt-2 text-xs text-muted">教育示意值</div>

            {/* Vertical thermometer */}
            <div className="relative mt-4 h-64 w-full overflow-hidden rounded-lg bg-surface2">
              <div
                className="absolute bottom-0 left-0 w-full rounded-lg transition-all duration-300"
                style={{
                  height: `${tempPct}%`,
                  background: `linear-gradient(180deg, ${tempColor}, ${tempColor}66)`,
                  boxShadow: `0 0 20px ${tempColor}80`,
                }}
              />
              <div
                className="absolute left-0 w-full border-t border-dashed border-accent2/50"
                style={{ bottom: `${((WARN_TEMP - 200) / 250) * 100}%` }}
              >
                <span className="absolute right-1 -top-2.5 font-mono text-[10px] text-accent2">
                  警戒 {WARN_TEMP}°C
                </span>
              </div>
              <div
                className="absolute left-0 w-full border-t border-dashed border-danger/50"
                style={{ bottom: `${((LIMIT_TEMP - 200) / 250) * 100}%` }}
              >
                <span className="absolute right-1 -top-2.5 font-mono text-[10px] text-danger">
                  极限 {LIMIT_TEMP}°C
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="mb-2 text-xs uppercase tracking-wider text-muted">参数快照</div>
            <div className="space-y-1.5 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted">power</span>
                <span className="text-accent2">{power}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">controlRod</span>
                <span style={{ color: "#a78bfa" }}>{controlRod}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">cooling</span>
                <span style={{ color: "#60a5fa" }}>{cooling}%</span>
              </div>
              <div className="flex justify-between border-t border-line pt-1.5">
                <span className="text-muted">elec</span>
                <span className="text-ok">{elec.toFixed(1)} kWh</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 叙事性下一步 */}
      <NextStep
        to="/tutor"
        step="下一步 → 07"
        hint="为什么温度会失控？"
        title="AI 解释「为什么」"
        narrative="你刚刚亲手操纵了反应堆——温度为什么升？蒸汽为什么要排？紧急停堆为什么救了你？问 AI 导师，它会从知识库检索，给你讲明白。"
        color="#34d399"
      />

      {/* 突发故障弹窗 */}
      {eventItem && (
        <EventPopup event={eventItem} onResolve={resolveEvent} />
      )}

      {/* 每关准备阶段：给玩家喘息时间读规则，模拟暂停 */}
      {preparing && !showWin && !failed && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-bg/85 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-accent/30 bg-surface p-8 text-center shadow-[0_0_50px_rgba(34,211,238,0.2)] animate-scale-in">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-4xl">
              {level.icon}
            </div>
            <div className="mt-4 font-mono text-xs text-accent">第 {lv} 关 · 准备阶段</div>
            <div className="mt-1 text-2xl font-bold text-ink">{level.name}</div>
            <div className="mt-1 text-sm font-medium text-accent2">{level.sub}</div>
            <p className="mt-3 text-sm text-muted">{level.desc}</p>
            <div className="mt-4 space-y-2 text-left">
              {level.tips.map((t, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-line bg-bg/40 px-3 py-2 text-xs text-muted"
                >
                  <span className="mt-0.5">💡</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted/60">
              模拟已暂停 —— 读完规则，深呼吸，准备好了再开始。
            </p>
            <button
              onClick={() => setPreparing(false)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-accent to-ok px-6 py-3 font-bold text-bg transition hover:scale-105 active:scale-95"
            >
              开始操纵 →
            </button>
          </div>
        </div>
      )}

      {/* 通关弹窗 */}
      {showWin && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-ok/30 bg-surface p-8 text-center shadow-[0_0_60px_rgba(52,211,153,0.2)] animate-scale-in">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-ok/15 text-4xl">
              {allDone ? "🎓" : "🏆"}
            </div>
            <div className="mt-4 font-mono text-xs text-ok">
              {allDone ? "全部通关" : `第 ${lv} 关完成`}
            </div>
            <div className="mt-1 text-2xl font-bold text-ink">
              {allDone ? "恭喜你，资深操纵员！" : `${level.name} · 达成`}
            </div>
            {/* 星级 */}
            <div className="mt-3">
              <Stars n={stars} />
              <div className="mt-1 text-xs text-muted">
                本关发电 <span className="font-mono text-accent2">{elec.toFixed(1)} kWh</span> · 总星数{" "}
                <span className="font-mono text-accent2">{totalStars} / {maxStars}</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted">
              {allDone
                ? "你已掌握点火、控温、排放、应急与抗扰动——这就是核电站操纵员日常的缩影。想理解背后的原理，去问 AI 导师吧。"
                : levels[currentLevel + 1]?.desc}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {!allDone && (
                <button
                  onClick={handleNextLevel}
                  className="rounded-xl bg-gradient-to-r from-accent to-ok px-6 py-3 font-bold text-bg transition hover:scale-105 active:scale-95"
                >
                  进入下一关 →
                </button>
              )}
              <button
                onClick={handleReplay}
                className="rounded-xl border border-accent2/30 px-6 py-2.5 text-sm font-medium text-accent2 transition hover:border-accent2/60 hover:bg-accent2/10"
              >
                🔄 重玩本关刷三星
              </button>
              <Link
                to="/tutor"
                className="rounded-xl border border-line px-6 py-2.5 text-sm font-medium text-muted transition hover:border-accent/40 hover:text-accent"
              >
                {allDone ? "继续探索 →" : "先去看看 AI 导师"}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 失败弹窗 */}
      {failed && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-danger/30 bg-surface p-8 text-center shadow-[0_0_60px_rgba(248,113,113,0.2)] animate-scale-in">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-danger/15 text-4xl">
              🚨
            </div>
            <div className="mt-4 font-mono text-xs text-danger">第 {lv} 关 · 任务失败</div>
            <div className="mt-1 text-2xl font-bold text-ink">保护系统介入了</div>
            <p className="mt-2 text-sm text-muted">{failReason}</p>
            <div className="mt-4 rounded-lg border border-line bg-bg/40 p-3 text-left text-xs text-muted">
              <div className="mb-1 font-semibold text-ink">操纵员提示</div>
              <div>{level.tips.join("；")}。每关开始时参数都会重置到安全值，放心再来。</div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleRetry}
                className="flex-1 rounded-xl bg-gradient-to-r from-danger to-accent2 px-6 py-3 font-bold text-bg transition hover:scale-105 active:scale-95"
              >
                重新尝试
              </button>
              <button
                onClick={() => {
                  failedRef.current = false;
                  setFailed(false);
                }}
                className="flex-1 rounded-xl border border-line px-6 py-3 text-sm font-medium text-muted transition hover:border-accent/40 hover:text-accent"
              >
                观察现场
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
