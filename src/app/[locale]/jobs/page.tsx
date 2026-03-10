"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

type GenerationJobRow = {
  id: string;
  user_id: string;
  email: string | null;
  script_title: string | null;
  source_type: string | null;
  status: string;
  progress: number;
  result_url: string | null;
  error_message: string | null;
  plan: string;
  quota_cost: number;
  created_at: string;
  updated_at: string;
};

type RangeKey = "all" | "7d" | "30d" | "90d";

export default function JobsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<GenerationJobRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState<RangeKey>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState("");

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

    setUserEmail(user.email || "");
    await loadJobs(user.id);
    setLoading(false);
  }

  function getStartDateIso(range: RangeKey) {
    if (range === "all") return null;

    const now = new Date();
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return start.toISOString();
  }

  async function loadJobs(userId?: string) {
    setRefreshing(true);

    let targetUserId = userId;

    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/auth`);
        return;
      }

      targetUserId = user.id;
    }

    let query: any = supabase
      .from("generation_jobs")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const startDateIso = getStartDateIso(rangeFilter);
    if (startDateIso) {
      query = query.gte("created_at", startDateIso);
    }

    const { data, error } = await query;

    if (!error) {
      setJobs((data as GenerationJobRow[]) || []);
    }

    setRefreshing(false);
  }

  useEffect(() => {
    if (!loading) {
      loadJobs();
    }
  }, [statusFilter, rangeFilter]);

  useEffect(() => {
    if (loading) return;

    const timer = setInterval(() => {
      loadJobs();
    }, 10000);

    return () => clearInterval(timer);
  }, [loading, statusFilter, rangeFilter]);

  function formatPlan(plan: string) {
    if (plan === "studio") return "Studio";
    if (plan === "pro") return "Pro";
    return "Free";
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

  function getStatusStyle(status: string) {
    if (status === "success") {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    }
    if (status === "failed") {
      return "border-red-500/20 bg-red-500/10 text-red-300";
    }
    if (status === "processing") {
      return "border-blue-500/20 bg-blue-500/10 text-blue-300";
    }
    return "border-white/10 bg-white/[0.03] text-zinc-300";
  }

  function getProgressBarStyle(status: string) {
    if (status === "success") return "bg-emerald-400";
    if (status === "failed") return "bg-red-400";
    if (status === "processing") return "bg-blue-400";
    return "bg-zinc-400";
  }

  const filteredJobs = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return jobs;

    return jobs.filter((item) => {
      return (
        (item.script_title || "").toLowerCase().includes(keyword) ||
        (item.email || "").toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword) ||
        (item.error_message || "").toLowerCase().includes(keyword)
      );
    });
  }, [jobs, search]);

  const successCount = filteredJobs.filter((item) => item.status === "success").length;
  const processingCount = filteredJobs.filter((item) => item.status === "processing").length;
  const failedCount = filteredJobs.filter((item) => item.status === "failed").length;
  const pendingCount = filteredJobs.filter((item) => item.status === "pending").length;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06070a] text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "任务加载中..." : "Loading jobs..."}
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
                {isZh ? "任务中心" : "Jobs Center"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/generate`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
            >
              {isZh ? "去生成" : "Create"}
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
        <div className="grid items-start gap-10 xl:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-medium text-emerald-300">
              {isZh ? "任务驱动工作流" : "Job-driven Workflow"}
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">
              {isZh ? "查看你的生成任务、进度与结果" : "Track your jobs, progress, and results"}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              {isZh
                ? "所有生成任务都会进入任务中心。你可以查看状态、进度、失败原因和结果入口，让创作流程从一次性页面操作升级为可追踪的工作流。"
                : "Every generation enters the jobs center. Track status, progress, failure reasons, and result links in a workflow built for continuous creation."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "任务状态" : "Job Status"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "进度跟踪" : "Progress Tracking"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "结果入口" : "Result Access"}
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-4">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "总任务" : "Total Jobs"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{filteredJobs.length}</div>
              </div>

              <div className="rounded-[28px] border border-emerald-400/15 bg-gradient-to-b from-emerald-400/10 to-zinc-950 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "成功" : "Success"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{successCount}</div>
              </div>

              <div className="rounded-[28px] border border-blue-400/15 bg-gradient-to-b from-blue-400/10 to-zinc-950 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "进行中" : "Processing"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{processingCount}</div>
              </div>

              <div className="rounded-[28px] border border-red-400/15 bg-gradient-to-b from-red-400/10 to-zinc-950 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "失败" : "Failed"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{failedCount}</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-emerald-400/10 via-transparent to-cyan-400/10 blur-xl" />
            <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="text-3xl font-bold text-white">
                {isZh ? "筛选与搜索" : "Search & Filters"}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                {isZh ? "快速定位任务状态、时间范围和任务内容。" : "Quickly find jobs by status, date range, and content."}
              </div>

              <div className="mt-6 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "当前账号" : "Current Account"}</div>
                <div className="mt-3 break-all text-lg font-semibold text-white">{userEmail || "-"}</div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <label className="mb-3 block text-sm text-zinc-400">
                  {isZh ? "搜索任务" : "Search Jobs"}
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isZh ? "搜索标题 / 邮箱 / ID / 错误信息" : "Search title / email / ID / error"}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/8 bg-black/40 p-5">
                  <label className="mb-3 block text-sm text-zinc-400">
                    {isZh ? "状态筛选" : "Status Filter"}
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white outline-none"
                  >
                    <option value="all">{isZh ? "全部状态" : "All Statuses"}</option>
                    <option value="pending">{isZh ? "等待中" : "Pending"}</option>
                    <option value="processing">{isZh ? "生成中" : "Processing"}</option>
                    <option value="success">{isZh ? "成功" : "Success"}</option>
                    <option value="failed">{isZh ? "失败" : "Failed"}</option>
                  </select>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-black/40 p-5">
                  <label className="mb-3 block text-sm text-zinc-400">
                    {isZh ? "时间范围" : "Date Range"}
                  </label>
                  <select
                    value={rangeFilter}
                    onChange={(e) => setRangeFilter(e.target.value as RangeKey)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white outline-none"
                  >
                    <option value="all">{isZh ? "全部时间" : "All Time"}</option>
                    <option value="7d">{isZh ? "最近 7 天" : "Last 7 Days"}</option>
                    <option value="30d">{isZh ? "最近 30 天" : "Last 30 Days"}</option>
                    <option value="90d">{isZh ? "最近 90 天" : "Last 90 Days"}</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-sm text-zinc-400">{isZh ? "当前分布" : "Current Summary"}</div>
                  <div className="text-sm text-zinc-300">
                    {isZh ? `等待中 ${pendingCount} · 进行中 ${processingCount}` : `Pending ${pendingCount} · Processing ${processingCount}`}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">
                    {isZh ? `成功任务：${successCount}` : `Success: ${successCount}`}
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">
                    {isZh ? `失败任务：${failedCount}` : `Failed: ${failedCount}`}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => loadJobs()}
                  disabled={refreshing}
                  className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
                >
                  {refreshing
                    ? isZh
                      ? "刷新中..."
                      : "Refreshing..."
                    : isZh
                    ? "立即刷新"
                    : "Refresh Now"}
                </button>

                <Link
                  href={`/${locale}/generate`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
                >
                  {isZh ? "新建生成任务" : "Create New Job"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-zinc-900/90 via-zinc-900/80 to-zinc-900/90 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          <div className="max-w-4xl">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "任务说明" : "Why Jobs Matter"}
            </div>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-white">
              {isZh ? "不再是一次性跳转，而是可追踪的创作流程" : "Not a one-off page jump, but a trackable creative workflow"}
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              {isZh
                ? "通过任务中心，你可以把每一次生成都作为独立工作项管理。未来无论你接入图片生成、配音生成还是视频合成，都可以继续沿用这一套任务流程。"
                : "With the jobs center, every generation becomes a managed work item. Later, image generation, voice generation, and video composition can all continue within the same workflow."}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <div className="text-sm font-medium text-emerald-300">{isZh ? "任务列表" : "Job List"}</div>
          <h2 className="mt-3 text-4xl font-bold text-white">
            {isZh ? "你的全部任务" : "All of your jobs"}
          </h2>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-10 text-center">
            <div className="text-2xl font-bold text-white">
              {isZh ? "暂无符合条件的任务" : "No matching jobs found"}
            </div>
            <div className="mt-3 text-zinc-400">
              {isZh ? "你可以调整筛选条件，或者直接创建新的生成任务。"
 : "Try adjusting the filters or create a new generation job."}
            </div>
            <div className="mt-6">
              <Link
                href={`/${locale}/generate`}
                className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black"
              >
                {isZh ? "去生成" : "Create Now"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredJobs.map((item) => (
              <div
                key={item.id}
                className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-2xl font-bold text-white">
                        {item.script_title || (isZh ? "未命名任务" : "Untitled Job")}
                      </div>
                      <div className={`rounded-full border px-3 py-1 text-xs ${getStatusStyle(item.status)}`}>
                        {formatJobStatus(item.status)}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-zinc-300">
                        {formatPlan(item.plan)}
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-zinc-300">
                        {isZh ? "消耗" : "Cost"}: {item.quota_cost}
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-zinc-300">
                        {isZh ? "创建时间" : "Created"}: {formatTime(item.created_at)}
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-zinc-300">
                        {isZh ? "更新时间" : "Updated"}: {formatTime(item.updated_at)}
                      </div>
                    </div>

                    <div className="mt-3 break-all text-sm text-zinc-500">
                      {item.id}
                    </div>

                    {item.email && (
                      <div className="mt-2 text-sm text-zinc-400">{item.email}</div>
                    )}

                    {item.error_message && (
                      <div className="mt-4 rounded-[24px] border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm leading-7 text-red-300">
                        <div className="font-semibold">{isZh ? "错误信息" : "Error Message"}</div>
                        <div className="mt-2">{item.error_message}</div>
                      </div>
                    )}
                  </div>

                  <div className="w-full xl:w-[340px]">
                    <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                      <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="text-zinc-300">{isZh ? "当前进度" : "Current Progress"}</span>
                        <span className="text-zinc-400">{item.progress}%</span>
                      </div>

                      <div className="h-3 rounded-full bg-zinc-900">
                        <div
                          className={`h-3 rounded-full ${getProgressBarStyle(item.status)}`}
                          style={{
                            width: `${Math.max(Math.min(item.progress, 100), item.progress > 0 ? 6 : 0)}%`,
                          }}
                        />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        {item.status === "success" ? (
                          <Link
                            href={`/${locale}/result?job=${item.id}`}
                            className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center text-sm font-medium text-emerald-300"
                          >
                            {isZh ? "查看结果" : "View Result"}
                          </Link>
                        ) : null}

                        {item.result_url ? (
                          <a
                            href={item.result_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium text-zinc-200"
                          >
                            {isZh ? "打开结果链接" : "Open Result URL"}
                          </a>
                        ) : null}

                        <Link
                          href={`/${locale}/generate`}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium text-zinc-200"
                        >
                          {isZh ? "再生成一个" : "Create Another"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-[36px] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 via-emerald-400/10 to-cyan-400/10 p-10 text-center shadow-[0_20px_80px_rgba(16,185,129,0.08)]">
          <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative text-sm font-medium text-emerald-200">
            {isZh ? "继续创作" : "Keep Creating"}
          </div>

          <h2 className="relative mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
            {isZh ? "继续创建新任务，让内容生产持续推进" : "Create new jobs and keep your production workflow moving"}
          </h2>

          <p className="relative mx-auto mt-4 max-w-3xl text-base leading-8 text-zinc-200">
            {isZh
              ? "从剧本解析到结果查看，任务中心会持续承接你的创作流程。"
              : "From script parsing to result review, the jobs center keeps your workflow moving in one place."}
          </p>

          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/${locale}/generate`}
              className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              {isZh ? "新建生成任务" : "Create New Job"}
            </Link>

            <Link
              href={`/${locale}/history`}
              className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
            >
              {isZh ? "查看历史记录" : "Open History"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}