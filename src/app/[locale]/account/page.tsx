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

export default function AccountPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserAndProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/auth`);
        return;
      }

      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile(data as ProfileRow);
      } else {
        setProfile({
          id: user.id,
          email: user.email || "",
          plan: "free",
          monthly_quota: 5,
          used_count: 0,
          status: "active",
          updated_at: new Date().toISOString(),
        });
      }

      setLoading(false);
    }

    loadUserAndProfile();
  }, [locale, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push(`/${locale}/auth`);
  }

  const planLabel = useMemo(() => {
    const currentPlan = profile?.plan || "free";
    if (currentPlan === "studio") return "Studio";
    if (currentPlan === "pro") return "Pro";
    return "Free";
  }, [profile]);

  const quotaLabel = useMemo(() => {
    const currentPlan = profile?.plan || "free";
    if (currentPlan === "studio") {
      return isZh ? "无限" : "Unlimited";
    }
    return `${profile?.used_count ?? 0} / ${profile?.monthly_quota ?? 5}`;
  }, [profile, isZh]);

  const statusLabel = useMemo(() => {
    if (profile?.status === "active") {
      return isZh ? "已生效" : "Active";
    }
    return profile?.status || (isZh ? "未知" : "Unknown");
  }, [profile, isZh]);

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
              {isZh ? "用户中心" : "Account Center"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {isZh ? "返回首页" : "Back Home"}
            </Link>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-8">
          <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
            {isZh ? "账户与套餐状态" : "Account & Subscription Status"}
          </div>

          <h1 className="text-4xl font-bold">
            {isZh ? "欢迎来到你的账户中心" : "Welcome to Your Account"}
          </h1>

          <p className="mt-3 text-zinc-400">
            {isZh
              ? "这里会显示当前套餐、额度消耗、账户状态和订单入口。"
              : "This page shows your current plan, quota usage, account status, and order entry."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6 lg:col-span-2">
            <div className="text-xl font-semibold">
              {isZh ? "账户信息" : "Account Information"}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "邮箱" : "Email"}</div>
                <div className="mt-2 font-medium">{email}</div>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "当前套餐" : "Current Plan"}</div>
                <div className="mt-2 font-medium">{planLabel}</div>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "额度使用情况" : "Quota Usage"}</div>
                <div className="mt-2 font-medium">{quotaLabel}</div>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "状态" : "Status"}</div>
                <div className="mt-2 font-medium text-emerald-400">{statusLabel}</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-zinc-950 p-5 text-sm text-zinc-400">
              {isZh
                ? "说明：每次点击首页“开始生成”都会自动检查并扣减额度。Studio 套餐为无限额度。"
                : "Note: Each click on 'Start Generating' will automatically check and deduct usage quota. Studio plan has unlimited quota."}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-xl font-semibold">
              {isZh ? "快捷操作" : "Quick Actions"}
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href={`/${locale}`}
                className="block rounded-xl bg-emerald-400 px-4 py-3 text-center text-sm font-semibold text-black"
              >
                {isZh ? "开始新项目" : "Start New Project"}
              </Link>

              <Link
                href={`/${locale}/billing`}
                className="block rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-zinc-200"
              >
                {isZh ? "升级套餐" : "Upgrade Plan"}
              </Link>

              <Link
                href={`/${locale}/orders`}
                className="block rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-zinc-200"
              >
                {isZh ? "订单记录" : "Order History"}
              </Link>

              <button
                onClick={handleLogout}
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-200"
              >
                {isZh ? "退出登录" : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
