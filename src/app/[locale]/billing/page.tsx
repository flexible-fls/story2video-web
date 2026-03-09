"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";

type Plan = {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  badge?: string;
  checkoutQuery: string;
};

export default function BillingPage() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const plans: Plan[] = isZh
    ? [
        {
          name: "Pro",
          price: "¥99",
          period: "/月",
          desc: "适合个人创作者与轻量团队",
          features: [
            "每月 50 个剧本",
            "高级角色识别",
            "封面与爆点文案",
            "视频预览工作流",
            "优先功能更新",
          ],
          badge: "推荐",
          checkoutQuery: "pro-monthly",
        },
        {
          name: "Studio",
          price: "¥399",
          period: "/月",
          desc: "适合工作室与内容团队",
          features: [
            "无限剧本处理",
            "团队协作能力",
            "后续 API 接入",
            "优先支持",
            "更高并发与定制扩展",
          ],
          checkoutQuery: "studio-monthly",
        },
      ]
    : [
        {
          name: "Pro",
          price: "$19",
          period: "/month",
          desc: "Best for creators and small teams",
          features: [
            "50 scripts per month",
            "Advanced character extraction",
            "Hook & cover copy",
            "Video preview workflow",
            "Priority feature updates",
          ],
          badge: "Popular",
          checkoutQuery: "pro-monthly",
        },
        {
          name: "Studio",
          price: "$79",
          period: "/month",
          desc: "Best for studios and production teams",
          features: [
            "Unlimited scripts",
            "Team collaboration",
            "Future API access",
            "Priority support",
            "Higher concurrency and custom scaling",
          ],
          checkoutQuery: "studio-monthly",
        },
      ];

  const faqs = isZh
    ? [
        {
          q: "现在可以真实支付了吗？",
          a: "当前页面已经完成结算结构，下一步只需要接入 Stripe 即可开启真实支付。",
        },
        {
          q: "套餐升级后会有什么变化？",
          a: "后续可绑定用户额度、可用次数、项目管理能力以及团队权限。",
        },
        {
          q: "Studio 套餐支持定制吗？",
          a: "支持，Studio 后续可扩展为商务套餐、私有部署、API 与定制工作流。",
        },
      ]
    : [
        {
          q: "Can real payments be enabled now?",
          a: "The checkout structure is ready. The next step is connecting Stripe for real payments.",
        },
        {
          q: "What changes after upgrading?",
          a: "Plans can later be tied to user quotas, usage limits, project management, and team permissions.",
        },
        {
          q: "Can Studio be customized?",
          a: "Yes. Studio can later expand into enterprise plans, private deployment, API, and custom workflows.",
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
            {isZh ? "Stripe 接入准备版" : "Stripe-Ready Upgrade Flow"}
          </div>

          <h1 className="text-4xl font-bold">
            {isZh ? "选择适合你的升级方案" : "Choose the plan that fits you"}
          </h1>

          <p className="mt-3 max-w-3xl text-zinc-400">
            {isZh
              ? "当前页面已升级为可接支付的套餐结构。下一步只需要接入 Stripe Checkout，即可实现真实订阅、自动扣费与账户升级。"
              : "This page is now upgraded into a payment-ready subscription structure. The next step is connecting Stripe Checkout for real subscriptions, billing, and plan upgrades."}
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
                {plan.badge && (
                  <div className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-medium text-black">
                    {plan.badge}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-end gap-1">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="pb-1 text-sm text-zinc-400">{plan.period}</span>
              </div>

              <div className="mt-3 text-zinc-400">{plan.desc}</div>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={`/${locale}/checkout?plan=${plan.checkoutQuery}`}
                className="mt-8 block w-full rounded-xl bg-emerald-400 py-3 text-center text-sm font-semibold text-black transition hover:opacity-90"
              >
                {isZh ? "立即升级" : "Continue to Checkout"}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <div className="text-2xl font-semibold">FAQ</div>
          <div className="mt-2 text-zinc-400">
            {isZh ? "关于支付与套餐的一些常见问题。" : "Common questions about pricing and payments."}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-2xl bg-zinc-950 p-5">
                <div className="font-semibold">{item.q}</div>
                <div className="mt-3 text-sm leading-6 text-zinc-400">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
