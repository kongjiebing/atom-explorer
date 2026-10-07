// 教育级简化热工模型 — 保留产热/散热/温度变化因果逻辑
// 教育示意值，非真实核电工程参数

const MAX_HEAT = 800; // 满功率产热功率（相对单位）
const COOLING_FACTOR = 1.6; // 散热系数
const THERMAL_MASS = 40; // 热容
const AMBIENT_TEMP = 250; // 环境/起始温度 (°C，示意)
const WARN_TEMP = 340; // 警戒温度
const LIMIT_TEMP = 390; // 极限温度
const STABLE_THRESHOLD = 2; // 温度变化率阈值

// 计算单步温度变化
export function computeStep(power, controlRod, cooling, currentTemp) {
  // 有效反应性 = 功率设定 × (1 - 控制棒插入比例)   [power 0-100 → 0-1]
  const reactivity = (power / 100) * (1 - controlRod / 100);
  // 产热功率
  const heatGen = reactivity * MAX_HEAT;
  // 散热功率 = 冷却能力 × 当前温度 × 系数
  const heatDiss = (cooling / 100) * currentTemp * COOLING_FACTOR;
  // 温度变化率
  const deltaT = (heatGen - heatDiss) / THERMAL_MASS;
  return currentTemp + deltaT;
}

// 判定状态
export function judgeStatus(power, controlRod, cooling, currentTemp, deltaT) {
  if (controlRod >= 95 || power === 0) {
    return { key: "shutdown", label: "停堆", color: "muted", tip: "控制棒完全插入，链式反应停止，温度缓慢下降。" };
  }
  if (currentTemp >= LIMIT_TEMP) {
    return { key: "scram", label: "紧急停堆", color: "danger", tip: "温度超过安全极限，保护系统触发自动紧急停堆。" };
  }
  if (currentTemp >= WARN_TEMP) {
    return { key: "warning", label: "过热警告", color: "accent2", tip: "温度接近安全限值，请加强冷却或降低功率。" };
  }
  if (deltaT > STABLE_THRESHOLD) {
    return { key: "heating", label: "升温中", color: "accent2", tip: "反应性偏高，堆芯温度正在上升。" };
  }
  if (deltaT < -STABLE_THRESHOLD) {
    return { key: "cooling", label: "降温中", color: "ok", tip: "散热大于产热，温度正在下降。" };
  }
  return { key: "stable", label: "稳定运行", color: "ok", tip: "产热与散热达到平衡，堆芯温度稳定。" };
}

// 初始化温度
export const INITIAL_TEMP = AMBIENT_TEMP + 50;

export { WARN_TEMP, LIMIT_TEMP };
