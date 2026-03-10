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
  updated_at: string;
};

type OrderRow = {
  id: string;
  user_id: string;
  email: string | null;
  plan: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
};

type GenerationRow = {
  id: string;
  user_id: string;
  email: string | null;
  file_name: string | null;
  plan: string;
  quota_cost: number;
  status: string;
  created_at: string;
};

type GenerationJobRow = {
  id: string;
  user_id: string;
  email: string | null;
  script_title: string | null;
  source_type: string | null;
  plan: string;
  quota_cost: number;
  status: string;
  progress: number;
  result_url: string | null;
  error_message: string | null;
  step_logs: any;
  created_at: string;
  updated_at: string;
};

type ActivityLogRow = {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export default function AdminPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [generations, setGenerations] = useState<GenerationRow[]>([]);
  const [jobs, setJobs] = useState<GenerationJobRow[]>([]);
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);

  useEffect(() => {
    loadAdminData();
  }, [locale, router]);

  async function loadAdminData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/${locale}/auth`);
      return;
    }

    const { data: adminRow } = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminRow) {
      router.push(`/${locale}/account`);
      return;
    }

    setAllowed(true);

    const [
      { data: profileData },
      { data: orderData },
      { data: generationData },
      jobsRes,
      logsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").order("updated_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("generations").select("*").order("created_at", { ascending: false }),
      supabase.rpc("admin_list_generation_jobs"),
      supabase.rpc("admin_list_activity_logs"),
    ]);

    setProfiles((profileData as ProfileRow[]) || []);
    setOrders((orderData as OrderRow[]) || []);
    setGenerations((generationData as GenerationRow[]) || []);
    setJobs((jobsRes.data as GenerationJobRow[]) || []);
    setLogs((logsRes.data as ActivityLogRow[]) || []);
    setLoading(false);
  }

  const totalUsers = profiles.length;
  const totalOrders = orders.length;
  const totalGenerations = generations.length;
  const totalJobs = jobs.length;
  const totalLogs = logs.length;

  const paidUsers = profiles.filter((item) => item.plan !== "free").length;
  const paidOrders = orders.filter((item) => item.status === "paid").length;
  const successJobs = jobs.filter((item) => item.status === "success").length;
  const failedJobs = jobs.filter((item) => item.status === "failed").length;

  const totalRevenue = orders
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const recentJobs = jobs.slice(0, 6);
  const recentLogs = logs.slice(0, 6);
  const recentOrders = orders.slice(0, 6);

  const planDistribution = useMemo(() => {
    const free = profiles.filter((item) => item.plan === "free").length;
    const pro = profiles.filter((item) => item.plan === "pro").length;
    const studio = profiles.filter((item) => item.plan === "studio").length;
    return { free, pro, studio };
  }, [profiles]);

  function formatPlan(plan: string) {
    if (plan === "studio") return "Studio";
    if (plan === "pro") return "Pro";
    return "Free";
  }

  function formatMoney(amount: number) {
    return isZh ? `¥${(amount / 100).toFixed(2)}` : `$${(amount / 100).toFixed(2)}`;
  }

  function formatTime(value: string) {
    return new Date(value).toLocaleString();
  }

  function formatJobStatus(status: string) {
    if (status === "pending") return isZh ? "等待中" : "Pending";
    if (status === "processing") return isZh ? "生成中" : "Processing";
    if (status === "success") return isZh ? "成功" : "Success";
    if (status === "failed") return isZh ? "失败" : "Failed";
    return status;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06070a] text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "管理员数据加载中..." : "Loading admin dashboard..."}
        </div>
      </main>
    );
  }

  if (!allowed) return null;

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[100px] h-[320px] w-[320px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-120px] top-[220px] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}/account`} />
            <div>
              <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
              <div className="text-xs text-zinc-400">
                {isZh ? "管理员后台" : "Admin Dashboard"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/admin/jobs`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200"
            >
              {isZh ? "任务管理" : "Jobs"}
            </Link>
            <Link
              href={`/${locale}/admin/logs`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200"
            >
              {isZh ? "活动日志" : "Logs"}
            </Link>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-10 pt-16">
        <div className="grid items-start gap-10 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-medium text-emerald-300">
              {isZh ? "平台总控台" : "Platform Control Center"}
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">
              {isZh ? "查看平台用户、订单、任务与行为日志" : "Track users, orders, jobs, and activity logs"}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              {isZh
                ? "这里是平台运营与管理总入口。你可以快速查看核心业务指标、最近任务、最近订单和用户行为日志。"
                : "This is the main admin control center for operations. Review business metrics, recent jobs, recent orders, and user activity logs."}
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5">
                <div className="text-sm text-zinc-400">{isZh ? "总收入" : "Revenue"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{formatMoney(totalRevenue)}</div>
              </div>

              <div className="rounded-[28px] border border-emerald-400/15 bg-gradient-to-b from-emerald-400/10 to-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "成功任务" : "Success Jobs"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{successJobs}</div>
              </div>

              <div className="rounded-[28px] border border-red-400/15 bg-gradient-to-b from-red-400/10 to-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "失败任务" : "Failed Jobs"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{failedJobs}</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-emerald-400/10 via-transparent to-cyan-400/10 blur-xl" />
            <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 p-6">
              <div className="text-3xl font-bold text-white">
                {isZh ? "快捷入口" : "Quick Access"}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                {isZh ? "快速进入高频后台页面。" : "Jump into high-frequency admin pages."}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link
                  href={`/${locale}/admin/jobs`}
                  className="rounded-[24px] border border-white/10 bg-black/25 p-5 transition hover:border-emerald-400/20"
                >
                  <div className="text-sm text-zinc-400">{isZh ? "任务系统" : "Jobs System"}</div>
                  <div className="mt-2 text-2xl font-bold text-white">{isZh ? "任务管理" : "Job Management"}</div>
                </Link>

                <Link
                  href={`/${locale}/admin/logs`}
                  className="rounded-[24px] border border-white/10 bg-black/25 p-5 transition hover:border-emerald-400/20"
                >
                  <div className="text-sm text-zinc-400">{isZh ? "行为追踪" : "Behavior Tracking"}</div>
                  <div className="mt-2 text-2xl font-bold text-white">{isZh ? "活动日志" : "Activity Logs"}</div>
                </Link>

                <Link
                  href={`/${locale}/admin/blacklist`}
                  className="rounded-[24px] border border-white/10 bg-black/25 p-5 transition hover:border-emerald-400/20"
                >
                  <div className="text-sm text-zinc-400">{isZh ? "风控" : "Risk Control"}</div>
                  <div className="mt-2 text-2xl font-bold text-white">{isZh ? "邮箱黑名单" : "Blacklist"}</div>
                </Link>

                <Link
                  href={`/${locale}/account`}
                  className="rounded-[24px] border border-white/10 bg-black/25 p-5 transition hover:border-emerald-400/20"
                >
                  <div className="text-sm text-zinc-400">{isZh ? "个人中心" : "Personal Center"}</div>
                  <div className="mt-2 text-2xl font-bold text-white">{isZh ? "返回账户页" : "Back to Account"}</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[28px] border border-white/10 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400">{isZh ? "总用户数" : "Users"}</div>
            <div className="mt-3 text-4xl font-bold">{totalUsers}</div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400">{isZh ? "总订单数" : "Orders"}</div>
            <div className="mt-3 text-4xl font-bold">{totalOrders}</div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400">{isZh ? "总生成记录" : "Generations"}</div>
            <div className="mt-3 text-4xl font-bold">{totalGenerations}</div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400">{isZh ? "总任务数" : "Jobs"}</div>
            <div className="mt-3 text-4xl font-bold">{totalJobs}</div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400">{isZh ? "日志总数" : "Logs"}</div>
            <div className="mt-3 text-4xl font-bold">{totalLogs}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-[32px] border border-white/10 bg-zinc-900 p-7">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "用户与转化" : "Users & Conversion"}
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-zinc-950 p-4">
                <div className="text-sm text-zinc-400">{isZh ? "付费用户" : "Paid Users"}</div>
                <div className="mt-2 text-2xl font-bold text-white">{paidUsers}</div>
              </div>
              <div className="rounded-2xl bg-zinc-950 p-4">
                <div className="text-sm text-zinc-400">{isZh ? "已支付订单" : "Paid Orders"}</div>
                <div className="mt-2 text-2xl font-bold text-white">{paidOrders}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-zinc-900 p-7">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "套餐分布" : "Plan Mix"}
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-zinc-950 p-4 flex items-center justify-between">
                <span>Free</span>
                <span className="font-bold">{planDistribution.free}</span>
              </div>
              <div className="rounded-2xl bg-zinc-950 p-4 flex items-center justify-between">
                <span>Pro</span>
                <span className="font-bold">{planDistribution.pro}</span>
              </div>
              <div className="rounded-2xl bg-zinc-950 p-4 flex items-center justify-between">
                <span>Studio</span>
                <span className="font-bold">{planDistribution.studio}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-zinc-900 p-7">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "系统观察" : "System Snapshot"}
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-zinc-950 p-4 flex items-center justify-between">
                <span>{isZh ? "成功任务" : "Success Jobs"}</span>
                <span className="font-bold">{successJobs}</span>
              </div>
              <div className="rounded-2xl bg-zinc-950 p-4 flex items-center justify-between">
                <span>{isZh ? "失败任务" : "Failed Jobs"}</span>
                <span className="font-bold">{failedJobs}</span>
              </div>
              <div className="rounded-2xl bg-zinc-950 p-4 flex items-center justify-between">
                <span>{isZh ? "日志量" : "Log Volume"}</span>
                <span className="font-bold">{totalLogs}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[32px] border border-white/10 bg-zinc-900 p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-emerald-300">
                  {isZh ? "最近任务" : "Recent Jobs"}
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {isZh ? "最近任务活动" : "Recent Job Activity"}
                </div>
              </div>
              <Link
                href={`/${locale}/admin/jobs`}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300"
              >
                {isZh ? "查看全部" : "View All"}
              </Link>
            </div>

            <div className="space-y-4">
              {recentJobs.length === 0 ? (
                <div className="rounded-2xl bg-zinc-950 p-5 text-zinc-400">
                  {isZh ? "暂无任务" : "No jobs yet"}
                </div>
              ) : (
                recentJobs.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-zinc-950 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-semibold text-white">
                          {item.script_title || (isZh ? "未命名任务" : "Untitled Job")}
                        </div>
                        <div className="mt-1 text-sm text-zinc-500">{item.email || "-"}</div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatPlan(item.plan)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatJobStatus(item.status)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {item.progress}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-zinc-900 p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-emerald-300">
                  {isZh ? "最近日志" : "Recent Logs"}
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {isZh ? "最近用户行为" : "Recent User Activity"}
                </div>
              </div>
              <Link
                href={`/${locale}/admin/logs`}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300"
              >
                {isZh ? "查看全部" : "View All"}
              </Link>
            </div>

            <div className="space-y-4">
              {recentLogs.length === 0 ? (
                <div className="rounded-2xl bg-zinc-950 p-5 text-zinc-400">
                  {isZh ? "暂无日志" : "No logs yet"}
                </div>
              ) : (
                recentLogs.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-zinc-950 p-5">
                    <div className="text-sm text-emerald-300">{item.action_type}</div>
                    <div className="mt-2 font-semibold text-white">{item.message || "-"}</div>
                    <div className="mt-2 text-sm text-zinc-500">
                      {item.actor_email || "-"} · {formatTime(item.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[32px] border border-white/10 bg-zinc-900 p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-emerald-300">
                {isZh ? "最近订单" : "Recent Orders"}
              </div>
              <div className="mt-2 text-3xl font-bold text-white">
                {isZh ? "最近收入记录" : "Recent Revenue Records"}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950 p-5 text-zinc-400">
                {isZh ? "暂无订单" : "No orders yet"}
              </div>
            ) : (
              recentOrders.map((item) => (
                <div key={item.id} className="rounded-2xl bg-zinc-950 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-white">
                        {item.email || "-"}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">{formatTime(item.created_at)}</div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                        {formatPlan(item.plan)}
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                        {formatMoney(item.amount)}
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                        {item.payment_method}
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                        {item.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}