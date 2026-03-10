"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";

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

export default function ActivityPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
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

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLogs((data as ActivityLogRow[]) || []);
    }

    setLoading(false);
  }

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return logs;

    return logs.filter((item) => {
      return (
        (item.action_type || "").toLowerCase().includes(keyword) ||
        (item.message || "").toLowerCase().includes(keyword) ||
        (item.target_id || "").toLowerCase().includes(keyword)
      );
    });
  }, [logs, search]);

  function formatTime(value: string) {
    return new Date(value).toLocaleString();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06070a] text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "活动记录加载中..." : "Loading activity logs..."}
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
            <BackButton fallbackHref={`/${locale}/account`} />
            <div>
              <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
              <div className="text-xs text-zinc-400">
                {isZh ? "我的活动记录" : "My Activity"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/account`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200"
            >
              {isZh ? "账户中心" : "Account"}
            </Link>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-10 pt-16">
        <div className="grid items-start gap-10 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-medium text-emerald-300">
              {isZh ? "用户行为记录" : "User Activity Log"}
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">
              {isZh ? "查看你的操作记录与生成行为" : "Review your actions and generation activity"}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              {isZh
                ? "这里会记录你在平台上的关键操作，例如打开生成页、上传剧本、创建任务、生成成功或失败等。"
                : "This page shows your key actions on the platform, such as opening the generate page, uploading scripts, creating jobs, and generation results."}
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 p-6">
            <div className="text-3xl font-bold text-white">
              {isZh ? "搜索记录" : "Search Logs"}
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              {isZh ? "按动作、信息或目标ID快速查找。" : "Search by action, message, or target ID."}
            </div>

            <div className="mt-6 rounded-[24px] border border-white/8 bg-black/40 p-5">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isZh ? "搜索动作 / 信息 / 目标ID" : "Search action / message / target ID"}
                className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-900/90 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="rounded-[32px] border border-white/10 bg-zinc-900 p-10 text-center text-zinc-400">
              {isZh ? "暂时没有活动记录" : "No activity logs yet"}
            </div>
          ) : (
            filteredLogs.map((item) => (
              <div key={item.id} className="rounded-[28px] border border-white/10 bg-zinc-900 p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="text-sm text-emerald-300">{item.action_type}</div>
                    <div className="mt-2 text-lg font-semibold text-white">{item.message || "-"}</div>
                    <div className="mt-2 text-sm text-zinc-500">{item.target_id || "-"}</div>
                  </div>

                  <div className="text-sm text-zinc-400">{formatTime(item.created_at)}</div>
                </div>

                {item.metadata && Object.keys(item.metadata).length > 0 ? (
                  <pre className="mt-4 overflow-auto rounded-2xl bg-zinc-950 p-4 text-xs text-zinc-300">
{JSON.stringify(item.metadata, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}