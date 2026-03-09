"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import { supabase } from "@/lib/supabase";

type SavedPlan = {
  plan: string;
  quota: number;
  label: string;
  amount: number;
};

export default function SuccessPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";
  const plan = searchParams.get("plan") || "pro-monthly";

  const [saving, setSaving] = useState(true);
  const [message, setMessage] = useState(
    isZh ? "正在同步你的套餐信息..." : "Syncing your subscription..."
  );

  const planInfo = useMemo<SavedPlan>(() => {
    if (plan === "studio-monthly") {
      return {
        plan: "studio",
        quota: 999999,
        label: isZh ? "Studio 月付" : "Studio Monthly",
        amount: 39900,
      };
    }

    return {
      plan: "pro",
      quota: 50,
      label: isZh ? "Pro 月付" : "Pro Monthly",
      amount: 9900,
    };
  }, [plan, isZh]);

  useEffect(() => {
    async function savePlanAndOrder() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setMessage(
            isZh
              ? "未检测到登录用户，请先登录后再返回账户中心。"
              : "No signed-in user detected. Please sign in first, then return to your account."
          );
          setSaving(false);
          return;
        }

        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? "",
            plan: planInfo.plan,
            monthly_quota: planInfo.quota,
            status: "active",
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

        if (profileError) {
          setMessage(
            isZh
              ? `套餐写入失败：${profileError.message}`
              : `Failed to save subscription: ${profileError.message}`
          );
          setSaving(false);
          return;
        }

        const { error: orderError } = await supabase.from("orders").insert({
          user_id: user.id,
          email: user.email ?? "",
          plan: planInfo.plan,
          amount: planInfo.amount,
          payment_method: "china-pay",
          status: "paid",
        });

        if (orderError) {
          setMessage(
            isZh
              ? `套餐已生效，但订单记录写入失败：${orderError.message}`
              : `Plan activated, but failed to save order record: ${orderError.message}`
          );
        } else {
          setMessage(
            isZh
              ? `支付成功，已同步为 ${planInfo.label}，并写入订单记录。`
              : `Payment successful. Your plan has been synced as ${planInfo.label}, and the order has been recorded.`
          );
        }
      } catch {
        setMessage(
          isZh
            ? "同步套餐时发生错误，请稍后重试。"
            : "An error occurred while syncing your plan. Please try again later."
        );
      } finally {
        setSaving(false);
      }
    }

    savePlanAndOrder();
  }, [isZh, planInfo]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-white/10 bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
            <div className="text-xs text-zinc-400">
              {isZh ? "支付成功" : "Payment Success"}
            </div>
          </div>
          <LanguageSwitch locale={locale} />
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400 text-2xl font-bold text-black">
            ✓
          </div>

          <h1 className="text-4xl font-bold">
            {isZh ? "支付成功" : "Payment Successful"}
          </h1>

          <p className="mt-4 text-zinc-400">{message}</p>

          <div className="mt-8 rounded-2xl bg-zinc-950 p-5 text-left">
            <div className="text-sm text-zinc-400">
              {isZh ? "已同步套餐" : "Synced Plan"}
            </div>
            <div className="mt-2 text-2xl font-semibold">{planInfo.label}</div>
            <div className="mt-3 text-sm text-zinc-400">
              {planInfo.plan === "studio"
                ? isZh
                  ? "额度：无限"
                  : "Quota: Unlimited"
                : isZh
                ? "额度：每月 50 次"
                : "Quota: 50 generations / month"}
            </div>
            <div className="mt-2 text-sm text-zinc-500">
              {saving
                ? isZh
                  ? "正在写入账户与订单数据..."
                  : "Writing account and order data..."
                : isZh
                ? "账户与订单数据已处理完成。"
                : "Account and order data have been processed."}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/account`}
              className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black"
            >
              {isZh ? "进入账户中心" : "Go to Account"}
            </Link>
            <Link
              href={`/${locale}/orders`}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-200"
            >
              {isZh ? "查看订单记录" : "View Orders"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
