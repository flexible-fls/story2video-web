"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
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
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    }
    if (status === "failed") {
      return "border-red-500/30 bg-red-500/10 text-red-300";
    }
    if (status === "processing") {
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    }
    return "border-white/10 bg-zinc-900 text-zinc-300";
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

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "任务加载中..." : "Loading jobs..."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
            <div className="text-xs text-zinc-400">
              {isZh ? "我的生成任务" : "My Generation Jobs"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/generate`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {isZh ? "去生成" : "Create"}
            </Link>
            <Link
              href={`/${locale}/account`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {isZh ? "账户中心" : "Account"}
            </Link>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
            {isZh ? "任务中心" : "Task Center"}
          </div>

          <h1 className="text-4xl font-bold">
            {isZh ? "我的生成任务" : "My Generation Jobs"}
          </h1>

          <p className="mt-3 text-zinc-400">
            {isZh
              ? "查看你的剧本生成任务进度、状态、结果链接和失败原因。页面会自动刷新。"
              : "Track job progress, status, result links, and failure reasons. This page auto-refreshes."}
          </p>

          {userEmail && (
            <div className="mt-4 text-sm text-zinc-500">
              {isZh ? "当前账号：" : "Current account: "} {userEmail}
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400">{isZh ? "成功任务" : "Successful Jobs"}</div>
            <div className="mt-3 text-4xl font-bold">{successCount}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400">{isZh ? "生成中任务" : "Processing Jobs"}</div>
            <div className="mt-3 text-4xl font-bold">{processingCount}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400">{isZh ? "失败任务" : "Failed Jobs"}</div>
            <div className="mt-3 text-4xl font-bold">{failedCount}</div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isZh ? "搜索任务标题 / 邮箱 / ID / 错误信息" : "Search title / email / ID / error"}
              className="h-10 rounded-xl border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none"
            >
              <option value="all">{isZh ? "全部状态" : "All Statuses"}</option>
              <option value="pending">{isZh ? "等待中" : "Pending"}</option>
              <option value="processing">{isZh ? "生成中" : "Processing"}</option>
              <option value="success">{isZh ? "成功" : "Success"}</option>
              <option value="failed">{isZh ? "失败" : "Failed"}</option>
            </select>

            <select
              value={rangeFilter}
              onChange={(e) => setRangeFilter(e.target.value as RangeKey)}
              className="h-10 rounded-xl border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none"
            >
              <option value="all">{isZh ? "全部时间" : "All Time"}</option>
              <option value="7d">{isZh ? "最近 7 天" : "Last 7 Days"}</option>
              <option value="30d">{isZh ? "最近 30 天" : "Last 30 Days"}</option>
              <option value="90d">{isZh ? "最近 90 天" : "Last 90 Days"}</option>
            </select>

            <button
              onClick={() => loadJobs()}
              disabled={refreshing}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
            >
              {refreshing
                ? isZh
                  ? "刷新中..."
                  : "Refreshing..."
                : isZh
                ? "立即刷新"
                : "Refresh Now"}
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <div className="mb-4 text-xl font-semibold">
            {isZh ? "任务列表" : "Job List"}
          </div>

          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-400">
                {isZh ? "暂无任务" : "No jobs yet"}
              </div>
            ) : (
              filteredJobs.map((item) => (
                <div key={item.id} className="rounded-2xl bg-zinc-950 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="font-medium">
                        {item.script_title || (isZh ? "未命名任务" : "Untitled job")}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {item.email || "-"}
                      </div>

                      <div className="mt-1 break-all text-xs text-zinc-500">
                        {item.id}
                      </div>

                      {item.error_message && (
                        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                          {isZh ? "错误信息：" : "Error: "} {item.error_message}
                        </div>
                      )}

                      {item.result_url && (
                        <div className="mt-3 text-xs">
                          <a
                            href={item.result_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-300 underline"
                          >
                            {isZh ? "打开结果链接" : "Open Result URL"}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                        {formatPlan(item.plan)}
                      </div>

                      <div
                        className={`rounded-full border px-3 py-1 ${getStatusStyle(item.status)}`}
                      >
                        {formatJobStatus(item.status)}
                      </div>

                      <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                        {isZh ? "进度" : "Progress"}: {item.progress}%
                      </div>

                      <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                        {isZh ? "消耗" : "Cost"}: {item.quota_cost}
                      </div>

                      <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                        {formatTime(item.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-3 rounded-full bg-zinc-900">
                      <div
                        className={`h-3 rounded-full ${
                          item.status === "success"
                            ? "bg-emerald-400"
                            : item.status === "failed"
                            ? "bg-red-400"
                            : item.status === "processing"
                            ? "bg-blue-400"
                            : "bg-zinc-400"
                        }`}
                        style={{ width: `${Math.max(Math.min(item.progress, 100), item.progress > 0 ? 6 : 0)}%` }}
                      />
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