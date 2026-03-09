"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function CheckoutPage() {

  const pathname = usePathname();
  const params = useSearchParams();

  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const plan = params.get("plan") || "pro-monthly";

  const [loading,setLoading] = useState(false);
  const [qr,setQr] = useState<string | null>(null);

  async function pay(method:string){

    setLoading(true);

    const res = await fetch("/api/pay",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        plan,
        method
      })
    });

    const data = await res.json();

    if(data.type === "redirect"){
      window.location.href = data.url;
    }

    if(data.type === "qrcode"){
      setQr(data.code_url);
    }

    setLoading(false);
  }

  return (

    <main className="min-h-screen bg-black text-white flex items-center justify-center">

      <div className="bg-zinc-900 p-8 rounded-xl w-[420px]">

        <h1 className="text-2xl font-bold mb-6">

          {locale === "zh" ? "选择支付方式" : "Choose Payment"}

        </h1>

        <button
          onClick={()=>pay("alipay")}
          className="w-full bg-blue-500 py-3 rounded mb-4"
        >
          {locale==="zh"?"支付宝支付":"Pay with Alipay"}
        </button>

        <button
          onClick={()=>pay("wechat")}
          className="w-full bg-green-500 py-3 rounded"
        >
          {locale==="zh"?"微信扫码支付":"WeChat Pay"}
        </button>

        {qr && (
          <div className="mt-6 text-center">

            <p className="mb-3">
              {locale==="zh"?"微信扫码支付":"Scan QR with WeChat"}
            </p>

            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`}
              className="mx-auto"
            />

          </div>
        )}

      </div>

    </main>

  );
}
