"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";

type OrderDetail = {
  id: string;
  user_id: string;
  email: string | null;
  plan: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
};

export default function OrderDetailPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const orderId = queryParams.get("order_id");

    if (orderId) {
      setOrderId(orderId);
      loadOrderDetail(orderId);
    } else {
      router.push(`/${locale}/admin/orders`);
    }
  }, [locale]);

  async function loadOrderDetail(orderId: string) {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Failed to load order detail", error.message);
      return;
    }

    setOrder(data);
    setLoading(false);
  }

  function formatTime(value: string) {
    return new Date(value).toLocaleString();
  }

  function formatPlan(plan: string) {
    if (plan === "studio") return "Studio";
    if (plan === "pro") return "Pro";
    return "Free";
  }

  function formatMoney(amount: number) {
    return isZh ? `¥${(amount / 100).toFixed(2)}` : `$${(amount / 100).toFixed(2)}`;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06070a] text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "订单加载中..." : "Loading order details..."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}/admin/orders`} />
            <div>
              <div className="text-xl font-semibold tracking-tight text-white">FulushouVideo</div>
              <div className="text-xs text-zinc-400">
                {isZh ? "订单详情" : "Order Detail"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            {isZh ? "订单详细信息" : "Order Details"}
          </h1>
          <p className="mt-6 text-lg text-zinc-300">
            {isZh ? "查看该订单的详细信息" : "Review the details of this order."}
          </p>

          <div className="mt-10 space-y-8">
            <div className="bg-zinc-950 p-6 rounded-xl">
              <div className="text-sm text-zinc-400">{isZh ? "订单编号" : "Order ID"}</div>
              <div className="mt-3 text-2xl font-semibold text-white">{order?.id}</div>
            </div>

            <div className="bg-zinc-950 p-6 rounded-xl">
              <div className="text-sm text-zinc-400">{isZh ? "用户邮箱" : "User Email"}</div>
              <div className="mt-3 text-2xl font-semibold text-white">{order?.email || "-"}</div>
            </div>

            <div className="bg-zinc-950 p-6 rounded-xl">
              <div className="text-sm text-zinc-400">{isZh ? "套餐" : "Plan"}</div>
              <div className="mt-3 text-2xl font-semibold text-white">{formatPlan(order?.plan || "")}</div>
            </div>

            <div className="bg-zinc-950 p-6 rounded-xl">
              <div className="text-sm text-zinc-400">{isZh ? "订单金额" : "Amount"}</div>
              <div className="mt-3 text-2xl font-semibold text-white">{formatMoney(order?.amount || 0)}</div>
            </div>

            <div className="bg-zinc-950 p-6 rounded-xl">
              <div className="text-sm text-zinc-400">{isZh ? "支付方式" : "Payment Method"}</div>
              <div className="mt-3 text-2xl font-semibold text-white">{order?.payment_method || "-"}</div>
            </div>

            <div className="bg-zinc-950 p-6 rounded-xl">
              <div className="text-sm text-zinc-400">{isZh ? "支付状态" : "Payment Status"}</div>
              <div className="mt-3 text-2xl font-semibold text-white">{order?.status}</div>
            </div>

            <div className="bg-zinc-950 p-6 rounded-xl">
              <div className="text-sm text-zinc-400">{isZh ? "订单创建时间" : "Order Created At"}</div>
              <div className="mt-3 text-2xl font-semibold text-white">{formatTime(order?.created_at || "")}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}