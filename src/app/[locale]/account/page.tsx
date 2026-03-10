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

export default function AccountPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    bootstrap();
  }, [locale, router]);

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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06070a] text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "账户加载中..." : "Loading account..."}
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
                {isZh ? "账户中心" : "Account Center"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/billing`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200"
            >
              {isZh ? "套餐页" : "Billing"}
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 disabled:opacity-50"
            >
              {signingOut ? (isZh ? "退出中..." : "Signing out...") : isZh ? "退出登录" : "Sign Out"}
            </button>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-12 pt-16">
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "账户信息" : "Account Overview"}
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "邮箱" : "Email"}</div>
                <div className="mt-2 text-base text-white">{profile?.email || "-"}</div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "当前套餐" : "Current Plan"}</div>
                <div className="mt-2 text-2xl font-bold text-white">{currentPlan.name}</div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "当前额度" : "Current Quota"}</div>
                <div className="mt-2 text-base text-white">
                  {profile?.plan === "studio"
                    ? isZh
                      ? "无限"
                      : "Unlimited"
                    : `${profile?.used_count ?? 0} / ${profile?.monthly_quota ?? 0}`}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "账号状态" : "Account Status"}</div>
                <div className="mt-2 text-base text-white">
                  {profile?.status === "banned"
                    ? isZh
                      ? "已封禁"
                      : "Banned"
                    : isZh
                    ? "正常"
                    : "Active"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "套餐升级入口" : "Plan Upgrade Entry"}
            </div>

            <div className="mt-3 text-3xl font-bold text-white">
              {isZh ? "从账户中心直接查看套餐" : "Review plans directly from account center"}
            </div>

            <p className="mt-4 text-base leading-8 text-zinc-300">
              {isZh
                ? "这里和首页、billing 页面使用同一份套餐配置。你看到的价格、额度和功能描述始终一致。"
                : "This page uses the same pricing config as the homepage and billing page, so pricing, quotas, and feature descriptions stay consistent."}
            </p>

            <div className="mt-8 grid gap-5">
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
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-white">{plan.name}</div>
                          {isCurrent ? (
                            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">
                              {isZh ? "当前套餐" : "Current"}
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-2 text-sm text-zinc-300">
                          {isZh ? plan.zhDesc : plan.enDesc}
                        </div>

                        <div className="mt-3 text-sm text-zinc-400">
                          {formatPlanPriceCny(plan.priceCnyMonthly)}
                          <span className="ml-1">
                            /{isZh ? "月" : "mo"}
                          </span>
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

                      <div className="md:w-[220px]">
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
                            {isZh ? "去套餐页升级" : "Upgrade on Billing Page"}
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
                ? "这一版先把套餐展示、统一配置和升级入口全部打通。后续如果接正式支付，只需要把 billing 页按钮接到你的支付流程。"
                : "This version unifies pricing display, config, and upgrade entry. If you add real payments later, just connect the billing page buttons to your payment flow."}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}