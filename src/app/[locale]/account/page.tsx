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
  updated_at?: string | null;
  admin_note?: string | null;
};

type OrderRow = {
  id: string;
  plan: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
};

type GenerationRow = {
  id: string;
  job_id: string | null;
  file_name: string | null;
  plan: string;
  quota_cost: number;
  status: string;
  created_at: string;
};

export default function AccountPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [recentGenerations, setRecentGenerations] = useState<GenerationRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
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

    const [profileRes, orderRes, generationRes, adminRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,plan,monthly_quota,used_count,status,updated_at,admin_note")
        .eq("id", user.id)
        .maybeSingle(),

      supabase
        .from("orders")
        .select("id,plan,amount,status,payment_method,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3),

      supabase
        .from("generations")
        .select("id,job_id,file_name,plan,quota_cost,status,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3),

      supabase.from("admins").select("id").eq("id", user.id).maybeSingle(),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data as ProfileRow);
    }

    setRecentOrders((orderRes.data as OrderRow[]) || []);
    setRecentGenerations((generationRes.data as GenerationRow[]) || []);
    setIsAdmin(!!adminRes.data);
    setLoading(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push(`/${locale}/auth`);
    setSigningOut(false);
  }

  const currentPlanLabel = useMemo(() => {
    if (!profile) return "-";
    if (profile.plan === "studio") return "Studio";
    if (profile.plan === "pro") return "Pro";
    return "Free";
  }, [profile]);

  const quotaText = useMemo(() => {
    if (!profile) return isZh ? "加载中..." : "Loading...";

    if (profile.plan === "studio") {
      return isZh ? "Studio 无限额度体验" : "Studio unlimited usage";
    }

    return isZh
      ? `${profile.used_count} / ${profile.monthly_quota}`
      : `${profile.used_count} / ${profile.monthly_quota}`;
  }, [profile, isZh]);

  const quotaPercent = useMemo(() => {
    if (!profile) return 0;
    if (profile.plan === "studio") return 100;
    if (!profile.monthly_quota || profile.monthly_quota <= 0) return 0;
    return Math.min((profile.used_count / profile.monthly_quota) * 100, 100);
  }, [profile]);

  function formatTime(value?: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  }

  function formatPlan(plan: string) {
    if (plan === "studio") return "Studio";
    if (plan === "pro") return "Pro";
    return "Free";
  }

  function formatMoney(amount: number) {
    return isZh ? `¥${(amount / 100).toFixed(2)}` : `$${(amount / 100).toFixed(2)}`;
  }

  function formatStatus(status: string) {
    if (status === "active") return isZh ? "正常" : "Active";
    if (status === "banned") return isZh ? "已封禁" : "Banned";
    if (status === "paid") return isZh ? "已支付" : "Paid";
    if (status === "success") return isZh ? "成功" : "Success";
    if (status === "failed") return isZh ? "失败" : "Failed";
    return status;
  }

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
              <div className="text-xl font-semibold tracking-tight text-white">FulushouVideo</div>
              <div className="text-xs text-zinc-400">
                {isZh ? "账户中心" : "Account Center"}
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
              href={`/${locale}/billing`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
            >
              {isZh ? "套餐方案" : "Pricing"}
            </Link>

            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-10 pt-16">
        <div className="grid items-start gap-10 xl:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-medium text-emerald-300">
              {isZh ? "你的创作账户" : "Your Creator Account"}
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">
              {isZh ? "查看你的套餐、额度与生成记录" : "View your plan, quota, and creation activity"}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              {isZh
                ? "这里是你的账户中心。你可以查看当前套餐、额度状态、最近订单、最近生成记录，并快速进入任务中心、历史记录和套餐升级页。"
                : "This is your account center. Check your current plan, quota status, recent orders, recent generations, and quickly access jobs, history, and pricing."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "套餐状态" : "Plan Status"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "额度管理" : "Quota Tracking"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "任务与历史" : "Jobs & History"}
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "当前套餐" : "Current Plan"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{currentPlanLabel}</div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "额度状态" : "Quota"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{quotaText}</div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "账户状态" : "Account Status"}</div>
                <div className="mt-3 text-3xl font-bold text-white">
                  {formatStatus(profile?.status || "active")}
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-emerald-400/10 via-transparent to-cyan-400/10 blur-xl" />
            <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="text-3xl font-bold text-white">
                {isZh ? "账户摘要" : "Account Summary"}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                {isZh ? "当前登录账户的套餐与使用情况。" : "Plan and usage details for your current account."}
              </div>

              <div className="mt-6 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "邮箱" : "Email"}</div>
                <div className="mt-3 break-all text-lg font-semibold text-white">
                  {profile?.email || "-"}
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "当前套餐" : "Current Plan"}</div>
                <div className="mt-3 text-4xl font-bold text-white">{currentPlanLabel}</div>
                <div className="mt-3 text-sm text-zinc-300">
                  {profile?.plan === "studio"
                    ? isZh
                      ? "Studio 适合团队与持续项目生产。"
                      : "Studio is designed for teams and continuous projects."
                    : profile?.plan === "pro"
                    ? isZh
                      ? "Pro 更适合高频个人创作者。"
                      : "Pro is better for frequent individual creators."
                    : isZh
                    ? "Free 适合先体验平台流程。"
                    : "Free is best for exploring the workflow first."}
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-sm text-zinc-400">{isZh ? "额度使用情况" : "Quota Usage"}</div>
                  <div className="text-sm text-zinc-300">{quotaText}</div>
                </div>

                <div className="h-3 rounded-full bg-zinc-900">
                  <div
                    className="h-3 rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>

                <div className="mt-3 text-xs text-zinc-500">
                  {profile?.plan === "studio"
                    ? isZh
                      ? "Studio 当前展示为满额进度，仅表示无限使用。"
                      : "Studio is shown as full progress only to indicate unlimited usage."
                    : isZh
                    ? "该进度用于显示当前月度额度消耗情况。"
                    : "This progress bar shows your current monthly quota usage."}
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "最近更新时间" : "Last Updated"}</div>
                <div className="mt-3 text-base text-zinc-200">{formatTime(profile?.updated_at)}</div>
              </div>

              {profile?.admin_note ? (
                <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-5">
                  <div className="text-sm text-zinc-400">{isZh ? "管理员备注" : "Admin Note"}</div>
                  <div className="mt-3 text-sm leading-7 text-zinc-300">{profile.admin_note}</div>
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/${locale}/billing`}
                  className="rounded-2xl bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  {isZh ? "查看套餐 / 升级" : "View Plans / Upgrade"}
                </Link>

                <Link
                  href={`/${locale}/generate`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-center text-sm text-zinc-200 transition hover:bg-white/[0.07]"
                >
                  {isZh ? "继续生成" : "Continue Creating"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 xl:grid-cols-4">
          <Link
            href={`/${locale}/jobs`}
            className="rounded-[28px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 transition hover:-translate-y-1 hover:border-emerald-400/20"
          >
            <div className="text-sm text-zinc-400">{isZh ? "任务中心" : "Jobs Center"}</div>
            <div className="mt-3 text-2xl font-bold text-white">{isZh ? "查看任务进度" : "Track Jobs"}</div>
            <div className="mt-3 text-sm leading-7 text-zinc-400">
              {isZh ? "查看任务状态、进度、结果和失败原因。" : "Check job status, progress, results, and errors."}
            </div>
          </Link>

          <Link
            href={`/${locale}/history`}
            className="rounded-[28px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 transition hover:-translate-y-1 hover:border-emerald-400/20"
          >
            <div className="text-sm text-zinc-400">{isZh ? "历史记录" : "History"}</div>
            <div className="mt-3 text-2xl font-bold text-white">{isZh ? "查看生成历史" : "View History"}</div>
            <div className="mt-3 text-sm leading-7 text-zinc-400">
              {isZh ? "查看已成功写入的生成记录与结果入口。" : "Open your successful generation history and result links."}
            </div>
          </Link>

          <Link
            href={`/${locale}/billing`}
            className="rounded-[28px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 transition hover:-translate-y-1 hover:border-emerald-400/20"
          >
            <div className="text-sm text-zinc-400">{isZh ? "套餐管理" : "Plans"}</div>
            <div className="mt-3 text-2xl font-bold text-white">{isZh ? "升级或查看方案" : "Upgrade Plans"}</div>
            <div className="mt-3 text-sm leading-7 text-zinc-400">
              {isZh ? "根据创作频率和项目规模选择合适套餐。" : "Choose the right plan based on your production needs."}
            </div>
          </Link>

          {isAdmin ? (
            <Link
              href={`/${locale}/admin`}
              className="rounded-[28px] border border-emerald-400/20 bg-gradient-to-b from-emerald-400/10 to-zinc-950 p-6 transition hover:-translate-y-1"
            >
              <div className="text-sm text-emerald-300">{isZh ? "管理员入口" : "Admin Access"}</div>
              <div className="mt-3 text-2xl font-bold text-white">{isZh ? "进入后台" : "Open Admin"}</div>
              <div className="mt-3 text-sm leading-7 text-zinc-300">
                {isZh ? "你当前拥有管理员权限，可进入后台管理。"
 : "You currently have admin access and can open the dashboard."}
              </div>
            </Link>
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6">
              <div className="text-sm text-zinc-400">{isZh ? "账户操作" : "Account Action"}</div>
              <div className="mt-3 text-2xl font-bold text-white">{isZh ? "退出登录" : "Sign Out"}</div>
              <div className="mt-3 text-sm leading-7 text-zinc-400">
                {isZh ? "如果你需要切换账户，可以安全退出当前登录状态。"
 : "Sign out safely if you want to switch to another account."}
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.07] disabled:opacity-50"
              >
                {signingOut
                  ? isZh
                    ? "退出中..."
                    : "Signing out..."
                  : isZh
                  ? "退出登录"
                  : "Sign Out"}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-emerald-300">
                  {isZh ? "最近订单" : "Recent Orders"}
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {isZh ? "你的支付记录" : "Your Payment Activity"}
                </div>
              </div>

              <Link
                href={`/${locale}/billing`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200"
              >
                {isZh ? "查看套餐" : "View Plans"}
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="rounded-[24px] border border-white/8 bg-black/25 p-5 text-zinc-400">
                {isZh ? "暂时没有订单记录" : "No order records yet"}
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-white/8 bg-black/25 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-lg font-semibold text-white">
                          {formatPlan(item.plan)}
                        </div>
                        <div className="mt-2 text-sm text-zinc-400">
                          {formatTime(item.created_at)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatMoney(item.amount)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {item.payment_method}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatStatus(item.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-emerald-300">
                  {isZh ? "最近生成" : "Recent Generations"}
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {isZh ? "你的创作活动" : "Your Creation Activity"}
                </div>
              </div>

              <Link
                href={`/${locale}/history`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200"
              >
                {isZh ? "查看全部" : "View All"}
              </Link>
            </div>

            {recentGenerations.length === 0 ? (
              <div className="rounded-[24px] border border-white/8 bg-black/25 p-5 text-zinc-400">
                {isZh ? "暂时没有生成记录" : "No generation records yet"}
              </div>
            ) : (
              <div className="space-y-4">
                {recentGenerations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-white/8 bg-black/25 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-lg font-semibold text-white">
                          {item.file_name || (isZh ? "未命名项目" : "Untitled Project")}
                        </div>
                        <div className="mt-2 text-sm text-zinc-400">
                          {formatTime(item.created_at)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatPlan(item.plan)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {isZh ? "消耗" : "Cost"}: {item.quota_cost}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatStatus(item.status)}
                        </div>
                      </div>
                    </div>

                    {item.job_id ? (
                      <div className="mt-4">
                        <Link
                          href={`/${locale}/result?job=${item.job_id}`}
                          className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300"
                        >
                          {isZh ? "查看结果" : "View Result"}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          <div className="max-w-5xl">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "账户建议" : "Recommendations"}
            </div>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-white">
              {isZh ? "当创作频率提升，升级套餐会让流程更顺" : "As your workflow grows, upgrading makes the process smoother"}
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              {isZh
                ? "如果你已经开始高频生成、持续测试剧本、或者正在做团队项目，那么更高等级的套餐会让你的生成流程更稳定，也更适合作为日常生产工具。"
                : "If you are generating more often, testing scripts regularly, or working on team projects, a higher plan will make your workflow more stable and better suited for daily production."}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/${locale}/billing`}
                className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                {isZh ? "查看套餐方案" : "View Pricing"}
              </Link>

              <Link
                href={`/${locale}/checkout?plan=pro`}
                className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
              >
                {isZh ? "升级到 Pro" : "Upgrade to Pro"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}