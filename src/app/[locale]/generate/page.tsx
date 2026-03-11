"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import PricingPlan from "@/components/PricingPlan"; // 确保路径正确

export default function GeneratePage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchUserPlan();
  }, [locale]);

  async function fetchUserPlan() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/${locale}/auth`);
      return;
    }

    const { data, error } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    if (error || !data) {
      setLoading(false);
      return;
    }

    setPlan(data.plan);
    setLoading(false);
  }

  const planDetails = useMemo(() => getPlanByKey(plan), [plan]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06070a] text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "加载生成任务..." : "Loading generation task..."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}/jobs`} />
            <div>
              <div className="text-xl font-semibold tracking-tight text-white">
                FulushouVideo
              </div>
              <div className="text-xs text-zinc-400">
                {isZh ? "生成任务页" : "Generation Task Page"}
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
              href={`/${locale}/billing`}
              className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300 transition hover:bg-emerald-400/15"
            >
              {isZh ? "套餐页" : "Billing"}
            </Link>

            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-8 pt-14">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
              {isZh ? "开始创建任务" : "Start Creating Tasks"}
            </h1>

            <p className="mt-6 text-base leading-8 text-zinc-300 md:text-lg">
              {isZh
                ? "在此页面，你可以根据当前套餐选择任务类型并开始生成。"
                : "Here you can select the task type and start generation based on your current plan."}
            </p>

            {planDetails ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5">
                  <div className="text-sm text-zinc-400">{isZh ? "当前套餐" : "Current Plan"}</div>
                  <div className="mt-3 text-3xl font-semibold text-white">{planDetails.name}</div>
                  <div className="mt-3 text-sm text-zinc-400">
                    {isZh
                      ? `价格: ${formatPlanPriceCny(planDetails.priceCnyMonthly)} / 月`
                      : `Price: ${formatPlanPriceCny(planDetails.priceCnyMonthly)} / mo`}
                  </div>
                  <div className="mt-3 text-sm text-zinc-400">
                    {isZh ? "功能描述：" : "Features: "}
                    <ul>
                      {planDetails.features?.map((feature, index) => (
                        <li key={index} className="text-zinc-300 text-sm">
                          - {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {planDetails.key === "pro" && (
                  <div className="mt-6 text-sm text-zinc-400">{isZh ? "已达到最大额度。" : "Max quota reached."}</div>
                )}

                {planDetails.key === "free" && (
                  <div className="mt-6 text-sm text-zinc-400">{isZh ? "免费套餐可创建基础任务。" : "The free plan allows basic task creation."}</div>
                )}
              </div>
            ) : null}

            <div className="mt-8">
              <Link
                href={`/${locale}/jobs`}
                className="rounded-2xl bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/15"
              >
                {isZh ? "查看我的任务" : "View My Tasks"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}