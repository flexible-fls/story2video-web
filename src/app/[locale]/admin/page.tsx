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

type GenerationRow = {
  id: string;
  user_id: string;
  email: string | null;
  file_name: string | null;
  plan: string;
  quota_cost: number;
  status: string;
  created_at: string;
};

type OrderRow = {
  id: string;
  user_id: string;
  email: string | null;
  plan: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
};

type TabKey = "overview" | "users" | "orders" | "generations";

export default function AdminPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [generations, setGenerations] = useState<GenerationRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [actionMessage, setActionMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");

  useEffect(() => {
    loadAdminData();
  }, [locale, router]);

  async function loadAdminData() {
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

    const [{ data: profileData }, { data: generationData }, { data: orderData }] =
      await Promise.all([
        supabase.from("profiles").select("*").order("updated_at", { ascending: false }),
        supabase.from("generations").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
      ]);

    setProfiles((profileData as ProfileRow[]) || []);
    setGenerations((generationData as GenerationRow[]) || []);
    setOrders((orderData as OrderRow[]) || []);
    setLoading(false);
  }

  async function handlePlanUpdate(userId: string, nextPlan: "free" | "pro" | "studio") {
    setUpdatingUserId(userId);
    setActionMessage("");

    const { error } = await supabase.rpc("admin_update_user_plan", {
      target_user_id: userId,
      target_plan: nextPlan,
    });

    if (error) {
      setActionMessage(
        isZh ? `修改失败：${error.message}` : `Update failed: ${error.message}`
      );
      setUpdatingUserId("");
      return;
    }

    setProfiles((prev) =>
      prev.map((item) =>
        item.id === userId
          ? {
              ...item,
              plan: nextPlan,
              monthly_quota: nextPlan === "studio" ? 999999 : nextPlan === "pro" ? 50 : 5,
              used_count: 0,
              status: "active",
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    setActionMessage(
      isZh ? `已成功修改用户套餐为 ${formatPlan(nextPlan)}` : `Plan updated to ${formatPlan(nextPlan)}`
    );
    setUpdatingUserId("");
  }

  const totalUsers = profiles.length;
  const totalGenerations = generations.length;
  const paidUsers = profiles.filter((item) => item.plan !== "free").length;
  const totalRevenue = orders
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const recentGenerations = generations.slice(0, 8);
  const recentOrders = orders.slice(0, 8);

  const formatPlan = useMemo(
    () => (plan: string) => {
      if (plan === "studio") return "Studio";
      if (plan === "pro") return "Pro";
      return "Free";
    },
    []
  );

  const formatMoney = useMemo(
    () => (amount: number) => {
      if (isZh) {
        return `¥${(amount / 100).toFixed(2)}`;
      }
      return `$${(amount / 100).toFixed(2)}`;
    },
    [isZh]
  );

  const formatTime = useMemo(
    () => (value: string) => {
      return new Date(value).toLocaleString();
    },
    []
  );

  const normalizedSearch = search.trim().toLowerCase();

  const filteredProfiles = profiles.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      (item.email || "").toLowerCase().includes(normalizedSearch) ||
      item.id.toLowerCase().includes(normalizedSearch);

    const matchesPlan = planFilter === "all" || item.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const filteredOrders = orders.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      (item.email || "").toLowerCase().includes(normalizedSearch) ||
      item.id.toLowerCase().includes(normalizedSearch);

    const matchesPlan = planFilter === "all" || item.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const filteredGenerations = generations.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      (item.email || "").toLowerCase().includes(normalizedSearch) ||
      (item.file_name || "").toLowerCase().includes(normalizedSearch) ||
      item.id.toLowerCase().includes(normalizedSearch);

    const matchesPlan = planFilter === "all" || item.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "管理员数据加载中..." : "Loading admin data..."}
        </div>
      </main>
    );
  }

  if (!allowed) {
    return null;
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
            {isZh ? "平台运营概览" : "Platform Overview"}
          </div>

          <h1 className="text-4xl font-bold">
            {isZh ? "管理员后台首页" : "Admin Home"}
          </h1>

          <p className="mt-3 text-zinc-400">
            {isZh
              ? "查看全站用户、订单、生成情况，并支持基础搜索、套餐筛选和手动修改用户套餐。"
              : "Review platform users, orders, and generations with search, plan filters, and manual plan updates."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400">{isZh ? "总用户数" : "Total Users"}</div>
            <div className="mt-3 text-4xl font-bold">{totalUsers}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400">{isZh ? "总生成次数" : "Total Generations"}</div>
            <div className="mt-3 text-4xl font-bold">{totalGenerations}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400">{isZh ? "付费用户数" : "Paid Users"}</div>
            <div className="mt-3 text-4xl font-bold">{paidUsers}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400">{isZh ? "累计收入" : "Total Revenue"}</div>
            <div className="mt-3 text-4xl font-bold">{formatMoney(totalRevenue)}</div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`rounded-xl px-4 py-2 text-sm ${
                  activeTab === "overview"
                    ? "bg-emerald-400 text-black"
                    : "border border-white/10 bg-zinc-950 text-zinc-300"
                }`}
              >
                {isZh ? "概览" : "Overview"}
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`rounded-xl px-4 py-2 text-sm ${
                  activeTab === "users"
                    ? "bg-emerald-400 text-black"
                    : "border border-white/10 bg-zinc-950 text-zinc-300"
                }`}
              >
                {isZh ? "用户列表" : "Users"}
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`rounded-xl px-4 py-2 text-sm ${
                  activeTab === "orders"
                    ? "bg-emerald-400 text-black"
                    : "border border-white/10 bg-zinc-950 text-zinc-300"
                }`}
              >
                {isZh ? "订单列表" : "Orders"}
              </button>
              <button
                onClick={() => setActiveTab("generations")}
                className={`rounded-xl px-4 py-2 text-sm ${
                  activeTab === "generations"
                    ? "bg-emerald-400 text-black"
                    : "border border-white/10 bg-zinc-950 text-zinc-300"
                }`}
              >
                {isZh ? "生成记录" : "Generations"}
              </button>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isZh ? "搜索邮箱 / 文件名 / ID" : "Search email / file / ID"}
                className="h-10 rounded-xl border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none"
              >
                <option value="all">{isZh ? "全部套餐" : "All Plans"}</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="studio">Studio</option>
              </select>
            </div>
          </div>

          {actionMessage && (
            <div className="mt-4 rounded-2xl bg-zinc-950 px-4 py-3 text-sm text-emerald-300">
              {actionMessage}
            </div>
          )}
        </div>

        {activeTab === "overview" && (
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="mb-4 text-xl font-semibold">
                {isZh ? "最近生成记录" : "Recent Generations"}
              </div>

              {recentGenerations.length === 0 ? (
                <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-400">
                  {isZh ? "暂无生成记录" : "No generation records yet"}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentGenerations.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-zinc-950 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-medium">
                            {item.file_name || (isZh ? "未命名文件" : "Untitled file")}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {item.email || "-"}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                            {formatPlan(item.plan)}
                          </div>
                          <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                            {isZh ? "消耗" : "Cost"}: {item.quota_cost}
                          </div>
                          <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                            {formatTime(item.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="mb-4 text-xl font-semibold">
                {isZh ? "最近订单记录" : "Recent Orders"}
              </div>

              {recentOrders.length === 0 ? (
                <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-400">
                  {isZh ? "暂无订单记录" : "No order records yet"}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-zinc-950 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-medium">{formatPlan(item.plan)}</div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {item.email || "-"}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                            {formatMoney(item.amount)}
                          </div>
                          <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                            {item.status}
                          </div>
                          <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                            {formatTime(item.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-4 text-xl font-semibold">
              {isZh ? "用户列表" : "User List"}
            </div>

            <div className="space-y-4">
              {filteredProfiles.length === 0 ? (
                <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-400">
                  {isZh ? "没有匹配用户" : "No matching users"}
                </div>
              ) : (
                filteredProfiles.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-zinc-950 p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="font-medium">{item.email || "-"}</div>
                        <div className="mt-1 text-xs text-zinc-500">{item.id}</div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatPlan(item.plan)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {isZh ? "额度" : "Quota"}:{" "}
                          {item.plan === "studio"
                            ? isZh
                              ? "无限"
                              : "Unlimited"
                            : `${item.used_count} / ${item.monthly_quota}`}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {item.status}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatTime(item.updated_at)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handlePlanUpdate(item.id, "free")}
                        disabled={updatingUserId === item.id}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
                      >
                        {isZh ? "设为 Free" : "Set Free"}
                      </button>
                      <button
                        onClick={() => handlePlanUpdate(item.id, "pro")}
                        disabled={updatingUserId === item.id}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
                      >
                        {isZh ? "设为 Pro" : "Set Pro"}
                      </button>
                      <button
                        onClick={() => handlePlanUpdate(item.id, "studio")}
                        disabled={updatingUserId === item.id}
                        className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300 disabled:opacity-50"
                      >
                        {isZh ? "设为 Studio" : "Set Studio"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-4 text-xl font-semibold">
              {isZh ? "订单列表" : "Order List"}
            </div>

            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-400">
                  {isZh ? "没有匹配订单" : "No matching orders"}
                </div>
              ) : (
                filteredOrders.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-zinc-950 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{item.email || "-"}</div>
                        <div className="mt-1 text-xs text-zinc-500">{item.id}</div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatPlan(item.plan)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatMoney(item.amount)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {item.payment_method}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {item.status}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatTime(item.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "generations" && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-4 text-xl font-semibold">
              {isZh ? "生成记录列表" : "Generation List"}
            </div>

            <div className="space-y-4">
              {filteredGenerations.length === 0 ? (
                <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-400">
                  {isZh ? "没有匹配生成记录" : "No matching generation records"}
                </div>
              ) : (
                filteredGenerations.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-zinc-950 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">
                          {item.file_name || (isZh ? "未命名文件" : "Untitled file")}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {item.email || "-"} · {item.id}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatPlan(item.plan)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {isZh ? "消耗" : "Cost"}: {item.quota_cost}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {item.status}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatTime(item.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
