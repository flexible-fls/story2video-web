"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

export default function BillingPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrap();
  }, [locale]);

  async function bootstrap() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsAuthed(false);
      setProfile(null);
      setLoading(false);
      return;
    }

    setIsAuthed(true);

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

  const currentPlan = useMemo(() => getPlanByKey(profile?.plan), [profile?.plan]);

  function renderAction(planKey: string) {
    const isCurrent = profile?.plan === planKey;

    if (!isAuthed) {
      return (
        <Link
          href={`/${locale}/auth`}
          className={`mt-8 block rounded-2xl px-6 py-3 text-center text-sm transition ${
            planKey === "pro"
              ? "bg-emerald-400 font-semibold text-black hover:bg-emerald-300"
              : "border border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.07]"
          }`}
        >
          {isZh ? "登录后选择" : "Login to Choose"}
        </Link>
      );
    }

    if (isCurrent) {
      return (
        <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-6 py-3 text-center text-sm font-medium text-emerald-300">
          {isZh ? "当前套餐" : "Current Plan"}
        </div>
      );
    }

    return (
      <Link
        href={`/${locale}/account`}
        className={`mt-8 block rounded-2xl px-6 py-3 text-center text-sm transition ${
          planKey === "pro"
            ? "bg-emerald-400 font-semibold text-black hover:bg-emerald-300"
            : "border border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.07]"
        }`}
      >
        {isZh ? "进入账户中心升级" : "Upgrade in Account Center"}
      </Link>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06070a] text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "套餐信息加载中..." : "Loading pricing..."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[100px] h-[320px] w-[320px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-120px] top-[220px] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}`} />
            <div>
              <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
              <div className="text-xs text-zinc-400">
                {isZh ? "套餐与额度" : "Pricing & Quotas"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/account`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200"
            >
              {isZh ? "账户中心" : "Account"}
            </Link>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-12 pt-16">
        <div className="text-center">
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
            {isZh ? "统一套餐配置" : "Unified Pricing Source"}
          </div>

          <h1 className="mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl">
            {isZh ? "选择适合你的内容生产方案" : "Choose the plan that fits your workflow"}
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-zinc-300 md:text-lg">
            {isZh
              ? "billing 页面与首页现在使用同一份套餐配置。以后你只需要改一处，首页和套餐页会同时更新。"
              : "The billing page and homepage now use the same pricing source. Update once, and both pages stay in sync."}
          </p>
        </div>

        {isAuthed && profile ? (
          <div className="mx-auto mt-10 max-w-4xl rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "当前套餐" : "Current Plan"}</div>
                <div className="mt-3 text-2xl font-bold text-white">{currentPlan.name}</div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "账户邮箱" : "Account Email"}</div>
                <div className="mt-3 truncate text-base text-white">{profile.email || "-"}</div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "当前额度" : "Current Quota"}</div>
                <div className="mt-3 text-base text-white">
                  {profile.plan === "studio"
                    ? isZh
                      ? "无限"
                      : "Unlimited"
                    : `${profile.used_count} / ${profile.monthly_quota}`}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-3xl rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-5 text-center text-sm text-emerald-300">
            {isZh
              ? "你当前还没有登录。登录后可以更方便地查看当前套餐与升级入口。"
              : "You are not logged in yet. Sign in to view your current plan and upgrade options."}
          </div>
        )}

        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-[32px] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.22)] ${
                plan.key === "pro"
                  ? "border border-emerald-400/20 bg-gradient-to-b from-emerald-400/10 to-zinc-950"
                  : "border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950"
              }`}
            >
              {plan.badgeZh || plan.badgeEn ? (
                <div className="absolute right-5 top-5 rounded-full border border-emerald-400/20 bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">
                  {isZh ? plan.badgeZh : plan.badgeEn}
                </div>
              ) : null}

              <div className={`text-sm font-medium ${plan.key === "pro" ? "text-emerald-300" : "text-zinc-400"}`}>
                {plan.name}
              </div>

              <div className="mt-3 text-4xl font-bold text-white">
                {isZh ? plan.zhTitle : plan.enTitle}
              </div>

              <div className="mt-4 text-2xl font-semibold text-white">
                {formatPlanPriceCny(plan.priceCnyMonthly)}
                <span className="ml-1 text-sm font-normal text-zinc-400">
                  /{isZh ? "月" : "mo"}
                </span>
              </div>

              <div className="mt-2 text-sm text-zinc-300">
                {isZh ? plan.zhDesc : plan.enDesc}
              </div>

              <div className="mt-6 space-y-3 text-sm text-zinc-200">
                {(isZh ? plan.zhFeatures : plan.enFeatures).map((item) => (
                  <div key={item}>• {item}</div>
                ))}
              </div>

              {renderAction(plan.key)}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
          <div className="text-2xl font-bold text-white">
            {isZh ? "说明" : "Notes"}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/8 bg-black/25 p-5 text-sm leading-7 text-zinc-300">
              {isZh
                ? "首页套餐区与 billing 页已经统一使用同一份配置文件。"
                : "The homepage pricing section and billing page now use the same pricing config."}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/25 p-5 text-sm leading-7 text-zinc-300">
              {isZh
                ? "以后如果你想改价格、额度、文案，只需要修改 src/lib/pricing.ts。"
                : "If you want to change pricing, quotas, or copy later, edit src/lib/pricing.ts only."}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/25 p-5 text-sm leading-7 text-zinc-300">
              {isZh
                ? "如果你后面要接正式支付按钮，我再帮你把这里接到你的支付流程。"
                : "If you want to connect real payment buttons later, we can wire this page into your payment flow."}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}