"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";

type PaymentStatus = "success" | "failed";

export default function PaymentResultPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const status = queryParams.get("status");
    const orderId = queryParams.get("order_id");

    if (status && orderId) {
      setOrderId(orderId);
      handlePaymentStatus(status as PaymentStatus);
    } else {
      setMessage(isZh ? "支付信息缺失，无法完成支付" : "Payment information is missing, unable to complete payment.");
    }
  }, []);

  async function handlePaymentStatus(status: PaymentStatus) {
    setPaymentStatus(status);
    const { error } = await supabase.rpc("update_order_status", {
      order_id: orderId,
      status: status,
    });

    if (error) {
      setMessage(isZh ? "支付状态更新失败，请稍后重试" : "Failed to update payment status, please try again later.");
    } else {
      setMessage(
        status === "success"
          ? isZh
            ? "支付成功！感谢您的购买！"
            : "Payment successful! Thank you for your purchase!"
          : isZh
          ? "支付失败，请检查支付信息"
          : "Payment failed, please check payment details"
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}`} />
            <div>
              <div className="text-xl font-semibold tracking-tight text-white">FulushouVideo</div>
              <div className="text-xs text-zinc-400">
                {isZh ? "支付结果" : "Payment Result"}
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
            {paymentStatus === "success" ? (isZh ? "支付成功" : "Payment Successful") : (isZh ? "支付失败" : "Payment Failed")}
          </h1>

          <p className="mt-6 text-xl text-zinc-300">{message}</p>

          {paymentStatus === "success" && (
            <div className="mt-8">
              <Link
                href={`/${locale}`}
                className="rounded-2xl border border-white/10 bg-emerald-400/10 px-6 py-3 text-center text-sm font-semibold text-white"
              >
                {isZh ? "返回首页" : "Back to Home"}
              </Link>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="mt-8">
              <Link
                href={`/${locale}/billing`}
                className="rounded-2xl border border-white/10 bg-emerald-400/10 px-6 py-3 text-center text-sm font-semibold text-white"
              >
                {isZh ? "重新支付" : "Retry Payment"}
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}