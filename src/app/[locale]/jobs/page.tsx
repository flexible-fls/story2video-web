"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";
import Link from "next/link";

export default function JobsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchJobs();
  }, [locale]);

  async function fetchJobs() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/${locale}/auth`);
      return;
    }

    const { data, error } = await supabase
      .from("generation_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    setJobs(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06070a] text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "加载任务..." : "Loading jobs..."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}/generate`} />
            <div>
              <div className="text-xl font-semibold tracking-tight text-white">
                FulushouVideo
              </div>
              <div className="text-xs text-zinc-400">
                {isZh ? "任务管理" : "Jobs Management"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/generate`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
            >
              {isZh ? "开始生成任务" : "Start Task Generation"}
            </Link>

            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-8 pt-14">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
              {isZh ? "任务管理" : "Jobs Management"}
            </h1>

            <p className="mt-6 text-base leading-8 text-zinc-300 md:text-lg">
              {isZh
                ? "在这里，你可以查看所有任务的状态，管理每个生成任务，查看任务详情以及继续处理视频任务。"
                : "Here you can manage your jobs, view statuses, check task details, and continue video tasks."}
            </p>

            {jobs.length > 0 ? (
              <div className="mt-8 space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5">
                    <div className="text-xl font-semibold text-white">
                      {job.script_title || "-"}
                    </div>
                    <div className="mt-3 text-sm text-zinc-400">
                      {isZh ? "任务状态" : "Job Status"}: {job.status}
                    </div>
                    <div className="mt-3 text-sm text-zinc-300">
                      {job.error_message || "-"}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm text-emerald-300 transition hover:bg-emerald-400/15"
                      >
                        {isZh ? "查看任务" : "View Job"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-white/10 bg-black/25 p-5 text-sm text-zinc-400">
                {isZh ? "暂无任务" : "No jobs yet"}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}