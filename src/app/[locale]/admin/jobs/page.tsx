"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";

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

export default function AdminJobsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<GenerationJobRow[]>([]);
  const [search, setSearch] = useState("");

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

    const { data: adminRow } = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminRow) {
      router.push(`/${locale}/account`);
      return;
    }

    const { data, error } = await supabase.rpc("admin_list_generation_jobs");

    if (!error && data) {
      setJobs((data as GenerationJobRow[]) || []);
    }

    setLoading(false);
  }

  const filteredJobs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return jobs;

    return jobs.filter((item) => {
      return (
        (item.email || "").toLowerCase().includes(keyword) ||
        (item.script_title || "").toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword)
      );
    });
  }, [jobs, search]);

  function formatPlan(plan: string) {
    if (plan === "studio") return "Studio";
    if (plan === "pro") return "Pro";
    return "Free";
  }

  function formatTime(value: string) {
    return new Date(value).toLocaleString();
  }

  function formatStatus(status: string) {
    if (status === "pending") return isZh ? "等待中" : "Pending";
    if (status === "processing") return isZh ? "生成中" : "Processing";
    if (status === "success") return isZh ? "成功" : "Success";
    if (status === "failed") return isZh ? "失败" : "Failed";
    return status;
  }

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
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}/admin`} />
            <div>
              <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
              <div className="text-xs text-zinc-400">{isZh ? "后台任务管理" : "Admin Jobs"}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/admin`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300"
            >
              {isZh ? "返回后台首页" : "Back to Admin"}
            </Link>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-6">
          <h1 className="text-4xl font-bold">{isZh ? "任务管理" : "Job Management"}</h1>
          <p className="mt-3 text-zinc-400">
            {isZh ? "查看全站所有生成任务与状态。" : "Review all generation jobs across the platform."}
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-zinc-900 p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isZh ? "搜索邮箱 / 标题 / 任务 ID" : "Search email / title / job ID"}
            className="h-10 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </div>

        <div className="space-y-4">
          {filteredJobs.map((item) => (
            <div key={item.id} className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="text-lg font-semibold">{item.script_title || "-"}</div>
                  <div className="mt-1 text-sm text-zinc-500">{item.email || "-"}</div>
                  <div className="mt-1 text-xs text-zinc-600">{item.id}</div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                    {formatPlan(item.plan)}
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                    {formatStatus(item.status)}
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                    progress: {item.progress}%
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                    {formatTime(item.created_at)}
                  </div>
                </div>
              </div>

              {item.error_message && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {item.error_message}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}