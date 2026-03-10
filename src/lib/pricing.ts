export type PlanKey = "free" | "pro" | "studio";

export type PricingPlan = {
  key: PlanKey;
  name: string;
  quota: number;
  isUnlimited?: boolean;
  priceCnyMonthly: number;
  zhTitle: string;
  enTitle: string;
  zhDesc: string;
  enDesc: string;
  zhFeatures: string[];
  enFeatures: string[];
  badgeZh?: string;
  badgeEn?: string;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: "free",
    name: "Free",
    quota: 5,
    priceCnyMonthly: 0,
    zhTitle: "免费体验",
    enTitle: "Free Trial",
    zhDesc: "适合初次体验与测试流程",
    enDesc: "Best for first-time testing",
    zhFeatures: [
      "每月 5 次基础生成额度",
      "支持剧本上传与 AI 解析",
      "查看结果页与任务记录",
    ],
    enFeatures: [
      "5 generations per month",
      "Script upload and AI analysis",
      "Result page and job history",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    quota: 50,
    priceCnyMonthly: 99,
    zhTitle: "进阶创作",
    enTitle: "Pro Creator",
    zhDesc: "适合稳定使用、持续改稿和批量测试",
    enDesc: "For regular creators and stable production",
    zhFeatures: [
      "每月 50 次生成额度",
      "更适合连续剧本测试与迭代",
      "适合短剧 / 漫剧生产前期",
    ],
    enFeatures: [
      "50 generations per month",
      "Better for continuous script iteration",
      "Suitable for early drama/comic production",
    ],
    badgeZh: "推荐",
    badgeEn: "Popular",
  },
  {
    key: "studio",
    name: "Studio",
    quota: 999999,
    isUnlimited: true,
    priceCnyMonthly: 399,
    zhTitle: "团队与高频生产",
    enTitle: "Studio Workflow",
    zhDesc: "适合高频创作与长期项目",
    enDesc: "For high-frequency and long-term projects",
    zhFeatures: [
      "无限额度体验",
      "更适合长期内容生产",
      "适合工作室与内容团队",
    ],
    enFeatures: [
      "Unlimited usage experience",
      "Best for ongoing production",
      "Built for teams and studios",
    ],
  },
];

export function getPlanByKey(plan: string | null | undefined) {
  return PRICING_PLANS.find((item) => item.key === plan) || PRICING_PLANS[0];
}

export function formatPlanPriceCny(price: number) {
  return `¥${price}`;
}