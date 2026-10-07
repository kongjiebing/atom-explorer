// 模拟能源影响数据 — 教育示意值，非真实工程参数
// 减排逻辑链：年发电量 → 同电量火电排放(0.85 kg CO₂/kWh) → 核电≈0 → 减排量 → 等效种树(≈50万棵/万吨)
export const cityScales = [
  {
    id: "small",
    label: "50 万人城市",
    sub: "中等城镇",
    population: 500000,
    reactors: "1 × 小型机组",
    capacity: "300 MW",
    annualPower: 24, // 亿 kWh
    co2Reduction: 204, // 万吨（同电量火电排放，核电≈0 故全部省下）
    thermalCo2: 204, // 同电量火电排放（万吨）
    nuclearCo2: "≈ 0", // 核电运行期碳排放
    treeCount: "1 亿", // 等效种树（棵）
    treeDensity: 1, // 视觉密度：树林排数
    treeGrowth: 36, // 视觉树高基准
    color: "#34d399",
  },
  {
    id: "medium",
    label: "300 万人城市",
    sub: "大型城市",
    population: 3000000,
    reactors: "2 × 标准压水堆",
    capacity: "2000 MW",
    annualPower: 160,
    co2Reduction: 1360,
    thermalCo2: 1360,
    nuclearCo2: "≈ 0",
    treeCount: "7 亿",
    treeDensity: 2,
    treeGrowth: 46,
    color: "#22d3ee",
  },
  {
    id: "large",
    label: "1000 万人城市",
    sub: "超级都市",
    population: 10000000,
    reactors: "4 × 标准压水堆",
    capacity: "4000 MW",
    annualPower: 320,
    co2Reduction: 2720,
    thermalCo2: 2720,
    nuclearCo2: "≈ 0",
    treeCount: "14 亿",
    treeDensity: 3,
    treeGrowth: 56,
    color: "#fbbf24",
  },
];

export const formatNumber = (n) => n.toLocaleString("zh-CN");
