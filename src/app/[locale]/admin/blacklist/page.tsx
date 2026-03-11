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
  status: string;
  user_tag?: string | null;
  note?: string | null;
  used_count: number;
  monthly_quota: number;
  updated_at: string;
};

export default function AdminBlacklistPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState("");

  useEffect(() => {
    void loadData();
  }, [locale]);

  async function loadData() {
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

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,plan,status,user_tag,note,used_count,monthly_quota,updated_at")
      .or("status.eq.banned,user_tag.eq.blacklist")
      .order("updated_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setProfiles((data as ProfileRow[]) || []);
    }

    setLoading(false);
  }

  async function restoreUser(profile: ProfileRow) {
    setProcessingId(profile.id);
    setMessage("");

    const { error } = await supabase.rpc("admin_update_user_meta", {
      target_user_id: profile.id,
      target_note: profile.note || "",
      target_user_tag: "normal",
    });

    if (error) {
      setMessage(isZh ? `恢复失败：${error.message}` : `Restore failed: ${error.message}`);
      setProcessingId("");
      return;
    }

    const { error: statusError } = await supabase.rpc("admin_set_user_status", {
      target_user_id: profile.id,
      target_status: "active",
    });

    if (statusError) {
      setMessage(isZh ? `恢复失败：${statusError.message}` : `Restore failed: ${statusError.message}`);
      setProcessingId("");
      return;
    }

    setProfiles((prev) => prev.filter((item) => item.id !== profile.id));
    setMessage(isZh ? "用户已移出黑名单" : "User removed from blacklist");
    setProcessingId("");
  }

  const filteredProfiles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return profiles;

    return profiles.filter((item) => {
      const email = item.email?.toLowerCase() || "";
      const note = item.note?.toLowerCase() || "";
      const id = item.id.toLowerCase();
      return email.includes(keyword) || note.includes(keyword) || id.includes(keyword);
    });
  }, [profiles, search]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "黑名单加载中..." : "Loading blacklist..."}
        </div>
      </main>
    );
  }

  if (!allowed) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}/admin`} />
            <div>
              <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
              <div className="text-xs text-zinc-400">{isZh ? "黑名单管理" : "Blacklist Management"}</div>
            </div>
          </div>
          <LanguageSwitch locale={locale} />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{isZh ? "黑名单 / 风险用户" : "Blacklist / Risk Users"}</h1>
            <p className="mt-3 text-zinc-400">
              {isZh
                ? "集中查看被封禁或被标记为黑名单的用户，可直接恢复。"
                : "Review banned or blacklisted users in one place and restore them directly."}
            </p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isZh ? "搜索邮箱、备注或用户ID" : "Search email, note, or user ID"}
            className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm outline-none md:max-w-sm"
          />
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <div className="mb-4 text-sm text-zinc-400">
            {isZh ? `共 ${filteredProfiles.length} 个黑名单用户` : `${filteredProfiles.length} blacklisted users`}
          </div>

          <div className="space-y-4">
            {filteredProfiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-zinc-500">
                {isZh ? "当前没有黑名单用户" : "No blacklisted users right now"}
              </div>
            ) : (
              filteredProfiles.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold">{item.email || item.id}</div>
                      <div className="text-sm text-zinc-400">ID: {item.id}</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-red-300">
                          {item.status === "banned" ? (isZh ? "已封禁" : "Banned") : item.status}
                        </span>
                        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-yellow-300">
                          {item.user_tag === "blacklist" ? (isZh ? "黑名单" : "Blacklist") : item.user_tag || (isZh ? "无标签" : "No tag")}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-zinc-300">
                          {isZh ? `套餐：${item.plan}` : `Plan: ${item.plan}`}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-zinc-300">
                          {isZh
                            ? `额度：${item.used_count}/${item.monthly_quota}`
                            : `Quota: ${item.used_count}/${item.monthly_quota}`}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-500">
                        {isZh ? "最近更新时间：" : "Last updated: "}
                        {new Date(item.updated_at).toLocaleString()}
                      </div>
                      {item.note && (
                        <div className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300">
                          {isZh ? "备注：" : "Note: "}
                          {item.note}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/${locale}/admin/users/${item.id}`}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300"
                      >
                        {isZh ? "查看详情" : "View Detail"}
                      </Link>
                      <button
                        onClick={() => restoreUser(item)}
                        disabled={processingId === item.id}
                        className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {processingId === item.id
                          ? isZh
                            ? "恢复中..."
                            : "Restoring..."
                          : isZh
                          ? "移出黑名单"
                          : "Restore User"}
                      </button>
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