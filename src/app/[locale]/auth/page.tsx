"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LanguageSwitch from "@/components/LanguageSwitch";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUser(user?.email ?? null);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user?.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit() {
    if (!email || !password) {
      setMessage(isZh ? "请填写邮箱和密码" : "Please fill in email and password");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
        } else {
          setMessage(
            isZh
              ? "注册成功，请检查邮箱验证链接。"
              : "Sign up successful. Please check your email for verification."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
        } else {
          setMessage(isZh ? "登录成功，正在跳转..." : "Signed in successfully, redirecting...");
          setTimeout(() => {
            router.push(`/${locale}/account`);
          }, 700);
        }
      }
    } catch {
      setMessage(isZh ? "请求失败，请稍后重试" : "Request failed, please try again later");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setMessage(isZh ? "已退出登录" : "Signed out");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
            <div className="text-xs text-zinc-400">
              {isZh ? "AI 短剧与漫剧生产平台" : "AI Drama & Comic Video Studio"}
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

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1fr_460px] lg:items-center">
        <div>
          <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
            {isZh ? "Supabase 账户系统" : "Supabase Auth System"}
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            {isZh
              ? "登录 FulushouVideo，管理你的短剧项目与生成记录"
              : "Sign in to FulushouVideo and manage your drama projects and generation history"}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">
            {isZh
              ? "当前已接入真实 Supabase 邮箱注册与登录。下一步可继续扩展用户额度、付费订阅与项目管理。"
              : "Real Supabase email sign-up and sign-in are now connected. Next, you can extend quotas, subscriptions, and project management."}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <div className="text-sm text-zinc-400">
                {isZh ? "当前能力" : "Current Capability"}
              </div>
              <div className="mt-3 text-lg font-semibold">
                {isZh ? "邮箱注册 / 登录" : "Email Sign Up / Sign In"}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {isZh
                  ? "支持邮箱注册、邮箱密码登录与退出登录。"
                  : "Supports email sign-up, password sign-in, and logout."}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <div className="text-sm text-zinc-400">
                {isZh ? "下一步可扩展" : "Next Upgrade"}
              </div>
              <div className="mt-3 text-lg font-semibold">
                {isZh ? "用户额度与订阅" : "Quota & Subscription"}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {isZh
                  ? "后续可直接接 Stripe 与套餐系统。"
                  : "Can be extended directly with Stripe and paid plans."}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/30">
          <div className="mb-6">
            <div className="text-2xl font-semibold">
              {mode === "signin"
                ? isZh
                  ? "登录账户"
                  : "Sign In"
                : isZh
                ? "创建账户"
                : "Create Account"}
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              {currentUser
                ? isZh
                  ? `当前已登录：${currentUser}`
                  : `Signed in as: ${currentUser}`
                : isZh
                ? "使用邮箱和密码进行登录或注册。"
                : "Use email and password to sign in or create an account."}
            </div>
          </div>

          <div className="mb-5 flex rounded-2xl bg-zinc-950 p-1">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium ${
                mode === "signin" ? "bg-white text-black" : "text-zinc-300"
              }`}
            >
              {isZh ? "登录" : "Sign In"}
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium ${
                mode === "signup" ? "bg-white text-black" : "text-zinc-300"
              }`}
            >
              {isZh ? "注册" : "Sign Up"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                {isZh ? "邮箱地址" : "Email Address"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isZh ? "请输入你的邮箱" : "Enter your email"}
                className="h-12 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                {isZh ? "密码" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isZh ? "请输入密码" : "Enter your password"}
                className="h-12 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="h-12 w-full rounded-xl bg-emerald-400 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
            >
              {loading
                ? isZh
                  ? "处理中..."
                  : "Processing..."
                : mode === "signin"
                ? isZh
                  ? "登录"
                  : "Sign In"
                : isZh
                ? "创建账户"
                : "Create Account"}
            </button>

            {currentUser && (
              <button
                onClick={handleLogout}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {isZh ? "退出登录" : "Sign Out"}
              </button>
            )}
          </div>

          {message && (
            <div className="mt-5 rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-300">
              {message}
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">
            {isZh
              ? "提示：如果你在 Supabase 后台开启了邮箱验证，注册后需要去邮箱确认。"
              : "Tip: If email confirmation is enabled in Supabase, you need to verify your email after signing up."}
          </div>
        </div>
      </section>
    </main>
  );
}
