"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";

type PlanKey = "free" | "pro" | "studio";

type PayResponse = {
  type?: "redirect" | "qrcode";
  url?: string;
  code_url?: string;
  message?: string;
};

type PlanConfig = {
  key: PlanKey;
  title: string;
  badgeZh: string;
  badgeEn: string;
  priceZh: string;
  priceEn: string;
  descZh: string;
  descEn: string;
  featuresZh: string[];
  featuresEn: string[];
};

const PLAN_CONFIGS: PlanConfig[] = [
  {
    key: "free",
    title: "Free",
    badgeZh: "免费体验",
    badgeEn: "Free Trial",
    priceZh: "¥0",
    priceEn: "$0",
    descZh: "适合第一次体验平台流程，快速了解 AI 剧本解析和结构化生成。",
    descEn: "Best for first-time users who want to explore AI script parsing and structured generation.",
    featuresZh: ["基础体验", "适合试用流程", "快速开始"],
    featuresEn: ["Basic access", "Best for first trial", "Fast start"],
  },
  {
    key: "pro",
    title: "Pro",
    badgeZh: "推荐方案",
    badgeEn: "Most Popular",
    priceZh: "¥99 / 月",
    priceEn: "$19 / month",
    descZh: "适合个人创作者与高频使用者，更适合日常短剧与漫剧内容生产。",
    descEn: "Great for solo creators and frequent users building story content regularly.",
    featuresZh: ["更多生成额度", "适合日常创作", "更稳定的个人创作支持"],
    featuresEn: ["More generation quota", "Better for daily creation", "More stable solo workflow"],
  },
  {
    key: "studio",
    title: "Studio",
    badgeZh: "团队方案",
    badgeEn: "For Teams",
    priceZh: "¥399 / 月",
    priceEn: "$49 / month",
    descZh: "适合工作室和团队项目生产，支持更高强度、更连续的内容工作流。",
    descEn: "Built for studios and teams running heavier, more continuous production workflows.",
    featuresZh: ["更高使用上限", "适合团队生产", "更适合长期项目"],
    featuresEn: ["Higher usage ceiling", "Built for teams", "Better for long-term projects"],
  },
];

function normalizePlan(rawPlan: string | null): PlanKey {
  if (!rawPlan) return "pro";

  const value = rawPlan.toLowerCase();

  if (value.includes("studio")) return "studio";
  if (value.includes("free")) return "free";
  return "pro";
}

function toApiPlanValue(plan: PlanKey) {
  if (plan === "studio") return "studio-monthly";
  if (plan === "free") return "free";
  return "pro-monthly";
}

