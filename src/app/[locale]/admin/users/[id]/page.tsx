"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
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
  user_id: string;
  email: string | null;
  plan: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
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

export default function AdminUserDetailPage() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";
  const userId = params.id;

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [generations, setGenerations] = useState<GenerationRow[]>([]);
  const [actionMessage, setActionMessage] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadUserDetail();
  }, [locale, router, userId]);

  async function loadUserDetail() {
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

    const [{ data: profileData }, { data: orderData }, { data: generationData }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("generations").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

    setProfile((profileData as ProfileRow) || null);
    setOrders((orderData as OrderRow[]) || []);
    setGenerations((generationData as GenerationRow[]) || []);
    setLoading(false);
  }

  async function handleStatusUpdate(nextStatus: "active" | "banned") {
    if (!profile) return;

    setUpdating(true);
    setActionMessage("");

    const { error } = await supabase.rpc("admin_set_user_status", {
      target_user_id: profile.id,
      target_status: nextStatus,
    });

    if (error) {
      setActionMessage(
        isZh ? `状态修改失败：${error.message}` : `Status update failed: ${error.message}`
      );
      setUpdating(false);
      return;
    }

    setProfile({
      ...profile,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    });

    setActionMessage(
      isZh
        ? nextStatus === "banned"
          ? "用户已封禁"
          : "用户已恢复为正常状态"
        : nextStatus === "banned"
        ? "User has been banned"
        : "User has been restored to active status"
    );

    setUpdating(false);
  }

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
    () => (value: string) => new Date(value).toLocaleString(),
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

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "加载中..." : "Loading..."}
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
              {isZh ? "用户详情" : "User Detail"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/admin`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300"
            >
              {isZh ? "返回管理员后台" : "Back to Admin"}
            </Link>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            {isZh ? "单个用户详情" : "Single User Detail"}
          </h1>
          <p className="mt-3 text-zinc-400">
            {isZh
              ? "查看该用户的当前套餐、账户状态、订单历史和生成记录。"
              : "Review this user's plan, account status, order history, and generation records."}
          </p>
        </div>

        {actionMessage && (
          <div className="mb-6 rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-emerald-300">
            {actionMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-4 text-xl font-semibold">
              {isZh ? "基础信息" : "Basic Information"}
            </div>

            {!profile ? (
              <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-400">
                {isZh ? "未找到用户资料" : "User profile not found"}
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-950 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "邮箱" : "Email"}</div>
                    <div className="mt-2 font-medium">{profile.email || "-"}</div>
                  </div>

                  <div className="rounded-2xl bg-zinc-950 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "当前套餐" : "Current Plan"}</div>
                    <div className="mt-2 font-medium">{formatPlan(profile.plan)}</div>
                  </div>

                  <div className="rounded-2xl bg-zinc-950 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "额度使用" : "Quota Usage"}</div>
                    <div className="mt-2 font-medium">
                      {profile.plan === "studio"
                        ? isZh
                          ? "无限"
                          : "Unlimited"
                        : `${profile.used_count} / ${profile.monthly_quota}`}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-zinc-950 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "状态" : "Status"}</div>
                    <div
                      className={`mt-2 font-medium ${
                        profile.status === "banned" ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {formatStatus(profile.status)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {profile.status === "banned" ? (
                    <button
                      onClick={() => handleStatusUpdate("active")}
                      disabled={updating}
                      className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300 disabled:opacity-50"
                    >
                      {isZh ? "解封用户" : "Unban User"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusUpdate("banned")}
                      disabled={updating}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 disabled:opacity-50"
                    >
                      {isZh ? "封禁用户" : "Ban User"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-4 text-xl font-semibold">
              {isZh ? "统计摘要" : "Summary"}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "订单数" : "Order Count"}</div>
                <div className="mt-2 text-3xl font-bold">{orders.length}</div>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "生成次数" : "Generation Count"}</div>
                <div className="mt-2 text-3xl font-bold">{generations.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-4 text-xl font-semibold">
              {isZh ? "订单历史" : "Order History"}
            </div>

            {orders.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-400">
                {isZh ? "暂无订单记录" : "No orders yet"}
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-zinc-950 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{formatPlan(item.plan)}</div>
                        <div className="mt-1 text-xs text-zinc-500">{item.id}</div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
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
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-4 text-xl font-semibold">
              {isZh ? "生成历史" : "Generation History"}
            </div>

            {generations.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-400">
                {isZh ? "暂无生成记录" : "No generation records yet"}
              </div>
            ) : (
              <div className="space-y-4">
                {generations.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-zinc-950 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">
                          {item.file_name || (isZh ? "未命名文件" : "Untitled file")}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">{item.id}</div>
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
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
