"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";

export default function BillingPage() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const plans = isZh
    ? [
        {
          name: "Pro",
          price: "¥99/月",
          desc: "适合个人创作者与小团队",
          features: ["每月 50 个剧本", "高级角色识别", "封面与爆点文案", "视频预览工作流"],
        },
        {
          name: "Studio",
          price: "¥399/月",
          desc: "适合工作室与内容团队",
          features: ["无限剧本处理", "团队协作", "后续 API 接入", "优先支持"],
        },
      ]
    : [
        {
          name: "Pro",
          price: "$19/month",
          desc: "Best for creators and small teams",
          features: ["50 scripts per month", "Advanced character extraction", "Hook & cover copy", "Video preview workflow"],
        },
        {
          name: "Studio",
          price: "$79/month",
          desc: "Best for studios and teams",
          features: ["Unlimited scripts", "Team collaboration", "Future API access", "Priority support"],
        },
      ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
            <div className="text-xs text-zinc-400">
              {isZh ? "套餐升级中心" : "Billing & Upgrade"}
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
        <div className="mb-10">
          <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
            {isZh ? "下一步可接 Stripe" : "Stripe Ready Next"}
          </div>

          <h1 className="text-4xl font-bold">
            {isZh ? "选择适合你的升级方案" : "Choose the right upgrade plan"}
          </h1>

          <p className="mt-3 max-w-3xl text-zinc-400">
            {isZh
              ? "当前是套餐升级页原型。下一步可以直接接入 Stripe Checkout，实现真实支付与自动升级。"
              : "This is the upgrade page prototype. Next, it can be connected directly to Stripe Checkout for real payments and automatic plan upgrades."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`rounded-3xl border p-6 ${
                index === 0
                  ? "border-emerald-400 bg-zinc-900 shadow-lg shadow-emerald-400/10"
                  : "border-white/10 bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-2xl font-semibold">{plan.name}</div>
                {index === 0 && (
                  <div className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-medium text-black">
                    {isZh ? "推荐" : "Popular"}
                  </div>
                )}
              </div>

              <div className="mt-4 text-4xl font-bold">{plan.price}</div>
              <div className="mt-3 text-zinc-400">{plan.desc}</div>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button className="mt-8 w-full rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-black transition hover:opacity-90">
                {isZh ? "立即升级" : "Upgrade Now"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6 text-sm text-zinc-400">
          {isZh
            ? "说明：当前按钮还是演示按钮。下一步我可以继续给你整文件替换版，直接接 Stripe 支付。"
            : "Note: These buttons are still demo buttons. Next, I can provide a full-file Stripe payment integration version."}
        </div>
      </section>
    </main>
  );
}
