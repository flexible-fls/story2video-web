"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import { supabase } from "@/lib/supabase";

export default function AccountPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/auth`);
        return;
      }

      setEmail(user.email || "");
      setLoading(false);
    }

    loadUser();
  }, [locale, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push(`/${locale}/auth`);
  }

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
            {isZh ? "账户系统已接入" : "Auth Connected"}
          </div>

          <h1 className="text-4xl font-bold">
            {isZh ? "欢迎来到你的账户中心" : "Welcome to Your Account"}
          </h1>

          <p className="mt-3 text-zinc-400">
            {isZh
              ? "这里将来可以扩展项目记录、额度消耗、套餐信息与账单管理。"
              : "This page can later be expanded with project history, usage quota, plans, and billing management."}
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
                <div className="mt-2 font-medium">Free</div>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "本月可用额度" : "Monthly Quota"}</div>
                <div className="mt-2 font-medium">{isZh ? "5 次生成" : "5 generations"}</div>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "状态" : "Status"}</div>
                <div className="mt-2 font-medium text-emerald-400">
                  {isZh ? "已登录" : "Signed In"}
                </div>
              </div>
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
                href={`/${locale}`}
                className="block rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-zinc-200"
              >
                {isZh ? "返回首页" : "Back Home"}
              </Link>

              <button
                onClick={handleLogout}
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-200"
              >
                {isZh ? "退出登录" : "Sign Out"}
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">
              {isZh
                ? "下一步可以继续接：用户额度、Stripe 订阅、项目历史记录。"
                : "Next, you can connect quota limits, Stripe subscriptions, and project history."}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
