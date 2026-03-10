import { NextResponse } from "next/server";

type ShotPromptItem = {
  shot: number;
  title: string;
  zhPrompt: string;
  enPrompt: string;
  negativePrompt: string;
};

type ShotImageItem = {
  shot: number;
  title: string;
  imageUrl: string;
  promptUsed: string;
  revisedPrompt?: string;
};

function simplifyProviderError(errorMessage: string, isZh: boolean) {
  const message = errorMessage.toLowerCase();

  if (
    message.includes("insufficient balance") ||
    message.includes("insufficient_quota") ||
    message.includes("quota") ||
    message.includes("429")
  ) {
    return isZh
      ? "图片生成额度不足，请检查 OpenAI 图片模型余额或配额。"
      : "Image generation quota or balance is insufficient.";
  }

  if (
    message.includes("api key") ||
    message.includes("authentication") ||
    message.includes("unauthorized") ||
    message.includes("401")
  ) {
    return isZh
      ? "图片服务密钥无效，请检查 OPENAI_API_KEY。"
      : "Image API key is invalid. Please check OPENAI_API_KEY.";
  }

  return errorMessage;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const locale = body?.locale === "en" ? "en" : "zh";
    const isZh = locale === "zh";
    const prompts = Array.isArray(body?.prompts) ? (body.prompts as ShotPromptItem[]) : [];

    if (prompts.length === 0) {
      return NextResponse.json(
        { error: isZh ? "缺少用于出图的 Prompt" : "Missing prompts for image generation" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
    const size = process.env.OPENAI_IMAGE_SIZE || "1024x1024";
    const quality = process.env.OPENAI_IMAGE_QUALITY || "medium";
    const outputFormat = "png";

    if (!apiKey) {
      return NextResponse.json(
        { error: isZh ? "缺少 OPENAI_API_KEY，无法生成图片" : "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const images: ShotImageItem[] = [];

    for (const item of prompts) {
      const mergedPrompt = [
        item.enPrompt?.trim() || "",
        "",
        "Avoid the following issues:",
        item.negativePrompt?.trim() || "",
      ]
        .filter(Boolean)
        .join("\n");

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt: mergedPrompt,
          size,
          quality,
          output_format: outputFormat,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.error?.message ||
          data?.message ||
          (isZh ? "图片生成失败" : "Image generation failed");
        throw new Error(message);
      }

      const image = data?.data?.[0];
      const b64 = image?.b64_json;

      if (!b64) {
        throw new Error(isZh ? "图片接口未返回图片数据" : "Image API returned no image data");
      }

      images.push({
        shot: item.shot,
        title: item.title,
        imageUrl: `data:image/${outputFormat};base64,${b64}`,
        promptUsed: item.enPrompt,
        revisedPrompt: typeof image?.revised_prompt === "string" ? image.revised_prompt : "",
      });
    }

    return NextResponse.json({
      provider: "openai-images",
      model,
      size,
      quality,
      images,
    });
  } catch (error: any) {
    const message =
      typeof error?.message === "string" ? error.message : "Image generation failed";

    return NextResponse.json(
      {
        error: simplifyProviderError(message, true),
      },
      { status: 500 }
    );
  }
}