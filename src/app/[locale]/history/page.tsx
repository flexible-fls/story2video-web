"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import { supabase } from "@/lib/supabase";

type GenerationRow = {
  id: string;
  job_id: string | null;
  user_id: string;
  email: string | null;
  file_name: string | null;
  plan: string;
  quota_cost: number;
  status: string;
  created_at: string;
};

export default function HistoryPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [records, setRecords] = useState<GenerationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/auth`);
        return;
      }

      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRecords(data as GenerationRow[]);
      }

      setLoading(false);
    }

    loadHistory();
  }, [locale, router]);

  const formatPlan = useMemo(
    () => (plan: string) => {
      if (plan === "studio") return "Studio";
      if (plan === "pro") return "Pro";
      return "Free";
    },
    []
  );

  const formatTime = useMemo(
    () => (value: string) => {
      return new Date(value).toLocaleString();
    },
    []
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "加载中..." : "Loading..."}
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
              {isZh ? "生成记录" : "Generation History"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/jobs`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {isZh ? "任务中心" : "Jobs"}
            </Link>
            <Link
              href={`/${locale}/account`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {isZh ? "返回账户中心" : "Back to Account"}
            </Link>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
            {isZh ? "作品历史" : "History"}
          </div>

          <h1 className="text-4xl font-bold">
            {isZh ? "你的生成记录" : "Your Generation History"}
          </h1>

          <p className="mt-3 text-zinc-400">
            {isZh
              ? "这里会记录你每次生成成功写入的项目。"
              : "This page records successful generation entries written into your history."}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <div className="mb-4 text-xl font-semibold">
            {isZh ? "历史列表" : "History List"}
          </div>

          {records.length === 0 ? (
            <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-400">
              {isZh ? "暂时没有生成记录" : "No generation records yet"}
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((item) => (
                <div key={item.id} className="rounded-2xl bg-zinc-950 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="font-medium">
                        {item.file_name || (isZh ? "未命名文件" : "Untitled file")}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">{formatTime(item.created_at)}</div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                        {isZh ? "套餐：" : "Plan: "} {formatPlan(item.plan)}
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                        {isZh ? "消耗：" : "Cost: "} {item.quota_cost}
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                        {isZh ? "状态：" : "Status: "} {item.status}
                      </div>
                    </div>
                  </div>

                  {item.job_id && (
                    <div className="mt-4">
                      <Link
                        href={`/${locale}/result?job=${item.job_id}`}
                        className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300"
                      >
                        {isZh ? "查看结果详情" : "View Result"}
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}