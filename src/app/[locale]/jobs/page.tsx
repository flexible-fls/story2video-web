"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

type StepLogItem = {
  key: string;
  label: string;
  status: "pending" | "processing" | "success" | "failed";
  progress: number;
  updatedAt: string;
};

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
  step_logs: StepLogItem[] | null;
  created_at: string;
  updated_at: string;
};

type RangeKey = "all" | "7d" | "30d" | "90d";
type StatusKey = "all" | "pending" | "processing" | "success" | "failed";

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function shortId(value: string) {
  if (!value) return "";
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default function JobsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<GenerationJobRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey>("all");
  const [rangeFilter, setRangeFilter] = useState<RangeKey>("all");
  const [userEmail, setUserEmail] = useState("");
  const [expandedJobId, setExpandedJobId] = useState("");

  const mountedRef = useRef(true);

  const getStartDateIso = useCallback((range: RangeKey) => {
    if (range === "all") return null;

    const now = Date.now();
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    return new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
  }, []);

  const loadJobs = useCallback(
    async (userId?: string, silent = false) => {
      if (!silent && mountedRef.current) {
        setRefreshing(true);
      }

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

      if (!mountedRef.current) return;

      if (!error) {
        setJobs((data as GenerationJobRow[]) || []);
      }

      setRefreshing(false);
    },
    [getStartDateIso, locale, rangeFilter, router, statusFilter]
  );

  const bootstrap = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/${locale}/auth`);
      return;
    }

    if (!mountedRef.current) return;

    setUserEmail(user.email || "");
    await loadJobs(user.id);

    if (mountedRef.current) {
      setLoading(false);
    }
  }, [loadJobs, locale, router]);

  useEffect(() => {
    mountedRef.current = true;
    bootstrap();

    return () => {
      mountedRef.current = false;
    };
  }, [bootstrap]);

  useEffect(() => {
    if (!loading) {
      loadJobs(undefined, true);
    }
  }, [loading, statusFilter, rangeFilter, loadJobs]);

  useEffect(() => {
    if (loading) return;

    const timer = window.setInterval(() => {
      loadJobs(undefined, true);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [loading, loadJobs]);

  function formatPlan(plan: string) {
    if (plan === "studio") return "Studio";
    if (plan === "pro") return "Pro";
    return "Free";
  }

  function formatSourceType(sourceType: string | null) {
    if (!sourceType) return isZh ? "未知来源" : "Unknown Source";
    if (sourceType === "upload") return isZh ? "文件上传" : "File Upload";
    if (sourceType === "paste") return isZh ? "文本粘贴" : "Pasted Text";
    if (sourceType === "template") return isZh ? "模板生成" : "Template";
    if (sourceType === "history") return isZh ? "历史草稿" : "Draft History";
    return sourceType;
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

  function getStepStatusLabel(status: StepLogItem["status"]) {
    if (status === "success") return isZh ? "成功" : "Success";
    if (status === "failed") return isZh ? "失败" : "Failed";
    if (status === "processing") return isZh ? "处理中" : "Processing";
    return isZh ? "等待中" : "Pending";
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

  const totalCount = filteredJobs.length;
  const successCount = filteredJobs.filter((item) => item.status === "success").length;
  const processingCount = filteredJobs.filter((item) => item.status === "processing").length;
  const failedCount = filteredJobs.filter((item) => item.status === "failed").length;
  const pendingCount = filteredJobs.filter((item) => item.status === "pending").length;

  const latestJob = filteredJobs[0] || null;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06070a] text-white">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-zinc-400">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />
          <div>{isZh ? "任务加载中..." : "Loading jobs..."}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[100px] h-[320px] w-[320px] rounded-full bg-emerald-500/10 blur-3xl" />
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
                {isZh ? "任务中心" : "Jobs Center"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/generate`}
              className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/15"
            >
              {isZh ? "开始新生成" : "Create New Job"}
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

      <section className="relative mx-auto max-w-7xl px-6 pb-8 pt-14">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-medium text-emerald-300">
              {isZh ? "可追踪生成工作流" : "Trackable Generation Workflow"}
            </div>

            <h1 className="max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
              {isZh ? "查看每一次生成、进度与结果" : "Track every generation, progress, and result"}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 md:text-lg">
              {isZh
                ? "任务中心把你的创作流程从单次操作变成可追踪的生产线。你可以快速查看状态、筛选失败任务、回看步骤明细，并继续下一次生成。"
                : "The jobs center turns one-off actions into a trackable production flow. Check status, filter failures, review step details, and move into the next generation faster."}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5">
                <div className="text-sm text-zinc-400">{isZh ? "总任务" : "Total Jobs"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{totalCount}</div>
              </div>

              <div className="rounded-[28px] border border-emerald-400/15 bg-gradient-to-b from-emerald-400/10 to-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "成功" : "Success"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{successCount}</div>
              </div>

              <div className="rounded-[28px] border border-blue-400/15 bg-gradient-to-b from-blue-400/10 to-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "进行中" : "Processing"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{processingCount}</div>
              </div>

              <div className="rounded-[28px] border border-red-400/15 bg-gradient-to-b from-red-400/10 to-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "失败" : "Failed"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{failedCount}</div>
              </div>
            </div>

            <div className="mt-8 rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-zinc-400">
                    {isZh ? "当前登录账号" : "Signed-in Account"}
                  </div>
                  <div className="mt-2 text-base font-medium text-white break-all">
                    {userEmail || (isZh ? "未获取到邮箱" : "No email found")}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadJobs()}
                  disabled={refreshing}
                  className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {refreshing
                    ? isZh
                      ? "刷新中..."
                      : "Refreshing..."
                    : isZh
                    ? "立即刷新"
                    : "Refresh"}
                </button>
              </div>

              {latestJob ? (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-4">
                    <div className="text-xs text-zinc-500">{isZh ? "最近任务" : "Latest Job"}</div>
                    <div className="mt-2 text-sm font-medium text-white">
                      {latestJob.script_title || (isZh ? "未命名任务" : "Untitled Job")}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-4">
                    <div className="text-xs text-zinc-500">{isZh ? "当前状态" : "Current Status"}</div>
                    <div className="mt-2 text-sm font-medium text-white">
                      {formatJobStatus(latestJob.status)}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-4">
                    <div className="text-xs text-zinc-500">{isZh ? "等待中" : "Pending"}</div>
                    <div className="mt-2 text-sm font-medium text-white">{pendingCount}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[36px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold text-white">
                  {isZh ? "快速筛选" : "Quick Filters"}
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  {isZh
                    ? "快速定位成功、处理中或失败任务。"
                    : "Quickly locate success, processing, or failed jobs."}
                </div>
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
                {isZh ? "自动轮询 10 秒" : "Auto refresh every 10s"}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[24px] border border-white/8 bg-black/40 p-5">
                <label className="mb-3 block text-sm text-zinc-400">
                  {isZh ? "搜索任务" : "Search Jobs"}
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    isZh
                      ? "输入标题、邮箱、任务 ID 或错误信息"
                      : "Search title, email, job ID, or error"
                  }
                  className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/8 bg-black/40 p-5">
                  <label className="mb-3 block text-sm text-zinc-400">
                    {isZh ? "状态筛选" : "Status Filter"}
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusKey)}
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

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-2xl px-4 py-3 text-sm transition ${
                    statusFilter === "all"
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07]"
                  }`}
                >
                  {isZh ? "全部" : "All"}
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("processing")}
                  className={`rounded-2xl px-4 py-3 text-sm transition ${
                    statusFilter === "processing"
                      ? "bg-blue-400 text-black"
                      : "border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07]"
                  }`}
                >
                  {isZh ? "生成中" : "Processing"}
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("success")}
                  className={`rounded-2xl px-4 py-3 text-sm transition ${
                    statusFilter === "success"
                      ? "bg-emerald-400 text-black"
                      : "border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07]"
                  }`}
                >
                  {isZh ? "成功" : "Success"}
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("failed")}
                  className={`rounded-2xl px-4 py-3 text-sm transition ${
                    statusFilter === "failed"
                      ? "bg-red-400 text-black"
                      : "border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07]"
                  }`}
                >
                  {isZh ? "失败" : "Failed"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="space-y-6">
          {filteredJobs.length === 0 ? (
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-10 text-center">
              <div className="text-2xl font-bold text-white">
                {isZh ? "暂无符合条件的任务" : "No matching jobs found"}
              </div>
              <div className="mt-3 text-zinc-400">
                {isZh
                  ? "你可以调整筛选条件，或者直接创建新的生成任务。"
                  : "Try adjusting your filters or create a new generation job."}
              </div>
              <div className="mt-6">
                <Link
                  href={`/${locale}/generate`}
                  className="inline-flex rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  {isZh ? "去创建任务" : "Create a Job"}
                </Link>
              </div>
            </div>
          ) : (
            filteredJobs.map((item) => {
              const progress = clampProgress(item.progress);
              const isExpanded = expandedJobId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6"
                >
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-2xl font-bold text-white">
                          {item.script_title || (isZh ? "未命名任务" : "Untitled Job")}
                        </div>

                        <div
                          className={`rounded-full border px-3 py-1 text-xs ${getStatusStyle(item.status)}`}
                        >
                          {formatJobStatus(item.status)}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-zinc-300">
                          {formatPlan(item.plan)}
                        </div>

                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-zinc-300">
                          {formatSourceType(item.source_type)}
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

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-[24px] border border-white/8 bg-black/25 p-4">
                          <div className="text-xs text-zinc-500">{isZh ? "任务 ID" : "Job ID"}</div>
                          <div className="mt-2 text-sm text-zinc-300 break-all">{item.id}</div>
                          <div className="mt-2 text-xs text-zinc-500">
                            {isZh ? "短 ID：" : "Short ID: "} {shortId(item.id)}
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-white/8 bg-black/25 p-4">
                          <div className="text-xs text-zinc-500">
                            {isZh ? "关联邮箱" : "Related Email"}
                          </div>
                          <div className="mt-2 text-sm text-zinc-300 break-all">
                            {item.email || userEmail || (isZh ? "未记录邮箱" : "No email")}
                          </div>
                        </div>
                      </div>

                      {item.error_message ? (
                        <div className="mt-4 rounded-[24px] border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm leading-7 text-red-300">
                          <div className="font-semibold">{isZh ? "错误信息" : "Error Message"}</div>
                          <div className="mt-2 whitespace-pre-wrap break-words">
                            {item.error_message}
                          </div>
                        </div>
                      ) : null}

                      {item.step_logs && item.step_logs.length > 0 && isExpanded ? (
                        <div className="mt-4 rounded-[24px] border border-white/8 bg-black/25 p-5">
                          <div className="mb-4 text-sm font-semibold text-zinc-300">
                            {isZh ? "任务步骤明细" : "Job Step Details"}
                          </div>

                          <div className="space-y-3">
                            {item.step_logs.map((step, index) => (
                              <div
                                key={`${step.key}-${index}`}
                                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="text-sm text-zinc-200">{step.label}</div>

                                  <div
                                    className={`rounded-full px-3 py-1 text-xs ${
                                      step.status === "success"
                                        ? "bg-emerald-400/10 text-emerald-300"
                                        : step.status === "failed"
                                        ? "bg-red-500/10 text-red-300"
                                        : step.status === "processing"
                                        ? "bg-blue-500/10 text-blue-300"
                                        : "bg-white/[0.05] text-zinc-300"
                                    }`}
                                  >
                                    {getStepStatusLabel(step.status)}
                                  </div>
                                </div>

                                <div className="mt-3 h-2 rounded-full bg-zinc-900">
                                  <div
                                    className={`h-2 rounded-full ${getProgressBarStyle(step.status)}`}
                                    style={{
                                      width: `${Math.max(
                                        Math.min(step.progress || 0, 100),
                                        step.progress > 0 ? 8 : 0
                                      )}%`,
                                    }}
                                  />
                                </div>

                                <div className="mt-2 text-xs text-zinc-500">
                                  {formatTime(step.updatedAt)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="w-full xl:w-[360px]">
                      <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                        <div className="mb-3 flex items-center justify-between text-sm">
                          <span className="text-zinc-300">
                            {isZh ? "当前进度" : "Current Progress"}
                          </span>
                          <span className="text-zinc-400">{progress}%</span>
                        </div>

                        <div className="h-3 rounded-full bg-zinc-900">
                          <div
                            className={`h-3 rounded-full ${getProgressBarStyle(item.status)}`}
                            style={{
                              width: `${Math.max(Math.min(progress, 100), progress > 0 ? 6 : 0)}%`,
                            }}
                          />
                        </div>

                        <div className="mt-6 grid gap-3">
                          {item.status === "success" ? (
                            <Link
                              href={`/${locale}/result?job=${item.id}`}
                              className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/15"
                            >
                              {isZh ? "查看结果" : "View Result"}
                            </Link>
                          ) : null}

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedJobId(isExpanded ? "" : item.id)
                            }
                            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07]"
                          >
                            {isExpanded
                              ? isZh
                                ? "收起步骤明细"
                                : "Hide Steps"
                              : isZh
                              ? "查看步骤明细"
                              : "View Steps"}
                          </button>

                          <Link
                            href={`/${locale}/generate`}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07]"
                          >
                            {isZh ? "再生成一个" : "Create Another"}
                          </Link>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-xs leading-6 text-zinc-400">
                          {item.status === "failed"
                            ? isZh
                              ? "这个任务失败了，建议优先查看错误信息和步骤明细，再返回生成页重新提交。"
                              : "This job failed. Review the error message and step details before creating another one."
                            : item.status === "processing"
                            ? isZh
                              ? "任务仍在处理中，页面会自动轮询刷新。"
                              : "This job is still processing. The page will refresh automatically."
                            : item.status === "success"
                            ? isZh
                              ? "任务已经完成，你可以直接进入结果页继续处理。"
                              : "This job is complete. You can continue directly from the result page."
                            : isZh
                            ? "任务已进入队列，等待系统处理。"
                            : "This job has entered the queue and is waiting for processing."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}