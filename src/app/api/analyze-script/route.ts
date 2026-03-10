import { NextResponse } from "next/server";
import { getAIClient, getAIModel, getAIProvider } from "@/lib/openai";
import { preprocessScript } from "@/lib/script-preprocess";

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

function normalizeResult(
  raw: any,
  originalScript: string,
  normalizedScript: string,
  preDetectedCharacters: string[],
  preDetectedSceneHints: string[],
  detectedFormat: string,
  isZh: boolean
): StructuredResultPayload {
  const title =
    typeof raw?.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : isZh
      ? "未命名项目"
      : "Untitled Project";

  const aiTitle =
    typeof raw?.aiTitle === "string" && raw.aiTitle.trim()
      ? raw.aiTitle.trim()
      : isZh
      ? `${title} · AI增强版`
      : `${title} · AI Enhanced`;

  const projectType =
    typeof raw?.projectType === "string" && raw.projectType.trim()
      ? raw.projectType.trim()
      : isZh
      ? "AI 短剧 / 漫剧项目"
      : "AI Drama / Comic Project";

  const genre =
    typeof raw?.genre === "string" && raw.genre.trim()
      ? raw.genre.trim()
      : isZh
      ? "剧情"
      : "Drama";

  const spec =
    typeof raw?.spec === "string" && raw.spec.trim()
      ? raw.spec.trim()
      : isZh
      ? "竖屏短剧 / 漫剧结构化输出"
      : "Vertical short drama / comic structured output";

  const highlight =
    typeof raw?.highlight === "string" && raw.highlight.trim()
      ? raw.highlight.trim()
      : isZh
      ? "已通过预处理器标准化剧本结构，提升角色识别与分镜输出稳定性。"
      : "Script was standardized by preprocessor for more stable character and storyboard output.";

  const summary =
    typeof raw?.summary === "string" && raw.summary.trim()
      ? raw.summary.trim()
      : normalizedScript.replace(/\s+/g, " ").slice(0, 180);

  const hook =
    typeof raw?.hook === "string" && raw.hook.trim()
      ? raw.hook.trim()
      : isZh
      ? "高能开场，强冲突，强情绪，适合短视频传播。"
      : "High-impact opening with strong emotion and conflict.";

  const coverCopy = Array.isArray(raw?.coverCopy)
    ? raw.coverCopy.filter((item: unknown) => typeof item === "string" && item.trim()).slice(0, 5)
    : [];

  const aiCharacters = Array.isArray(raw?.characters)
    ? raw.characters.filter((item: unknown) => typeof item === "string" && item.trim()).slice(0, 12)
    : [];

  const mergedCharacters = Array.from(
    new Set([...preDetectedCharacters, ...aiCharacters])
  ).slice(0, 15);

  const storyboard: StoryboardItem[] = Array.isArray(raw?.storyboard)
    ? raw.storyboard
        .map((item: any, index: number) => ({
          shot:
            typeof item?.shot === "number" && Number.isFinite(item.shot)
              ? item.shot
              : index + 1,
          title:
            typeof item?.title === "string" && item.title.trim()
              ? item.title.trim()
              : isZh
              ? `镜头 ${index + 1}`
              : `Shot ${index + 1}`,
          desc:
            typeof item?.desc === "string" && item.desc.trim()
              ? item.desc.trim()
              : isZh
              ? "暂无描述"
              : "No description",
        }))
        .slice(0, 12)
    : [];

  return {
    title,
    aiTitle,
    projectType,
    genre,
    spec,
    highlight,
    summary,
    hook,
    coverCopy:
      coverCopy.length > 0
        ? coverCopy
        : isZh
        ? [
            "三秒入戏，十秒爆点，适合短剧封面传播",
            "高冲突高情绪，极具追更感",
            "适合漫剧 / 短剧改编的强剧情内容",
          ]
        : [
            "Fast hook and strong conflict for short-form distribution",
            "Emotionally intense with strong binge appeal",
            "Suitable for drama and comic adaptation",
          ],
    characters:
      mergedCharacters.length > 0
        ? mergedCharacters
        : isZh
        ? ["主角", "女主", "关键配角"]
        : ["Lead", "Heroine", "Supporting Role"],
    storyboard:
      storyboard.length > 0
        ? storyboard
        : [
            {
              shot: 1,
              title: isZh ? "开场镜头" : "Opening Shot",
              desc: isZh ? "根据剧本自动生成的开场镜头描述。" : "Auto-generated opening shot based on the script.",
            },
          ],
    script: originalScript,
    preprocessInfo: {
      detectedFormat,
      extractedCharacters: preDetectedCharacters,
      extractedSceneHints: preDetectedSceneHints,
    },
  };
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
    const script = typeof body?.script === "string" ? body.script.trim() : "";
    const locale = body?.locale === "en" ? "en" : "zh";
    const isZh = locale === "zh";

    if (!script) {
      return NextResponse.json({ error: "missing script" }, { status: 400 });
    }

    const preprocessed = preprocessScript(script);

    const provider = getAIProvider();
    const client = getAIClient();
    const model = getAIModel();

    const systemPrompt = isZh
      ? `
你是专业短剧导演、编剧统筹和漫剧分镜策划。

系统已经先对用户剧本做了预处理和格式标准化。
请基于“标准化剧本”输出严格 JSON。
不要输出 markdown，不要输出解释，不要输出多余文字，只输出 JSON。

JSON 必须包含这些字段：
title: string
aiTitle: string
projectType: string
genre: string
spec: string
highlight: string
summary: string
hook: string
coverCopy: string[]
characters: string[]
storyboard: { shot: number, title: string, desc: string }[]

要求：
1. title 是原剧本最适合展示的标题
2. aiTitle 是更适合传播的AI增强标题
3. projectType 适合写成“AI短剧项目”或“AI漫剧项目”
4. genre 只保留一个主类型
5. summary 用 100~180 字概括剧情
6. hook 适合短视频开头
7. coverCopy 给 3~5 条
8. characters 提取主要角色
9. storyboard 给 4~8 条镜头结构
10. desc 要写清楚剧情内容和画面重点
11. 优先理解人物关系、冲突推进、情绪转折、场景切换
`
      : `
You are a professional short-drama director, script editor, and comic storyboard planner.

The system has already preprocessed and standardized the user's script.
Based on the standardized script, output strict JSON only.
Do not output markdown, explanation, or any extra text.

The JSON must contain:
title: string
aiTitle: string
projectType: string
genre: string
spec: string
highlight: string
summary: string
hook: string
coverCopy: string[]
characters: string[]
storyboard: { shot: number, title: string, desc: string }[]

Requirements:
1. title should be the best display title from the original script
2. aiTitle should be a more marketable AI-enhanced title
3. projectType should be something like AI Short Drama Project or AI Comic Project
4. genre should be one primary category
5. summary should be concise
6. hook should be suitable for short-video opening
7. coverCopy should contain 3 to 5 options
8. characters should extract main roles
9. storyboard should contain 4 to 8 shots
10. each desc should describe both plot action and visual focus
11. prioritize relationship dynamics, conflict progression, emotional turn, and scene transition
`;

    const userPrompt = isZh
      ? `
【检测到的剧本格式】
${preprocessed.detectedFormat}

【预识别角色】
${preprocessed.extractedCharacters.join("、") || "暂无"}

【场景提示】
${preprocessed.extractedSceneHints.join("；") || "暂无"}

【标准化剧本】
${preprocessed.normalizedScript}
`
      : `
[Detected Script Format]
${preprocessed.detectedFormat}

[Pre-detected Characters]
${preprocessed.extractedCharacters.join(", ") || "None"}

[Scene Hints]
${preprocessed.extractedSceneHints.join("; ") || "None"}

[Normalized Script]
${preprocessed.normalizedScript}
`;

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

    const result = normalizeResult(
      parsed,
      script,
      preprocessed.normalizedScript,
      preprocessed.extractedCharacters,
      preprocessed.extractedSceneHints,
      preprocessed.detectedFormat,
      isZh
    );

    return NextResponse.json({
      provider,
      model,
      preprocess: {
        detectedFormat: preprocessed.detectedFormat,
        extractedCharacters: preprocessed.extractedCharacters,
        extractedSceneHints: preprocessed.extractedSceneHints,
      },
      result,
    });
  } catch (error: any) {
    const locale = "zh";
    const message =
      typeof error?.message === "string" ? error.message : "AI analyze failed";

    return NextResponse.json(
      {
        error: simplifyProviderError(message, locale === "zh"),
      },
      { status: 500 }
    );
  }
}