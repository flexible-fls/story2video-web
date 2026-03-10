import { NextResponse } from "next/server";
import { getAIClient, getAIModel, getAIProvider } from "@/lib/openai";

type StoryboardItem = {
  shot: number;
  title: string;
  desc: string;
};

type StructuredResultPayload = {
  title: string;
  aiTitle: string;
  projectType: string;
  genre: string;
  spec: string;
  highlight: string;
  summary: string;
  hook: string;
  coverCopy: string[];
  characters: string[];
  storyboard: StoryboardItem[];
  script: string;
  preprocessInfo?: {
    detectedFormat: string;
    extractedCharacters: string[];
    extractedSceneHints: string[];
  };
};

type ShotPromptItem = {
  shot: number;
  title: string;
  zhPrompt: string;
  enPrompt: string;
  negativePrompt: string;
};

function normalizePromptItems(raw: any, storyboard: StoryboardItem[], isZh: boolean): ShotPromptItem[] {
  const arr = Array.isArray(raw?.prompts) ? raw.prompts : [];

  if (arr.length === 0) {
    return storyboard.map((item) => ({
      shot: item.shot,
      title: item.title,
      zhPrompt: `高质量影视分镜画面，${item.title}，${item.desc}，电影感构图，人物表情清晰，光影层次丰富，适合短剧漫剧制作，高清细节`,
      enPrompt: `high quality cinematic storyboard frame, ${item.title}, ${item.desc}, dramatic composition, clear facial expression, rich lighting, suitable for short drama and comic production, highly detailed`,
      negativePrompt:
        "low quality, blurry, deformed hands, extra fingers, extra limbs, bad anatomy, cropped face, duplicate person, messy composition, text, watermark, logo",
    }));
  }

  return arr.slice(0, storyboard.length).map((item: any, index: number) => {
    const source = storyboard[index];

    return {
      shot:
        typeof item?.shot === "number" && Number.isFinite(item.shot)
          ? item.shot
          : source?.shot ?? index + 1,
      title:
        typeof item?.title === "string" && item.title.trim()
          ? item.title.trim()
          : source?.title ?? (isZh ? `镜头 ${index + 1}` : `Shot ${index + 1}`),
      zhPrompt:
        typeof item?.zhPrompt === "string" && item.zhPrompt.trim()
          ? item.zhPrompt.trim()
          : `高质量影视分镜画面，${source?.title ?? ""}，${source?.desc ?? ""}，电影感构图，高清细节`,
      enPrompt:
        typeof item?.enPrompt === "string" && item.enPrompt.trim()
          ? item.enPrompt.trim()
          : `high quality cinematic storyboard frame, ${source?.title ?? ""}, ${source?.desc ?? ""}, cinematic composition, highly detailed`,
      negativePrompt:
        typeof item?.negativePrompt === "string" && item.negativePrompt.trim()
          ? item.negativePrompt.trim()
          : "low quality, blurry, deformed hands, extra fingers, extra limbs, bad anatomy, cropped face, duplicate person, messy composition, text, watermark, logo",
    };
  });
}

function simplifyProviderError(errorMessage: string, isZh: boolean) {
  const message = errorMessage.toLowerCase();

  if (
    message.includes("insufficient balance") ||
    message.includes("insufficient_quota") ||
    message.includes("quota") ||
    message.includes("429")
  ) {
    return isZh
      ? "AI 服务额度不足，请检查当前模型平台的余额或配额设置。"
      : "AI provider quota or balance is insufficient.";
  }

  if (
    message.includes("api key") ||
    message.includes("authentication") ||
    message.includes("unauthorized") ||
    message.includes("401")
  ) {
    return isZh
      ? "AI 服务密钥无效，请检查环境变量配置。"
      : "AI provider key is invalid. Please check environment variables.";
  }

  return errorMessage;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const locale = body?.locale === "en" ? "en" : "zh";
    const isZh = locale === "zh";
    const result = body?.result as StructuredResultPayload | undefined;

    if (!result || !Array.isArray(result.storyboard) || result.storyboard.length === 0) {
      return NextResponse.json(
        { error: isZh ? "缺少可用于生成 Prompt 的分镜数据" : "Missing storyboard data" },
        { status: 400 }
      );
    }

    const provider = getAIProvider();
    const client = getAIClient();
    const model = getAIModel();

    const systemPrompt = isZh
      ? `
你是专业的 AI 分镜出图提示词设计师，擅长把短剧 / 漫剧分镜转换为可用于图片生成模型的高质量 Prompt。

请把用户给出的分镜列表，输出为严格 JSON。
不要输出 markdown，不要解释，不要输出多余文字，只输出 JSON。

JSON 格式：
{
  "prompts": [
    {
      "shot": number,
      "title": string,
      "zhPrompt": string,
      "enPrompt": string,
      "negativePrompt": string
    }
  ]
}

要求：
1. 每个镜头都输出一条 Prompt
2. zhPrompt 用中文，适合给中文出图模型使用
3. enPrompt 用英文，适合给国际常见图片模型使用
4. negativePrompt 给统一的负面提示词，但可根据镜头略微补充
5. Prompt 要强调：
   - 人物关系
   - 场景环境
   - 情绪状态
   - 画面构图
   - 光影氛围
   - 镜头语言
   - 影视感 / 漫剧感
6. 不要写参数符号，例如 --ar --v 之类
7. 画面描述尽量具体，可直接用于 AI 出图
`
      : `
You are an expert AI storyboard image prompt designer.
Your job is to convert short-drama / comic storyboard shots into high-quality prompts for image generation.

Return strict JSON only.
Do not output markdown, explanation, or extra text.

JSON format:
{
  "prompts": [
    {
      "shot": number,
      "title": string,
      "zhPrompt": string,
      "enPrompt": string,
      "negativePrompt": string
    }
  ]
}

Requirements:
1. Generate one prompt per shot
2. zhPrompt should be Chinese and usable for Chinese image models
3. enPrompt should be English and usable for mainstream image models
4. negativePrompt should include strong negative prompt terms
5. Prompt should emphasize:
   - character relationships
   - environment
   - emotional state
   - composition
   - lighting atmosphere
   - camera language
   - cinematic / comic mood
6. Do not include model parameter flags like --ar or --v
7. Make the prompts directly usable for AI image generation
`;

    const userPrompt = JSON.stringify(
      {
        projectTitle: result.aiTitle || result.title,
        genre: result.genre,
        summary: result.summary,
        characters: result.characters,
        storyboard: result.storyboard,
      },
      null,
      2
    );

    const completion = await client.chat.completions.create({
      model,
      temperature: provider === "deepseek" ? 0.5 : 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: isZh ? "模型返回为空" : "empty model response" },
        { status: 500 }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        {
          error: isZh ? "模型返回的 JSON 无法解析" : "invalid json from model",
          raw: content,
        },
        { status: 500 }
      );
    }

    const prompts = normalizePromptItems(parsed, result.storyboard, isZh);

    return NextResponse.json({
      provider,
      model,
      prompts,
    });
  } catch (error: any) {
    const message =
      typeof error?.message === "string" ? error.message : "Prompt generation failed";

    return NextResponse.json(
      {
        error: simplifyProviderError(message, true),
      },
      { status: 500 }
    );
  }
}