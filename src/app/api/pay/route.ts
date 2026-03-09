import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, method } = body;

    const priceMap: Record<string, number> = {
      "pro-monthly": 9900,
      "studio-monthly": 39900
    };

    const amount = priceMap[plan];

    if (!amount) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (method === "alipay") {
      return NextResponse.json({
        type: "redirect",
        url: "https://openapi.alipay.com/gateway.do"
      });
    }

    if (method === "wechat") {
      return NextResponse.json({
        type: "qrcode",
        code_url: "weixin://wxpay/bizpayurl?mockpay=123456"
      });
    }

    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });

  } catch (e) {
    return NextResponse.json({ error: "Payment error" }, { status: 500 });
  }
}