export default function CheckoutPage() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();

  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const incomingPlan = params.get("plan");
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(normalizePlan(incomingPlan));
  const [loadingMethod, setLoadingMethod] = useState<"" | "alipay" | "wechat">("");
  const [errorMessage, setErrorMessage] = useState("");
  const [qr, setQr] = useState<string>("");

  const currentPlan = useMemo(
    () => PLAN_CONFIGS.find((item) => item.key === selectedPlan) || PLAN_CONFIGS[1],
    [selectedPlan]
  );

  async function pay(method: "alipay" | "wechat") {
    if (selectedPlan === "free") {
      router.push(`/${locale}/generate`);
      return;
    }

    setLoadingMethod(method);
    setErrorMessage("");
    setQr("");

    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: toApiPlanValue(selectedPlan),
          method,
        }),
      });

      const data: PayResponse = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || (isZh ? "支付请求失败" : "Payment request failed"));
      }

      if (data.type === "redirect" && data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.type === "qrcode" && data.code_url) {
        setQr(data.code_url);
        return;
      }

      throw new Error(isZh ? "未获取到有效支付信息" : "No valid payment response returned");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isZh
          ? "支付请求失败，请稍后再试"
          : "Payment request failed, please try again later"
      );
    } finally {
      setLoadingMethod("");
    }
  }

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[120px] h-[320px] w-[320px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-120px] top-[200px] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}/billing`} />
            <div>
              <div className="text-xl font-semibold tracking-tight text-white">FulushouVideo</div>
              <div className="text-xs text-zinc-400">
                {isZh ? "结算与支付" : "Checkout & Payment"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/billing`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
            >
              {isZh ? "返回套餐页" : "Back to Pricing"}
            </Link>

            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-10 pt-16">
        <div className="grid items-start gap-10 xl:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-medium text-emerald-300">
              {isZh ? "结算中心" : "Checkout Center"}
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">
              {isZh ? "选择支付方式，完成你的套餐升级" : "Choose a payment method and complete your upgrade"}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              {isZh
                ? "升级后你将获得更适合创作频率与项目规模的工作流支持。当前页面保留你现有的支付接口逻辑，并以更完整的产品方式呈现。"
                : "After upgrading, you get a workflow better suited to your creative frequency and project scale. This page keeps your current payment logic while presenting it in a more complete product experience."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "支付宝" : "Alipay"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "微信支付" : "WeChat Pay"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "套餐升级" : "Plan Upgrade"}
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "支付方式" : "Payment"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{isZh ? "国内友好" : "CN Friendly"}</div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "升级方向" : "Upgrade Goal"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{isZh ? "创作效率" : "Efficiency"}</div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "适合生产" : "Workflow"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{isZh ? "持续可用" : "Continuous"}</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-emerald-400/10 via-transparent to-cyan-400/10 blur-xl" />
            <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="text-3xl font-bold text-white">
                {isZh ? "订单摘要" : "Order Summary"}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                {isZh ? "先确认套餐，再选择支付方式。" : "Confirm your plan, then choose a payment method."}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {PLAN_CONFIGS.map((plan) => {
                  const active = selectedPlan === plan.key;

                  return (
                    <button
                      key={plan.key}
                      onClick={() => {
                        setSelectedPlan(plan.key);
                        setQr("");
                        setErrorMessage("");
                      }}
                      className={`rounded-[24px] border p-4 text-left transition ${
                        active
                          ? "border-emerald-400/30 bg-emerald-400/10"
                          : "border-white/10 bg-black/25 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="text-sm text-zinc-400">{isZh ? plan.badgeZh : plan.badgeEn}</div>
                      <div className="mt-2 text-2xl font-bold text-white">{plan.title}</div>
                      <div className="mt-2 text-sm text-zinc-300">
                        {isZh ? plan.priceZh : plan.priceEn}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "当前选择" : "Selected Plan"}</div>
                <div className="mt-3 text-4xl font-bold text-white">{currentPlan.title}</div>
                <div className="mt-2 text-lg text-emerald-300">
                  {isZh ? currentPlan.priceZh : currentPlan.priceEn}
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-300">
                  {isZh ? currentPlan.descZh : currentPlan.descEn}
                </p>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "套餐包含" : "Included"}</div>
                <div className="mt-3 space-y-3">
                  {(isZh ? currentPlan.featuresZh : currentPlan.featuresEn).map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {selectedPlan === "free" ? (
                <div className="mt-6">
                  <Link
                    href={`/${locale}/generate`}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
                  >
                    {isZh ? "免费开始使用" : "Start Free"}
                  </Link>
                </div>
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => pay("alipay")}
                    disabled={loadingMethod !== ""}
                    className="rounded-2xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
                  >
                    {loadingMethod === "alipay"
                      ? isZh
                        ? "支付宝处理中..."
                        : "Alipay loading..."
                      : isZh
                      ? "支付宝支付"
                      : "Pay with Alipay"}
                  </button>

                  <button
                    onClick={() => pay("wechat")}
                    disabled={loadingMethod !== ""}
                    className="rounded-2xl bg-green-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-400 disabled:opacity-50"
                  >
                    {loadingMethod === "wechat"
                      ? isZh
                        ? "微信处理中..."
                        : "WeChat loading..."
                      : isZh
                      ? "微信扫码支付"
                      : "Pay with WeChat"}
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              {qr && (
                <div className="mt-6 rounded-[24px] border border-white/8 bg-black/40 p-5">
                  <div className="text-xl font-semibold text-white">
                    {isZh ? "微信扫码支付" : "Scan QR with WeChat"}
                  </div>
                  <div className="mt-3 text-sm text-zinc-400">
                    {isZh ? "请使用微信扫码完成支付。" : "Please use WeChat to scan and complete payment."}
                  </div>

                  <div className="mt-5 flex justify-center">
                    <img
                      src={qr}
                      alt={isZh ? "微信支付二维码" : "WeChat QR Code"}
                      className="h-56 w-56 rounded-2xl border border-white/10 bg-white p-3 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-zinc-900/90 via-zinc-900/80 to-zinc-900/90 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          <div className="max-w-4xl">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "为什么现在升级" : "Why Upgrade Now"}
            </div>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-white">
              {isZh ? "当创作频率变高，升级会比继续将就更省时间" : "When your workflow grows, upgrading saves more time than staying limited"}
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              {isZh
                ? "如果你已经开始持续生成内容、频繁测试剧本、或者正在做团队项目，那么更高等级的套餐会明显降低你的流程摩擦，让平台更像真正的生产工具。"
                : "If you are generating more often, testing scripts repeatedly, or running team projects, a higher plan will reduce friction and make the platform feel like a real production tool."}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <div className="text-sm font-medium text-emerald-300">{isZh ? "常见问题" : "FAQ"}</div>
          <h2 className="mt-3 text-4xl font-bold text-white">
            {isZh ? "支付与升级常见问题" : "Common checkout questions"}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
            <div className="text-lg font-semibold text-white">
              {isZh ? "支持哪些支付方式？" : "Which payment methods are supported?"}
            </div>
            <div className="mt-3 text-sm leading-7 text-zinc-400">
              {isZh
                ? "当前结算页支持支付宝支付与微信扫码支付。"
                : "The current checkout supports Alipay and WeChat QR payment."}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
            <div className="text-lg font-semibold text-white">
              {isZh ? "升级后会发生什么？" : "What happens after upgrading?"}
            </div>
            <div className="mt-3 text-sm leading-7 text-zinc-400">
              {isZh
                ? "你的账户套餐会更新，后台订单系统也会记录对应的支付结果。"
                : "Your account plan updates, and the admin order system records the corresponding payment result."}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
            <div className="text-lg font-semibold text-white">
              {isZh ? "如果我只是想先体验？" : "What if I just want to try it first?"}
            </div>
            <div className="mt-3 text-sm leading-7 text-zinc-400">
              {isZh
                ? "你可以先使用 Free 方案体验平台流程，再决定是否升级。"
                : "You can start with the Free plan first and upgrade later when needed."}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
            <div className="text-lg font-semibold text-white">
              {isZh ? "团队应该选哪个方案？" : "Which plan is best for teams?"}
            </div>
            <div className="mt-3 text-sm leading-7 text-zinc-400">
              {isZh
                ? "如果你在做工作室或团队项目，Studio 会更适合持续生产。"
                : "If you run studio or team-based projects, Studio is the better fit for continuous production."}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-[36px] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 via-emerald-400/10 to-cyan-400/10 p-10 text-center shadow-[0_20px_80px_rgba(16,185,129,0.08)]">
          <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative text-sm font-medium text-emerald-200">
            {isZh ? "立即结算" : "Complete Your Upgrade"}
          </div>

          <h2 className="relative mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
            {isZh ? "选择适合你的支付方式，完成套餐升级" : "Choose a payment method and complete your upgrade"}
          </h2>

          <p className="relative mx-auto mt-4 max-w-3xl text-base leading-8 text-zinc-200">
            {isZh
              ? "完成升级后，你的账户将获得更适合创作频率和项目规模的生产支持。"
              : "After upgrading, your account gets a workflow better suited to your production scale and creative frequency."}
          </p>

          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => pay("alipay")}
              disabled={selectedPlan === "free" || loadingMethod !== ""}
              className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {isZh ? "支付宝支付" : "Pay with Alipay"}
            </button>

            <button
              onClick={() => pay("wechat")}
              disabled={selectedPlan === "free" || loadingMethod !== ""}
              className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05] disabled:opacity-50"
            >
              {isZh ? "微信扫码支付" : "Pay with WeChat"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}