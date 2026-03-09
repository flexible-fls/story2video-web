"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";

export default function AuthPage() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

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
            {isZh ? "账户系统 / 即将接入" : "Account System / Coming Soon"}
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            {isZh
              ? "登录 FulushouVideo，管理你的短剧项目与生成记录"
              : "Sign in to FulushouVideo and manage your drama projects and generation history"}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">
            {isZh
              ? "这是平台账户体系的第一版界面。后续可接入 Supabase、Clerk 或 Firebase，实现注册、登录、额度系统与订阅管理。"
              : "This is the first version of the account interface. It can later be connected to Supabase, Clerk, or Firebase for authentication, quota, and subscription management."}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <div className="text-sm text-zinc-400">
                {isZh ? "未来可用能力" : "Planned Capabilities"}
              </div>
              <div className="mt-3 text-lg font-semibold">
                {isZh ? "账户与项目管理" : "Account & Project Management"}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {isZh
                  ? "保存生成记录、查看项目历史、管理视频与分镜结果。"
                  : "Save generation history, manage projects, and review video or storyboard outputs."}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <div className="text-sm text-zinc-400">
                {isZh ? "未来可用能力" : "Planned Capabilities"}
              </div>
              <div className="mt-3 text-lg font-semibold">
                {isZh ? "额度与订阅系统" : "Quota & Subscription"}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {isZh
                  ? "支持 Free / Pro / Studio 套餐、生成次数限制与升级购买。"
                  : "Support Free / Pro / Studio plans, usage quotas, and subscription upgrades."}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/30">
          <div className="mb-6">
            <div className="text-2xl font-semibold">
              {isZh ? "登录 / 注册" : "Sign In / Register"}
            </div>
            <div className="mt-2 text-sm text-zinc-400">
              {isZh
                ? "当前为演示版表单，下一步可接入真实用户系统。"
                : "This is currently a demo form. Real authentication can be added next."}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                {isZh ? "邮箱地址" : "Email Address"}
              </label>
              <input
                type="email"
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
                placeholder={isZh ? "请输入密码" : "Enter your password"}
                className="h-12 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <button className="h-12 w-full rounded-xl bg-emerald-400 text-sm font-semibold text-black transition hover:opacity-90">
              {isZh ? "登录" : "Sign In"}
            </button>

            <button className="h-12 w-full rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white transition hover:bg-white/10">
              {isZh ? "创建新账户" : "Create Account"}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-zinc-900 px-3 text-xs text-zinc-500">
                  {isZh ? "或者使用第三方登录" : "Or continue with"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <button className="h-11 rounded-xl border border-white/10 bg-zinc-950 text-sm text-zinc-300 transition hover:bg-white/5">
                Google
              </button>
              <button className="h-11 rounded-xl border border-white/10 bg-zinc-950 text-sm text-zinc-300 transition hover:bg-white/5">
                GitHub
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">
            {isZh
              ? "提示：当前页面为产品原型。下一步如果你需要，我可以直接给你接入 Supabase 登录系统的整文件替换版。"
              : "Tip: This is currently a product prototype. Next, I can connect a real Supabase auth system with full-file replacement."}
          </div>
        </div>
      </section>
    </main>
  );
}
