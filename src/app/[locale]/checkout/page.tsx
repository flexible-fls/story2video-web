"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";

type PlanInfo = {
  title: string;
  price: string;
  desc: string;
  features: string[];
};

export default function CheckoutPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";
  const plan = searchParams.get("plan") || "pro-monthly";

  const planMap: Record<string, PlanInfo> = isZh
    ? {
        "pro-monthly": {
          title: "Pro 月付",
          price: "¥99 / 月",
          desc: "适合个人创作者与轻量团队",
          features: ["50 个剧本 / 月", "高级角色识别", "封面与爆点文案", "视频预览工作流"],
        },
        "studio-monthly": {
          title: "Studio 月付",
          price: "¥399 / 月",
          desc: "适合工作室与内容团队",
          features: ["无限剧本处理", "团队协作", "优先支持", "可扩展 API 与定制能力"],
        },
      }
    : {
        "pro-monthly": {
          title: "Pro Monthly",
          price: "$19 / month",
          desc: "Best for creators and small teams",
          features: ["50 scripts / month", "Advanced character extraction", "Hook & cover copy", "Video preview workflow"],
        },
        "studio-monthly": {
          title: "Studio Monthly",
          price: "$79 / month",
          desc: "Best for studios and production teams",
          features: ["Unlimited scripts", "Team collaboration", "Priority support", "Expandable API and custom workflows"],
        },
      };

  const selectedPlan = planMap[plan] || planMap["pro-monthly"];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
            <div className="text-xs text-zinc-400">
              {isZh ? "结算中心" : "Checkout"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/billing`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {isZh ? "返回套餐页" : "Back to Billing"}
            </Link>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
              {isZh ? "Stripe Checkout 结构已准备" : "Stripe Checkout Structure Ready"}
            </div>

            <h1 className="text-4xl font-bold">
              {isZh ? "确认你的订阅方案" : "Confirm your subscription"}
            </h1>

            <p className="mt-3 text-zinc-400">
              {isZh
                ? "当前页面是结算原型页。下一步接入 Stripe 后，点击按钮即可跳转真实支付页。"
                : "This is the checkout prototype page. Once Stripe is connected, the button will redirect to a real payment page."}
            </p>

            <div className="mt-8 rounded-2xl bg-zinc-950 p-6">
              <div className="text-sm text-zinc-400">{isZh ? "已选套餐" : "Selected Plan"}</div>
              <div className="mt-2 text-2xl font-semibold">{selectedPlan.title}</div>
              <div className="mt-2 text-3xl font-bold">{selectedPlan.price}</div>
              <div className="mt-3 text-zinc-400">{selectedPlan.desc}</div>

              <div className="mt-6 space-y-3">
                {selectedPlan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-2xl font-semibold">
              {isZh ? "支付信息" : "Payment Summary"}
            </div>

            <div className="mt-6 rounded-2xl bg-zinc-950 p-5">
              <div className="flex items-center justify-between text-sm text-zinc-400">
                <span>{isZh ? "套餐" : "Plan"}</span>
                <span>{selectedPlan.title}</span>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
                <span>{isZh ? "计费周期" : "Billing Cycle"}</span>
                <span>{isZh ? "每月" : "Monthly"}</span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-lg font-semibold">
                <span>{isZh ? "总计" : "Total"}</span>
                <span>{selectedPlan.price}</span>
              </div>
            </div>

            <button className="mt-6 h-12 w-full rounded-xl bg-emerald-400 text-sm font-semibold text-black transition hover:opacity-90">
              {isZh ? "前往 Stripe 支付（下一步接入）" : "Continue to Stripe (next step)"}
            </button>

            <div className="mt-4 rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">
              {isZh
                ? "说明：当前按钮仍为演示按钮。下一步我会继续给你 Stripe 接入版整文件替换代码。"
                : "Note: This button is still a demo button. Next, I can provide the Stripe integration version as full-file replacement."}
            </div>

            <div className="mt-6 text-xs text-zinc-500">
              {isZh
                ? "安全提示：真实支付接入后，结算流程将通过 Stripe Checkout 完成，不会在前端直接保存敏感支付信息。"
                : "Security note: After real payment integration, checkout will run through Stripe Checkout without storing sensitive payment data directly in the frontend."}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
