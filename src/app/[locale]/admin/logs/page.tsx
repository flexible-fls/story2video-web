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

export default function AdminLogsPage() {
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

    const { data: adminRow } = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminRow) {
      router.push(`/${locale}/account`);
      return;
    }

    const { data, error } = await supabase.rpc("admin_list_activity_logs");

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
        (item.actor_email || "").toLowerCase().includes(keyword) ||
        item.action_type.toLowerCase().includes(keyword) ||
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
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "日志加载中..." : "Loading logs..."}
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
              <div className="text-xs text-zinc-400">{isZh ? "后台活动日志" : "Admin Activity Logs"}</div>
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
          <h1 className="text-4xl font-bold">{isZh ? "活动日志" : "Activity Logs"}</h1>
          <p className="mt-3 text-zinc-400">
            {isZh ? "查看用户行为、任务动作和系统事件。" : "Review user actions, job actions, and system events."}
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-zinc-900 p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isZh ? "搜索邮箱 / 动作 / 信息 / 目标ID" : "Search email / action / message / target ID"}
            className="h-10 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </div>

        <div className="space-y-4">
          {filteredLogs.map((item) => (
            <div key={item.id} className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="text-sm text-emerald-300">{item.action_type}</div>
                  <div className="mt-2 text-lg font-semibold">{item.message || "-"}</div>
                  <div className="mt-1 text-sm text-zinc-500">{item.actor_email || "-"}</div>
                  <div className="mt-1 text-xs text-zinc-600">{item.target_id || "-"}</div>
                </div>

                <div className="text-sm text-zinc-400">{formatTime(item.created_at)}</div>
              </div>

              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <pre className="mt-4 overflow-auto rounded-2xl bg-zinc-950 p-4 text-xs text-zinc-300">
{JSON.stringify(item.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}