"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  email: string | null;
  plan: string;
  monthly_quota: number;
  used_count: number;
  status: string;
};

type PlanCard = {
  name: "free" | "pro" | "studio";
  badgeZh: string;
  badgeEn: string;
  title: string;
  priceZh: string;
  priceEn: string;
  descZh: string;
  descEn: string;
  quotaZh: string;
  quotaEn: string;
  pointsZh: string[];
  pointsEn: string[];
  buttonZh: string;
  buttonEn: string;
  highlight?: boolean;
};

export default function BillingPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    bootstrap();
  }, [locale, router]);

  async function bootstrap() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id,email,plan,monthly_quota,used_count,status")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setProfile(data as ProfileRow);
    }

    setLoading(false);
  }

  const plans: PlanCard[] = useMemo(
    () => [
      {
        name: "free",
        badgeZh: "免费体验",
        badgeEn: "Free Trial",
        title: "Free",
        priceZh: "¥0",
        priceEn: "$0",
        descZh: "适合第一次体验平台流程，快速了解 AI 剧本解析和结构化生成。",
        descEn:
          "Best for first-time users who want to explore AI script parsing and structured generation.",
        quotaZh: "每月基础额度",
        quotaEn: "Basic monthly quota",
        pointsZh: ["基础生成体验", "剧本解析与分镜结构", "适合首次试用"],
        pointsEn: ["Basic generation access", "Script parsing and storyboard structure", "Best for first trial"],
        buttonZh: "当前免费版",
        buttonEn: "Current Free Plan",
      },
      {
        name: "pro",
        badgeZh: "推荐方案",
        badgeEn: "Most Popular",
        title: "Pro",
        priceZh: "¥99 / 月",
        priceEn: "$19 / month",
        descZh: "适合个人创作者与高频使用者，更适合日常短剧与漫剧内容生产。",
        descEn:
          "Great for individual creators and frequent users building story content on a daily basis.",
        quotaZh: "更多月度生成额度",
        quotaEn: "More monthly generation quota",
        pointsZh: ["更高频生成", "更适合日常创作", "更稳定的个人创作支持"],
        pointsEn: ["Higher generation frequency", "Better for daily creation", "More stable solo creator workflow"],
        buttonZh: "升级到 Pro",
        buttonEn: "Upgrade to Pro",
        highlight: true,
      },
      {
        name: "studio",
        badgeZh: "团队方案",
        badgeEn: "For Teams",
        title: "Studio",
        priceZh: "¥399 / 月",
        priceEn: "$49 / month",
        descZh: "适合工作室和团队项目生产，支持更高强度、更连续的内容工作流。",
        descEn:
          "Built for studios and teams running heavier, more continuous production workflows.",
        quotaZh: "更高上限 / 团队级使用",
        quotaEn: "Higher ceiling / studio-grade workflow",
        pointsZh: ["更高使用上限", "适合团队生产", "更适合长期项目"],
        pointsEn: ["Higher usage ceiling", "Built for teams", "Better for long-term projects"],
        buttonZh: "升级到 Studio",
        buttonEn: "Upgrade to Studio",
      },
    ],
    []
  );

  function getPlanLabel(plan: string) {
    if (plan === "studio") return "Studio";
    if (plan === "pro") return "Pro";
    return "Free";
  }

  function getQuotaText() {
    if (!profile) {
      return isZh ? "未登录时可先浏览套餐方案" : "You can browse plans before signing in";
    }

    if (profile.plan === "studio") {
      return isZh ? "当前为 Studio，无限额度体验" : "Current plan: Studio with unlimited usage";
    }

    return isZh
      ? `当前额度：${profile.used_count} / ${profile.monthly_quota}`
      : `Current quota: ${profile.used_count} / ${profile.monthly_quota}`;
  }

  function getCheckoutHref(plan: "free" | "pro" | "studio") {
    if (plan === "free") return `/${locale}/generate`;
    return `/${locale}/checkout?plan=${plan}`;
  }

  function getButtonText(plan: "free" | "pro" | "studio") {
    const currentPlan = profile?.plan || "free";

    if (plan === currentPlan) {
      return isZh ? "当前套餐" : "Current Plan";
    }

    const target = plans.find((item) => item.name === plan);
    return isZh ? target?.buttonZh || "查看套餐" : target?.buttonEn || "View Plan";
  }

  function isCurrentPlan(plan: "free" | "pro" | "studio") {
    return (profile?.plan || "free") === plan;
  }

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[120px] h-[320px] w-[320px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-120px] top-[220px] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute left-[25%] top-[900px] h-[260px] w-[260px] rounded-full bg-emerald-400/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}`} />
            <div>
              <div className="text-xl font-semibold tracking-tight text-white">FulushouVideo</div>
              <div className="text-xs text-zinc-400">
                {isZh ? "套餐与付费方案" : "Pricing & Plans"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/jobs`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
            >
              {isZh ? "我的任务" : "My Jobs"}
            </Link>

            <Link
              href={`/${locale}/account`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
            >
              {isZh ? "账户中心" : "Account"}
            </Link>

            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-10 pt-16">
        <div className="grid items-center gap-10 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-medium text-emerald-300">
              {isZh ? "面向剧情生产的套餐体系" : "Plans built for story production"}
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">
              {isZh ? "按你的创作频率选择合适方案" : "Choose the right plan for your workflow"}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              {isZh
                ? "你购买的不只是额度，而是更稳定、更高效的短剧与漫剧生产能力。根据你的创作频率、项目规模和团队需求，选择最适合你的方案。"
                : "You are not only paying for quota, but for a more stable and efficient AI story production workflow based on your usage frequency and production scale."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "短剧创作者" : "Drama Creators"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "漫剧工作室" : "Comic Studios"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "团队生产" : "Team Workflow"}
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "更灵活" : "Flexible"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{isZh ? "按需选择" : "Choose as Needed"}</div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "更稳定" : "More Stable"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{isZh ? "持续创作" : "Continuous Use"}</div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "更适合生产" : "Production Ready"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{isZh ? "团队可用" : "Team Friendly"}</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-emerald-400/10 via-transparent to-cyan-400/10 blur-xl" />
            <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="text-2xl font-bold text-white">
                {isZh ? "当前账户信息" : "Current Account"}
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "当前套餐" : "Current Plan"}</div>
                <div className="mt-3 text-4xl font-bold text-white">
                  {loading ? (isZh ? "加载中..." : "Loading...") : getPlanLabel(profile?.plan || "free")}
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "当前额度状态" : "Quota Status"}</div>
                <div className="mt-3 text-base leading-8 text-zinc-200">{getQuotaText()}</div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "适合升级的场景" : "When to Upgrade"}</div>
                <div className="mt-3 space-y-3 text-sm leading-7 text-zinc-300">
                  <div>{isZh ? "• 你开始高频生成，Free 已不够用" : "• You generate frequently and Free is no longer enough"}</div>
                  <div>{isZh ? "• 你需要更稳定的日常创作支持" : "• You want a more stable workflow for daily creation"}</div>
                  <div>{isZh ? "• 你在做团队项目或连续生产" : "• You are running team projects or continuous production"}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/generate`}
                  className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  {isZh ? "继续生成" : "Continue Creating"}
                </Link>

                <Link
                  href={`/${locale}/account`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
                >
                  {isZh ? "查看账户" : "View Account"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <div className="text-sm font-medium text-emerald-300">{isZh ? "套餐方案" : "Pricing Plans"}</div>
          <h2 className="mt-3 text-4xl font-bold text-white">
            {isZh ? "为不同创作阶段准备的 3 个方案" : "Three plans for different creator stages"}
          </h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-[32px] border p-7 ${
                plan.highlight
                  ? "border-emerald-400/30 bg-gradient-to-b from-emerald-400/12 to-zinc-900"
                  : "border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950"
              }`}
            >
              {plan.highlight && (
                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />
              )}

              {isCurrentPlan(plan.name) && (
                <div className="absolute right-5 top-5 rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-black">
                  {isZh ? "当前使用中" : "Current"}
                </div>
              )}

              <div className="relative">
                <div className="text-sm font-medium text-zinc-400">
                  {isZh ? plan.badgeZh : plan.badgeEn}
                </div>
                <div className="mt-3 text-3xl font-bold text-white">{plan.title}</div>
                <div className="mt-4 text-4xl font-bold text-white">
                  {isZh ? plan.priceZh : plan.priceEn}
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-300">
                  {isZh ? plan.descZh : plan.descEn}
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-zinc-200">
                {isZh ? plan.quotaZh : plan.quotaEn}
              </div>

              <div className="mt-6 space-y-3">
                {(isZh ? plan.pointsZh : plan.pointsEn).map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-zinc-200"
                  >
                    {point}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Link
                  href={getCheckoutHref(plan.name)}
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold ${
                    isCurrentPlan(plan.name)
                      ? "border border-white/10 bg-white/[0.03] text-zinc-300"
                      : plan.highlight
                      ? "bg-emerald-400 text-black"
                      : "border border-white/10 bg-white/[0.03] text-zinc-200"
                  }`}
                >
                  {getButtonText(plan.name)}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-zinc-900/90 via-zinc-900/80 to-zinc-900/90 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          <div className="max-w-4xl">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "为什么付费" : "Why Upgrade"}
            </div>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-white">
              {isZh ? "你购买的不只是额度，而是更稳定的生产能力" : "You are paying for workflow stability, not only quota"}
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              {isZh
                ? "当你的创作从偶尔尝试，走向高频使用和持续项目生产时，付费方案能给你更高的生成上限、更适合日常创作的工作流，以及更适合团队协作的使用体验。"
                : "As your workflow grows from occasional testing to frequent creation and project production, paid plans give you higher usage ceilings and a more reliable production experience."}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <div className="text-sm font-medium text-emerald-300">{isZh ? "对比说明" : "Comparison"}</div>
          <h2 className="mt-3 text-4xl font-bold text-white">
            {isZh ? "不同套餐适合不同阶段的创作需求" : "Each plan fits a different stage of creation"}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6">
            <div className="text-2xl font-bold text-white">Free</div>
            <div className="mt-3 text-sm leading-7 text-zinc-400">
              {isZh
                ? "适合第一次体验平台流程，快速了解 AI 剧本解析与基础生成逻辑。"
                : "Best for first-time users exploring the workflow and basic generation logic."}
            </div>
          </div>

          <div className="rounded-[28px] border border-emerald-400/20 bg-gradient-to-b from-emerald-400/10 to-zinc-950 p-6">
            <div className="text-2xl font-bold text-white">Pro</div>
            <div className="mt-3 text-sm leading-7 text-zinc-300">
              {isZh
                ? "适合个人创作者和高频使用者，更适合日常内容生产和持续创作。"
                : "Great for solo creators and frequent users producing content regularly."}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6">
            <div className="text-2xl font-bold text-white">Studio</div>
            <div className="mt-3 text-sm leading-7 text-zinc-400">
              {isZh
                ? "适合团队和工作室项目，更适合更高强度、更连续的生产流程。"
                : "Built for studios and teams handling heavier and more continuous workflows."}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          <div className="max-w-5xl">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "常见问题" : "FAQ"}
            </div>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-white">
              {isZh ? "常见套餐问题" : "Common pricing questions"}
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                <div className="text-lg font-semibold text-white">
                  {isZh ? "免费版适合谁？" : "Who is Free for?"}
                </div>
                <div className="mt-3 text-sm leading-7 text-zinc-400">
                  {isZh
                    ? "适合第一次体验流程、测试平台能力、熟悉剧本解析与分镜生成逻辑。"
                    : "Ideal for first-time users who want to test the workflow and understand the platform."}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                <div className="text-lg font-semibold text-white">
                  {isZh ? "什么时候该升级到 Pro？" : "When should I upgrade to Pro?"}
                </div>
                <div className="mt-3 text-sm leading-7 text-zinc-400">
                  {isZh
                    ? "当你开始高频生成、需要更稳定的日常创作能力时，Pro 会更合适。"
                    : "Upgrade to Pro when you start generating more frequently and need a stronger daily workflow."}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                <div className="text-lg font-semibold text-white">
                  {isZh ? "Studio 适合什么场景？" : "What is Studio for?"}
                </div>
                <div className="mt-3 text-sm leading-7 text-zinc-400">
                  {isZh
                    ? "适合团队、工作室、连续生产项目和更高强度的内容工作流。"
                    : "Studio is for teams, studios, and heavier production workflows."}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                <div className="text-lg font-semibold text-white">
                  {isZh ? "升级后会发生什么？" : "What happens after upgrading?"}
                </div>
                <div className="mt-3 text-sm leading-7 text-zinc-400">
                  {isZh
                    ? "你的账户套餐会更新，后台订单系统也会记录对应的付费状态。"
                    : "Your account plan updates, and the admin order system records the corresponding payment state."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-[36px] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 via-emerald-400/10 to-cyan-400/10 p-10 text-center shadow-[0_20px_80px_rgba(16,185,129,0.08)]">
          <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative text-sm font-medium text-emerald-200">
            {isZh ? "立即开始" : "Start Now"}
          </div>

          <h2 className="relative mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
            {isZh ? "选择适合你的方案，开始更稳定的内容生产流程" : "Choose your plan and build a more stable production workflow"}
          </h2>

          <p className="relative mx-auto mt-4 max-w-3xl text-base leading-8 text-zinc-200">
            {isZh
              ? "无论你是第一次体验，还是已经进入持续项目生产阶段，都可以找到适合自己的创作方案。"
              : "Whether you are testing for the first time or already running continuous projects, there is a plan for your workflow."}
          </p>

          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/${locale}/checkout?plan=pro`}
              className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              {isZh ? "升级到 Pro" : "Upgrade to Pro"}
            </Link>

            <Link
              href={`/${locale}/checkout?plan=studio`}
              className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
            >
              {isZh ? "查看 Studio" : "Explore Studio"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}