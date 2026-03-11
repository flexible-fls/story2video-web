"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import { supabase } from "@/lib/supabase";
import type { Locale } from "@/lib/i18n";

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale: Locale = pathname.startsWith("/en") ? "en" : "zh";

  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  const isHomePage = pathname === `/${locale}`;
  const isAccountPage = pathname === `/${locale}/account`;

  const navTexts = useMemo(
    () => ({
      home: locale === "zh" ? "首页" : "Home",
      generate: locale === "zh" ? "开始生成" : "Generate",
      jobs: locale === "zh" ? "我的任务" : "My Jobs",
      account: locale === "zh" ? "账户中心" : "Account",
      admin: locale === "zh" ? "管理员入口" : "Admin",
      subtitle:
        locale === "zh"
          ? "AI 短剧与漫剧生成平台"
          : "AI Drama & Comic Video Studio",
      backHome: locale === "zh" ? "返回首页" : "Back Home",
    }),
    [locale]
  );

  useEffect(() => {
    let active = true;

    async function checkAdminStatus() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const adminEmails =
          process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",")
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean) ?? [];

        const currentUserEmail = user?.email?.trim().toLowerCase() ?? "";

        if (!active) return;

        setIsAdmin(
          Boolean(
            currentUserEmail &&
              adminEmails.length > 0 &&
              adminEmails.includes(currentUserEmail)
          )
        );
      } finally {
        if (active) {
          setLoadingAdmin(false);
        }
      }
    }

    checkAdminStatus();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-white">
      {!isHomePage && (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070b]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <div className="flex min-w-0 items-center gap-4">
              <Link href={`/${locale}`} className="group flex min-w-0 flex-col">
                <span className="text-lg font-semibold tracking-tight text-white transition group-hover:text-emerald-300">
                  FulushouVideo
                </span>
                <span className="text-xs text-zinc-400">
                  {navTexts.subtitle}
                </span>
              </Link>

              <nav className="hidden items-center gap-2 md:flex">
                <Link
                  href={`/${locale}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  {navTexts.home}
                </Link>
                <Link
                  href={`/${locale}/generate`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  {navTexts.generate}
                </Link>
                <Link
                  href={`/${locale}/jobs`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  {navTexts.jobs}
                </Link>
                <Link
                  href={`/${locale}/account`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  {navTexts.account}
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitch locale={locale} />

              <Link
                href={`/${locale}`}
                className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/15 hover:text-emerald-200 md:hidden"
              >
                {navTexts.backHome}
              </Link>
            </div>
          </div>

          {!loadingAdmin && isAdmin && isAccountPage && (
            <div className="border-t border-white/5">
              <div className="mx-auto flex max-w-7xl justify-end px-6 py-3">
                <Link
                  href={`/${locale}/admin`}
                  className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-400/15"
                >
                  {navTexts.admin}
                </Link>
              </div>
            </div>
          )}
        </header>
      )}

      <main className={isHomePage ? "" : "mx-auto max-w-7xl px-6 py-8"}>
        {children}
      </main>
    </div>
  );
}