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
  note?: string;
  user_tag?: string;
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
  const [deletingId, setDeletingId] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [tagInput, setTagInput] = useState<"normal" | "whitelist" | "blacklist">("normal");

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

    const p = (profileData as ProfileRow) || null;
    setProfile(p);
    setNoteInput(p?.note || "");
    setTagInput((p?.user_tag as "normal" | "whitelist" | "blacklist") || "normal");

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
      user_tag: nextStatus === "banned" ? "blacklist" : profile.user_tag,
      updated_at: new Date().toISOString(),
    });

    if (nextStatus === "banned") {
      setTagInput("blacklist");
    }

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

  async function handleMetaSave() {
    if (!profile) return;

    setUpdating(true);
    setActionMessage("");

    const { error } = await supabase.rpc("admin_update_user_meta", {
      target_user_id: profile.id,
      target_note: noteInput,
      target_user_tag: tagInput,
    });

    if (error) {
      setActionMessage(
        isZh ? `保存失败：${error.message}` : `Save failed: ${error.message}`
      );
      setUpdating(false);
      return;
    }

    setProfile({
      ...profile,
      note: noteInput,
      user_tag: tagInput,
      status: tagInput === "blacklist" ? "banned" : "active",
      updated_at: new Date().toISOString(),
    });

    setActionMessage(isZh ? "备注和标签已保存" : "Note and tag saved");
    setUpdating(false);
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

  const formatTag = useMemo(
    () => (tag?: string) => {
      if (tag === "whitelist") return isZh ? "白名单" : "Whitelist";
      if (tag === "blacklist") return isZh ? "黑名单" : "Blacklist";
      return isZh ? "普通" : "Normal";
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
              ? "查看该用户的当前套餐、账户状态、订单历史、生成记录和运营备注。"
              : "Review this user's plan, account status, order history, generation records, and internal notes."}
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

                  <div className="rounded-2xl bg-zinc-950 p-5 md:col-span-2">
                    <div className="text-sm text-zinc-400">{isZh ? "用户标签" : "User Tag"}</div>
                    <div className="mt-2 font-medium">{formatTag(profile.user_tag)}</div>
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
              {isZh ? "备注与标签" : "Note & Tag"}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-zinc-950 p-5">
                <label className="mb-2 block text-sm text-zinc-400">
                  {isZh ? "内部备注" : "Internal Note"}
                </label>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none"
                  placeholder={isZh ? "写下这个用户的情况，例如：大客户 / 测试号 / 需重点跟进" : "Write notes for this user, e.g. VIP / testing account / follow up"}
                />
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <label className="mb-2 block text-sm text-zinc-400">
                  {isZh ? "用户标签" : "User Tag"}
                </label>
                <select
                  value={tagInput}
                  onChange={(e) =>
                    setTagInput(e.target.value as "normal" | "whitelist" | "blacklist")
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-sm text-white outline-none"
                >
                  <option value="normal">{isZh ? "普通" : "Normal"}</option>
                  <option value="whitelist">{isZh ? "白名单" : "Whitelist"}</option>
                  <option value="blacklist">{isZh ? "黑名单" : "Blacklist"}</option>
                </select>
              </div>

              <button
                onClick={handleMetaSave}
                disabled={updating}
                className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
              >
                {isZh ? "保存备注与标签" : "Save Note & Tag"}
              </button>
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
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
