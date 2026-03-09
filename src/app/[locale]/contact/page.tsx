"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";

export default function ContactPage() {
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
              {isZh ? "商务合作" : "Contact Sales"}
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

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8">
          <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
            {isZh ? "企业方案 / 工作室方案" : "Studio / Enterprise"}
          </div>

          <h1 className="text-4xl font-bold">
            {isZh ? "联系商务，获取团队与定制方案" : "Contact sales for team and custom plans"}
          </h1>

          <p className="mt-4 max-w-3xl text-zinc-400">
            {isZh
              ? "如果你需要更高额度、团队协作、私有部署、API 能力或定制化工作流，可以通过下面的方式联系商务。"
              : "If you need higher quotas, team collaboration, private deployment, API access, or custom workflows, contact sales below."}
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-zinc-950 p-6">
              <div className="text-sm text-zinc-400">{isZh ? "联系邮箱" : "Email"}</div>
              <div className="mt-2 text-lg font-semibold">sales@fulushouvideo.com</div>
            </div>

            <div className="rounded-2xl bg-zinc-950 p-6">
              <div className="text-sm text-zinc-400">{isZh ? "建议主题" : "Suggested Subject"}</div>
              <div className="mt-2 text-lg font-semibold">
                {isZh ? "FulushouVideo Studio Plan" : "FulushouVideo Studio Plan"}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-zinc-950 p-6">
            <div className="text-lg font-semibold">
              {isZh ? "你可以在邮件里说明：" : "You can include in your email:"}
            </div>

            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              <div>• {isZh ? "团队规模" : "Team size"}</div>
              <div>• {isZh ? "每月预计剧本数量" : "Estimated scripts per month"}</div>
              <div>• {isZh ? "是否需要 API / 私有部署" : "Whether you need API / private deployment"}</div>
              <div>• {isZh ? "是否需要定制工作流" : "Whether you need a custom workflow"}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
