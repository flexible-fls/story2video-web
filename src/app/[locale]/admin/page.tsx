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
  note?: string;
  user_tag?: string;
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

type TabKey = "overview" | "users" | "orders" | "generations" | "grant";

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
  const [deletingId, setDeletingId] = useState("");

  const [grantEmail, setGrantEmail] = useState("");
  const [grantPlan, setGrantPlan] = useState<"free" | "pro" | "studio">("pro");
  const [grantAmount, setGrantAmount] = useState("0");
  const [grantMethod, setGrantMethod] = useState("manual_grant");
  const [grantLoading, setGrantLoading] = useState(false);

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
              status: item.status,
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

  async function handleStatusUpdate(userId: string, nextStatus: "active" | "banned") {
    setUpdatingUserId(userId);
    setActionMessage("");

    const { error } = await supabase.rpc("admin_set_user_status", {
      target_user_id: userId,
      target_status: nextStatus,
    });

    if (error) {
      setActionMessage(
        isZh ? `状态修改失败：${error.message}` : `Status update failed: ${error.message}`
      );
      setUpdatingUserId("");
      return;
    }

    setProfiles((prev) =>
      prev.map((item) =>
        item.id === userId
          ? {
              ...item,
              status: nextStatus,
              user_tag: nextStatus === "banned" ? "blacklist" : item.user_tag,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    setActionMessage(
      isZh
        ? nextStatus === "banned"
          ? "用户已封禁"
          : "用户已恢复为正常状态"
        : nextStatus === "banned"
        ? "User has been banned"
        : "User has been restored to active status"
    );
    setUpdatingUserId("");
  }

  async function handleGrantPlan() {
    if (!grantEmail.trim()) {
      setActionMessage(isZh ? "请先填写用户邮箱" : "Please enter a user email first");
      return;
    }

    setGrantLoading(true);
    setActionMessage("");

    const amountNumber = Number(grantAmount || "0");

    const { error } = await supabase.rpc("admin_grant_plan", {
      target_user_email: grantEmail.trim(),
      target_plan: grantPlan,
      target_amount: Number.isFinite(amountNumber) ? amountNumber : 0,
      target_payment_method: grantMethod.trim() || "manual_grant",
    });

    if (error) {
      setActionMessage(
        isZh ? `补单失败：${error.message}` : `Grant failed: ${error.message}`
      );
      setGrantLoading(false);
      return;
    }

    setActionMessage(
      isZh
        ? `已成功给 ${grantEmail.trim()} 开通 ${formatPlan(grantPlan)}`
        : `Successfully granted ${formatPlan(grantPlan)} to ${grantEmail.trim()}`
    );

    setGrantEmail("");
    setGrantPlan("pro");
    setGrantAmount("0");
    setGrantMethod("manual_grant");
    setGrantLoading(false);

    await loadAdminData();
  }

  async function handleDeleteOrder(orderId: string) {
    const ok = window.confirm(
      isZh ? "确认删除这条订单记录吗？" : "Are you sure you want to delete this order?"
    );
    if (!ok) return;

    setDeletingId(orderId);
    setActionMessage("");

    const { error } = await supabase.rpc("admin_delete_order", {
      target_order_id: orderId,
    });

    if (error) {
      setActionMessage(
        isZh ? `删除订单失败：${error.message}` : `Failed to delete order: ${error.message}`
      );
      setDeletingId("");
      return;
    }

    setOrders((prev) => prev.filter((item) => item.id !== orderId));
    setActionMessage(isZh ? "订单记录已删除" : "Order deleted");
    setDeletingId("");
  }

  async function handleDeleteGeneration(generationId: string) {
    const ok = window.confirm(
      isZh ? "确认删除这条生成记录吗？" : "Are you sure you want to delete this generation?"
    );
    if (!ok) return;

    setDeletingId(generationId);
    setActionMessage("");

    const { error } = await supabase.rpc("admin_delete_generation", {
      target_generation_id: generationId,
    });

    if (error) {
      setActionMessage(
        isZh ? `删除生成记录失败：${error.message}` : `Failed to delete generation: ${error.message}`
      );
      setDeletingId("");
      return;
    }

    setGenerations((prev) => prev.filter((item) => item.id !== generationId));
    setActionMessage(isZh ? "生成记录已删除" : "Generation deleted");
    setDeletingId("");
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

  const formatStatus = useMemo(
    () => (status: string) => {
      if (status === "banned") {
        return isZh ? "已封禁" : "Banned";
      }
      if (status === "active") {
        return isZh ? "已生效" : "Active";
      }
      return status;
    },
    [isZh]
  );

  const formatTag = useMemo(
    () => (tag?: string) => {
      if (tag === "whitelist") return isZh ? "白名单" : "Whitelist";
      if (tag === "blacklist") return isZh ? "黑名单" : "Blacklist";
      return isZh ? "普通" : "Normal";
    },
    [isZh]
  );

  const normalizedSearch = search.trim().toLowerCase();

  const filteredProfiles = profiles.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      (item.email || "").toLowerCase().includes(normalizedSearch) ||
      (item.note || "").toLowerCase().includes(normalizedSearch) ||
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
              ? "查看全站用户、订单、生成情况，并支持搜索、筛选、改套餐、补单、封禁、删除测试数据和标签备注管理。"
              : "Review platform users, orders, and generations with search, filters, plan edits, grants, bans, cleanup tools, and tag/note management."}
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
              <button
                onClick={() => setActiveTab("grant")}
                className={`rounded-xl px-4 py-2 text-sm ${
                  activeTab === "grant"
                    ? "bg-emerald-400 text-black"
                    : "border border-white/10 bg-zinc-950 text-zinc-300"
                }`}
              >
                {isZh ? "手动补单" : "Manual Grant"}
              </button>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isZh ? "搜索邮箱 / 文件名 / 备注 / ID" : "Search email / file / note / ID"}
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
                      <div className="min-w-0">
                        <div className="font-medium">{item.email || "-"}</div>
                        <div className="mt-1 text-xs text-zinc-500">{item.id}</div>
                        {item.note && (
                          <div className="mt-2 text-sm text-zinc-400">
                            {isZh ? "备注：" : "Note: "} {item.note}
                          </div>
                        )}
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
                        <div
                          className={`rounded-full border px-3 py-1 ${
                            item.status === "banned"
                              ? "border-red-500/30 text-red-300"
                              : "border-white/10 text-zinc-300"
                          }`}
                        >
                          {formatStatus(item.status)}
                        </div>
                        <div
                          className={`rounded-full border px-3 py-1 ${
                            item.user_tag === "whitelist"
                              ? "border-blue-500/30 text-blue-300"
                              : item.user_tag === "blacklist"
                              ? "border-red-500/30 text-red-300"
                              : "border-white/10 text-zinc-300"
                          }`}
                        >
                          {formatTag(item.user_tag)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">
                          {formatTime(item.updated_at)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/${locale}/admin/users/${item.id}`}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200"
                      >
                        {isZh ? "查看详情" : "View Details"}
                      </Link>
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
                      {item.status === "banned" ? (
                        <button
                          onClick={() => handleStatusUpdate(item.id, "active")}
                          disabled={updatingUserId === item.id}
                          className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300 disabled:opacity-50"
                        >
                          {isZh ? "解封用户" : "Unban User"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusUpdate(item.id, "banned")}
                          disabled={updatingUserId === item.id}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 disabled:opacity-50"
                        >
                          {isZh ? "封禁用户" : "Ban User"}
                        </button>
                      )}
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

                    <div className="mt-4">
                      <button
                        onClick={() => handleDeleteOrder(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 disabled:opacity-50"
                      >
                        {isZh ? "删除订单" : "Delete Order"}
                      </button>
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

                    <div className="mt-4">
                      <button
                        onClick={() => handleDeleteGeneration(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 disabled:opacity-50"
                      >
                        {isZh ? "删除记录" : "Delete Record"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "grant" && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-4 text-xl font-semibold">
              {isZh ? "手动补单 / 赠送套餐" : "Manual Grant / Gift Plan"}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-zinc-950 p-5">
                <label className="mb-2 block text-sm text-zinc-400">
                  {isZh ? "用户邮箱" : "User Email"}
                </label>
                <input
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder={isZh ? "请输入用户邮箱" : "Enter user email"}
                  className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <label className="mb-2 block text-sm text-zinc-400">
                  {isZh ? "套餐类型" : "Plan Type"}
                </label>
                <select
                  value={grantPlan}
                  onChange={(e) => setGrantPlan(e.target.value as "free" | "pro" | "studio")}
                  className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-sm text-white outline-none"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="studio">Studio</option>
                </select>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <label className="mb-2 block text-sm text-zinc-400">
                  {isZh ? "订单金额（分）" : "Order Amount (cents)"}
                </label>
                <input
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  placeholder={isZh ? "例如 9900 / 39900 / 0" : "For example 9900 / 39900 / 0"}
                  className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <label className="mb-2 block text-sm text-zinc-400">
                  {isZh ? "支付方式标记" : "Payment Method Label"}
                </label>
                <input
                  value={grantMethod}
                  onChange={(e) => setGrantMethod(e.target.value)}
                  placeholder={isZh ? "例如 manual_grant / offline / wechat_manual" : "For example manual_grant / offline / wechat_manual"}
                  className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-zinc-950 p-5 text-sm text-zinc-400">
              {isZh
                ? "说明：执行后会同时更新用户套餐，并自动写入一条 paid 订单记录。适合人工收款、赠送体验或补单场景。"
                : "Note: This updates the user's plan and also inserts a paid order record. Good for offline payments, gifts, or manual fulfillment."}
            </div>

            <div className="mt-6">
              <button
                onClick={handleGrantPlan}
                disabled={grantLoading}
                className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
              >
                {grantLoading
                  ? isZh
                    ? "处理中..."
                    : "Processing..."
                  : isZh
                  ? "确认补单 / 开通套餐"
                  : "Grant Plan Now"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
