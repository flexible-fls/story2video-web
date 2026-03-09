"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
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
  email: string | null;
  plan: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
};

type GenerationRow = {
  id: string;
  email: string | null;
  file_name: string | null;
  plan: string;
  quota_cost: number;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [proUsers, setProUsers] = useState(0);
  const [studioUsers, setStudioUsers] = useState(0);

  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [recentGenerations, setRecentGenerations] = useState<GenerationRow[]>([]);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    async function loadAdminData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/auth`);
        return;
      }

      const currentEmail = (user.email || "").toLowerCase();

      if (!adminEmails.includes(currentEmail)) {
        setForbidden(true);
        setLoading(false);
        return;
      }

      const [
        profilesResult,
        ordersResult,
        generationsResult,
        recentOrdersResult,
        recentGenerationsResult,
      ] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("orders").select("*"),
        supabase.from("generations").select("*"),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("generations").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      const profiles = (profilesResult.data || []) as ProfileRow[];
      const orders = (ordersResult.data || []) as OrderRow[];
      const generations = (generationsResult.data || []) as GenerationRow[];

      setTotalUsers(profiles.length);
      setTotalOrders(orders.length);
      setTotalGenerations(generations.length);
      setProUsers(profiles.filter((item) => item.plan === "pro").length);
      setStudioUsers(profiles.filter((item) => item.plan === "studio").length);

      setRecentOrders((recentOrdersResult.data || []) as OrderRow[]);
      setRecentGenerations((recentGenerationsResult.data || []) as GenerationRow[]);

      setLoading(false);
    }

    loadAdminData();
  }, [adminEmails, locale, router]);

  const formatAmount = useMemo(
    () => (amount: number) => {
      if (isZh) {
        return `¥${(amount / 100).toFixed(2)}`;
      }
      return `$${(amount / 100).toFixed(2)}`;
    },
    [isZh]
  );

  const formatTime = useMemo(
    () => (value: string) => new Date(value).toLocaleString(),
    []
  );

  const formatPlan = useMemo(
    () => (plan: string) => {
      if (plan === "studio") return "Studio";
      if (plan === "pro") return "Pro";
      return "Free";
    },
    []
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "管理员数据加载中..." : "Loading admin data..."}
        </div>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8 text-center">
            <h1 className="text-3xl font-bold">
              {isZh ? "无权访问管理员后台" : "Access Denied"}
            </h1>
            <p className="mt-4 text-zinc-400">
              {isZh
                ? "当前账号不在管理员名单中。"
                : "Your account is not in the admin allowlist."}
            </p>
            <div className="mt-8">
              <Link
                href={`/${locale}/account`}
                className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black"
              >
                {isZh ? "返回账户中心" : "Back to Account"}
              </Link>
            </div>
          </div>
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
              {isZh ? "管理员后台" : "Admin Dashboard"}
            </div>
          </div>

          <div className="flex items-center gap-3">
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
            {isZh ? "运营数据概览" : "Operations Overview"}
          </div>

          <h1 className="text-4xl font-bold">
            {isZh ? "管理员数据面板" : "Admin Data Dashboard"}
          </h1>

          <p className="mt-3 text-zinc-400">
            {isZh
              ? "这里汇总全站用户、订单和生成数据，用于你后续做运营与商业分析。"
              : "This dashboard summarizes platform-wide user, order, and generation data for future operations and business analysis."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
            <div className="text-sm text-zinc-400">{isZh ? "总用户数" : "Total Users"}</div>
            <div className="mt-3 text-3xl font-semibold">{totalUsers}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
            <div className="text-sm text-zinc-400">{isZh ? "总订单数" : "Total Orders"}</div>
            <div className="mt-3 text-3xl font-semibold">{totalOrders}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
            <div className="text-sm text-zinc-400">{isZh ? "总生成次数" : "Total Generations"}</div>
            <div className="mt-3 text-3xl font-semibold">{totalGenerations}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
            <div className="text-sm text-zinc-400">{isZh ? "Pro 用户数" : "Pro Users"}</div>
            <div className="mt-3 text-3xl font-semibold">{proUsers}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
            <div className="text-sm text-zinc-400">{isZh ? "Studio 用户数" : "Studio Users"}</div>
            <div className="mt-3 text-3xl font-semibold">{studioUsers}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-xl font-semibold">
              {isZh ? "最近订单" : "Recent Orders"}
            </div>

            <div className="mt-6 space-y-4">
              {recentOrders.length === 0 ? (
                <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-400">
                  {isZh ? "暂无订单数据" : "No order data yet"}
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl bg-zinc-950 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{order.email || "-"}</div>
                        <div className="mt-1 text-sm text-zinc-400">
                          {formatTime(order.created_at)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatPlan(order.plan)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatAmount(order.amount)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {order.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-xl font-semibold">
              {isZh ? "最近生成记录" : "Recent Generations"}
            </div>

            <div className="mt-6 space-y-4">
              {recentGenerations.length === 0 ? (
                <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-400">
                  {isZh ? "暂无生成数据" : "No generation data yet"}
                </div>
              ) : (
                recentGenerations.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-zinc-950 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">
                          {item.file_name || (isZh ? "未命名文件" : "Untitled file")}
                        </div>
                        <div className="mt-1 text-sm text-zinc-400">
                          {(item.email || "-")} · {formatTime(item.created_at)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatPlan(item.plan)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {isZh ? "消耗" : "Cost"} {item.quota_cost}
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
        </div>
      </section>
    </main>
  );
}
