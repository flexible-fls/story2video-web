"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";
import { PRICING_PLANS, formatPlanPriceCny, getPlanByKey } from "@/lib/pricing";

type ProfileRow = {
  id: string;
  email: string | null;
  plan: string;
  monthly_quota: number;
  used_count: number;
  status: string;
};

function getStatusText(status?: string, isZh?: boolean) {
  if (status === "banned") return isZh ? "已封禁" : "Banned";
  return isZh ? "正常" : "Active";
}

function getStatusStyle(status?: string) {
  if (status === "banned") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
}

export default function BillingPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, [locale]);

  async function bootstrap() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/${locale}/auth`);
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

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    router.push(`/${locale}/auth`);
  }

  const currentPlan = useMemo(() => getPlanByKey(profile?.plan), [profile?.plan]);

  const quotaUsed = profile?.used_count ?? 0;
  const quotaTotal = profile?.monthly_quota ?? 0;
  const isStudio = profile?.plan === "studio";
  const quotaPercent =
    !isStudio && quotaTotal > 0
      ? Math.max(0, Math.min(100, Math.round((quotaUsed / quotaTotal) * 100)))
      : 100;

  const summaryCards = [
    {
      label: isZh ? "当前套餐" : "Current Plan",
      value: currentPlan.name,
      sub: isZh ? "与账户页面保持一致" : "Synced with account page",
    },
    {
      label: isZh ? "账户状态" : "Account Status",
      value: getStatusText(profile?.status, isZh),
      sub: isZh ? "决定是否允许继续生成" : "Controls generation availability",
    },
    {
      label: isZh ? "已用额度" : "Used Quota",
      value: isStudio ? (isZh ? "无限" : "Unlimited") : `${quotaUsed}`,
      sub: isZh ? "按当前套餐统计" : "Measured under current plan",
    },
    {
      label: isZh ? "总额度" : "Total Quota",
      value: isStudio ? (isZh ? "无限" : "Unlimited") : `${quotaTotal}`,
      sub: isZh ? "月度额度上限" : "Monthly quota cap",
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06070a] text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "账单加载中..." : "Loading billing..."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-140px] top-[100px] h-[340px] w-[340px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-120px] top-[220px] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}`} />
            <div>
              <div className="text-xl font-semibold tracking-tight text-white">
                FulushouVideo
              </div>
              <div className="text-xs text-zinc-400">
                {isZh ? "套餐与账单" : "Plans & Billing"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/jobs`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
            >
              {isZh ? "任务中心" : "Jobs"}
            </Link>

            <Link
              href={`/${locale}/account`}
              className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300 transition hover:bg-emerald-400/15"
            >
              {isZh ? "账户中心" : "Account Center"}
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
            >
              {signingOut
                ? isZh
                  ? "退出中..."
                  : "Signing out..."
                : isZh
                ? "退出登录"
                : "Sign Out"}
            </button>

            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-8 pt-14">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-medium text-emerald-300">
              {isZh ? "账单页面 / SaaS 化升级" : "Billing Page / SaaS Upgrade"}
            </div>

            <h1 className="max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
              {isZh ? "查看套餐与升级选项" : "Review Plans and Upgrade Options"}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 md:text-lg">
              {isZh
                ? "Billing 页面展示了你当前的套餐与额度使用情况，提供了清晰的升级路径与套餐对比。"
                : "The Billing page displays your current plan and quota usage, with clear upgrade paths and plan comparisons."}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5"
                >
                  <div className="text-sm text-zinc-400">{card.label}</div>
                  <div className="mt-3 text-2xl font-bold text-white">{card.value}</div>
                  <div className="mt-2 text-xs leading-6 text-zinc-500">{card.sub}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-zinc-400">{isZh ? "账户邮箱" : "Account Email"}</div>
                  <div className="mt-2 break-all text-lg font-medium text-white">
                    {profile?.email || "-"}
                  </div>

                  <div
                    className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs ${getStatusStyle(
                      profile?.status
                    )}`}
                  >
                    {getStatusText(profile?.status, isZh)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/${locale}/generate`}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
                  >
                    {isZh ? "开始生成" : "Start Generating"}
                  </Link>

                  <Link
                    href={`/${locale}/account`}
                    className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
                  >
                    {isZh ? "查看账户" : "View Account"}
                  </Link>
                </div>
              </div>

              {profile?.status === "banned" ? (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {isZh
                    ? "你的账号当前处于封禁状态，暂时无法继续生成内容。"
                    : "Your account is currently banned and cannot generate content."}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[36px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold text-white">
                  {isZh ? "套餐概览" : "Plan Overview"}
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  {isZh
                    ? "你可以在这里查看不同套餐的功能对比以及升级选项"
                    : "Here you can review the feature comparison and upgrade options between different plans."}
                </div>
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
                {currentPlan.name}
              </div>
            </div>

            <div className="grid gap-5">
              {PRICING_PLANS.map((plan) => {
                const isCurrent = profile?.plan === plan.key;

                return (
                  <div
                    key={plan.key}
                    className={`rounded-[28px] border p-5 ${
                      isCurrent
                        ? "border-emerald-400/20 bg-emerald-400/10"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-2xl font-bold text-white">{plan.name}</div>

                          {isCurrent ? (
                            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">
                              {isZh ? "当前套餐" : "Current"}
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-3 text-sm text-zinc-300">
                          {isZh ? plan.zhDesc : plan.enDesc}
                        </div>

                        <div className="mt-4 text-sm text-zinc-400">
                          {formatPlanPriceCny(plan.priceCnyMonthly)}
                          <span className="ml-1">/{isZh ? "月" : "mo"}</span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {(isZh ? plan.zhFeatures : plan.enFeatures).map((item) => (
                            <div
                              key={item}
                              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="xl:w-[240px]">
                        {isCurrent ? (
                          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/15 px-5 py-3 text-center text-sm font-medium text-emerald-300">
                            {isZh ? "当前使用中" : "Currently Active"}
                          </div>
                        ) : (
                          <Link
                            href={`/${locale}/billing`}
                            className={`block rounded-2xl px-5 py-3 text-center text-sm transition ${
                              plan.key === "pro"
                                ? "bg-emerald-400 font-semibold text-black hover:bg-emerald-300"
                                : "border border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.07]"
                            }`}
                          >
                            {isZh ? "升级到此套餐" : "Upgrade to this plan"}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-[24px] border border-white/8 bg-black/25 p-5 text-sm leading-7 text-zinc-300">
              {isZh
                ? "选择合适的套餐后，点击上方按钮完成升级。"
                : "Click the button above to upgrade to the selected plan."}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}