import { NextRequest, NextResponse } from "next/server";
import { getOptionalEnv } from "@/lib/env";

const priceMap: Record<string, number> = {
  "pro-monthly": 9900,
  "studio-monthly": 39900,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const plan = typeof body?.plan === "string" ? body.plan : "";
    const method = typeof body?.method === "string" ? body.method : "";

    const amount = priceMap[plan];

    if (!amount) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const mockPaymentEnabled = getOptionalEnv("ENABLE_MOCK_PAYMENTS", "false") === "true";

    if (!mockPaymentEnabled) {
      return NextResponse.json(
        {
          error:
            "Payment gateway is not configured. Set ENABLE_MOCK_PAYMENTS=true for demo mode or connect a real payment provider.",
        },
        { status: 503 }
      );
    }

    if (method === "alipay") {
      return NextResponse.json({
        type: "redirect",
        url: `https://example.com/mock-alipay?plan=${encodeURIComponent(plan)}&amount=${amount}`,
      });
    }

    if (method === "wechat") {
      return NextResponse.json({
        type: "qrcode",
        code_url: `weixin://wxpay/bizpayurl?plan=${encodeURIComponent(plan)}&amount=${amount}`,
      });
    }

    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Payment error" }, { status: 500 });
  }
}