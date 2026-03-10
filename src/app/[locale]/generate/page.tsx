"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

type ProfileRow = {
  id: string;
  email: string | null;
  plan: string;
  monthly_quota: number;
  used_count: number;
  status: string;
  role?: string;
};

type StoryboardItem = {
  shot: number;
  title: string;
  desc: string;
};

type StepLogItem = {
  key: string;
  label: string;
  status: "pending" | "processing" | "success" | "failed";
  progress: number;
  updatedAt: string;
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
};

type GenerationJobHistoryRow = {
  id: string;
  script_title: string | null;
  source_script: string | null;
  created_at: string;
  status: string;
};

type SourceMode = "upload" | "paste" | "template" | "history";

const DRAFT_SCRIPT_TEXT_KEY = "draft_script_text";
const DRAFT_SCRIPT_NAME_KEY = "draft_script_name";

function saveDraftScript(text: string, fileName?: string) {
  localStorage.setItem(DRAFT_SCRIPT_TEXT_KEY, text);
  if (fileName) {
    localStorage.setItem(DRAFT_SCRIPT_NAME_KEY, fileName);
  } else {
    localStorage.removeItem(DRAFT_SCRIPT_NAME_KEY);
  }
}

function loadDraftScript() {
  return {
    text: localStorage.getItem(DRAFT_SCRIPT_TEXT_KEY) || "",
    fileName: localStorage.getItem(DRAFT_SCRIPT_NAME_KEY) || "",
  };
}

function cacheLegacyResult(payload: StructuredResultPayload) {
  localStorage.setItem("scriptText", payload.script);
  localStorage.setItem("parsedTitle", payload.title);
  localStorage.setItem("parsedAiTitle", payload.aiTitle);
  localStorage.setItem("parsedProjectType", payload.projectType);
  localStorage.setItem("parsedGenre", payload.genre);
  localStorage.setItem("parsedSpec", payload.spec);
  localStorage.setItem("parsedHighlight", payload.highlight);
  localStorage.setItem("parsedSummary", payload.summary);
  localStorage.setItem("parsedHook", payload.hook);
  localStorage.setItem("parsedCharacters", JSON.stringify(payload.characters));
  localStorage.setItem("parsedStoryboard", JSON.stringify(payload.storyboard));
  localStorage.setItem("parsedCoverCopy", JSON.stringify(payload.coverCopy));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildStepLogs(
  isZh: boolean,
  processingIndex: number,
  failedIndex?: number
): StepLogItem[] {
  const labels = isZh
    ? ["创建任务", "读取剧本", "AI解析剧情", "AI识别角色", "AI生成分镜", "写入任务结果"]
    : [
        "Create Job",
        "Read Script",
        "AI Plot Analysis",
        "AI Character Analysis",
        "AI Storyboard Generation",
        "Save Result",
      ];

  return labels.map((label, index) => {
    let status: StepLogItem["status"] = "pending";

    if (typeof failedIndex === "number") {
      if (index < failedIndex) status = "success";
      else if (index === failedIndex) status = "failed";
    } else {
      if (index < processingIndex) status = "success";
      else if (index === processingIndex) status = "processing";
    }

    return {
      key: `step_${index + 1}`,
      label,
      status,
      progress: Math.round(((index + 1) / labels.length) * 100),
      updatedAt: new Date().toISOString(),
    };
  });
}

function extractFallbackTitle(script: string, isZh: boolean) {
  const firstLine = script
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return isZh ? "未命名项目" : "Untitled Project";
  }

  return firstLine.slice(0, 30);
}

function buildFallbackResult(script: string, isZh: boolean): StructuredResultPayload {
  const title = extractFallbackTitle(script, isZh);

  return {
    title,
    aiTitle: isZh ? `${title} · AI增强版` : `${title} · AI Enhanced`,
    projectType: isZh ? "AI 短剧 / 漫剧项目" : "AI Drama / Comic Project",
    genre: isZh ? "剧情" : "Drama",
    spec: isZh ? "竖屏短剧 / 漫剧结构化输出" : "Vertical short drama / comic structured output",
    highlight: isZh
      ? "结构清晰，适合短剧与漫剧制作。"
      : "Clear structure suitable for short drama and comic production.",
    summary: script.replace(/\s+/g, " ").slice(0, 180),
    hook: isZh
      ? "高能开场，强冲突，适合短视频传播。"
      : "Strong opening and conflict, suitable for short-form distribution.",
    coverCopy: isZh
      ? [
          "三秒入戏，十秒爆点，适合短剧封面传播",
          "高冲突高情绪，极具追更感",
          "适合漫剧 / 短剧改编的强剧情内容",
        ]
      : [
          "Fast hook and strong conflict for short-form distribution",
          "High emotion with binge-worthy momentum",
          "Strong story structure for drama and comic adaptation",
        ],
    characters: isZh ? ["主角", "女主", "关键配角"] : ["Lead", "Heroine", "Supporting Role"],
    storyboard: [
      {
        shot: 1,
        title: isZh ? "开场镜头" : "Opening Shot",
        desc: isZh
          ? "根据剧本内容自动生成的开场镜头。"
          : "Auto-generated opening shot based on the script.",
      },
      {
        shot: 2,
        title: isZh ? "冲突推进" : "Conflict Development",
        desc: isZh
          ? "推动剧情发展的关键冲突镜头。"
          : "A key conflict shot that pushes the plot forward.",
      },
    ],
    script,
  };
}

function getScriptStats(text: string) {
  const trimmed = text.trim();
  const charCount = trimmed.length;
  const lineCount = trimmed ? trimmed.split("\n").length : 0;
  return { charCount, lineCount };
}

function getExampleScripts(isZh: boolean) {
  if (isZh) {
    return [
      {
        title: "错爱归途",
        text: `剧名：错爱归途

林晚：你为什么现在才回来？
顾沉：因为我终于查到了真相。
林晚：真相？你让我等了三年，现在才来告诉我真相？
旁白：一场误会，把两个人推向命运的交叉口。

场景一：夜雨街头
林晚站在路灯下，眼眶微红，顾沉撑伞走近。
顾沉：我欠你一个解释。
林晚：可我已经不需要了。

场景二：旧日回忆
旁白：三年前，他在最该解释的时候离开了她。
顾沉：如果那天我不走，你也会被卷进去。
林晚：可你从来没有问过，我愿不愿意和你一起面对。`,
      },
      {
        title: "豪门替身",
        text: `剧名：豪门替身

沈知意：你找我来，到底想做什么？
陆承泽：做她的替身，留在我身边三个月。
沈知意：你疯了？
旁白：一纸协议，把她推进了豪门迷局。

场景一：总裁办公室
陆承泽将合同推到桌前，眼神冷淡。
陆承泽：价钱你开。
沈知意：我不卖自己。
陆承泽：那你弟弟的手术费呢？

场景二：豪门晚宴
沈知意第一次以“未婚妻”的身份出现在众人面前，所有人都在打量她。`,
      },
    ];
  }

  return [
    {
      title: "Return of Misunderstanding",
      text: `Title: Return of Misunderstanding

Lin Wan: Why did you come back so late?
Gu Chen: Because I finally found the truth.
Narrator: A misunderstanding pushed them to the edge of fate.

Scene 1: Rainy street at night
Lin Wan stands under a street lamp, eyes red. Gu Chen walks toward her with an umbrella.
Gu Chen: I owe you an explanation.
Lin Wan: I don't need it anymore.

Scene 2: Flashback
Narrator: Three years ago, he left when she needed him most.
Gu Chen: If I had stayed, you would have been dragged into it.
Lin Wan: But you never asked whether I wanted to face it with you.`,
    },
  ];
}

async function extractTextFromTxtOrMd(file: File) {
  return await file.text();
}

async function extractTextFromDocx(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
}

async function extractTextFromPdf(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs";

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += pageText + "\n";
  }

  return fullText.trim();
}

async function extractScriptTextFromFile(file: File, isZh: boolean) {
  const lowerName = file.name.toLowerCase();

  if (
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".text")
  ) {
    return await extractTextFromTxtOrMd(file);
  }

  if (lowerName.endsWith(".docx")) {
    return await extractTextFromDocx(file);
  }

  if (lowerName.endsWith(".pdf")) {
    return await extractTextFromPdf(file);
  }

  throw new Error(
    isZh
      ? "当前支持的剧本格式为：txt、md、text、docx、pdf"
      : "Supported script formats: txt, md, text, docx, pdf"
  );
}

export default function GeneratePage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [scriptText, setScriptText] = useState("");
  const [loadedFileName, setLoadedFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [jobId, setJobId] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [providerInfo, setProviderInfo] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [sourceMode, setSourceMode] = useState<SourceMode>("upload");
  const [historyJobs, setHistoryJobs] = useState<GenerationJobHistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const steps = useMemo(
    () =>
      isZh
        ? ["创建任务", "读取剧本", "AI解析剧情", "AI识别角色", "AI生成分镜", "写入任务结果"]
        : [
            "Create Job",
            "Read Script",
            "AI Plot Analysis",
            "AI Character Analysis",
            "AI Storyboard Generation",
            "Save Result",
          ],
    [isZh]
  );

  const scriptStats = useMemo(() => getScriptStats(scriptText), [scriptText]);
  const exampleScripts = useMemo(() => getExampleScripts(isZh), [isZh]);

  useEffect(() => {
    bootstrap();
  }, [locale, router]);

  async function bootstrap() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/${locale}/auth`);
      return;
    }

    const [profileRes, historyRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,plan,monthly_quota,used_count,status,role")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("generation_jobs")
        .select("id,script_title,source_script,created_at,status")
        .eq("user_id", user.id)
        .not("source_script", "is", null)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data as ProfileRow);
    }

    setHistoryJobs((historyRes.data as GenerationJobHistoryRow[]) || []);

    const draft = loadDraftScript();
    if (draft.text) setScriptText(draft.text);
    if (draft.fileName) setLoadedFileName(draft.fileName);
  }

  async function refreshHistoryScripts() {
    setLoadingHistory(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingHistory(false);
      return;
    }

    const { data } = await supabase
      .from("generation_jobs")
      .select("id,script_title,source_script,created_at,status")
      .eq("user_id", user.id)
      .not("source_script", "is", null)
      .order("created_at", { ascending: false })
      .limit(8);

    setHistoryJobs((data as GenerationJobHistoryRow[]) || []);
    setLoadingHistory(false);
  }

  async function handleFileSelect(file: File) {
    setReadingFile(true);
    setErrorMessage("");

    try {
      const text = await extractScriptTextFromFile(file, isZh);

      if (!text.trim()) {
        throw new Error(isZh ? "上传文件内容为空，无法提取剧本" : "The uploaded file is empty");
      }

      setScriptText(text);
      setLoadedFileName(file.name);
      saveDraftScript(text, file.name);
      setSourceMode("upload");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isZh
          ? "文件读取失败"
          : "Failed to read file"
      );
    } finally {
      setReadingFile(false);
      setIsDragging(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileSelect(file);
  }

  async function updateJob(
    targetJobId: string,
    nextStatus: "pending" | "processing" | "success" | "failed",
    nextProgress: number,
    nextResultUrl?: string | null,
    nextErrorMessage?: string | null,
    nextResultJson?: StructuredResultPayload | null,
    nextStepLogs?: StepLogItem[] | null
  ) {
    await supabase.rpc("update_generation_job_progress", {
      target_job_id: targetJobId,
      next_status: nextStatus,
      next_progress: nextProgress,
      next_result_url: nextResultUrl ?? null,
      next_error_message: nextErrorMessage ?? null,
      next_result_json: nextResultJson ?? null,
      next_step_logs: nextStepLogs ?? null,
    });
  }

  async function handleGenerate() {
    const text = scriptText.trim();

    if (!text) {
      setErrorMessage(isZh ? "请先输入或上传剧本内容" : "Please upload or paste your script first");
      return;
    }

    if (profile?.status === "banned") {
      setErrorMessage(isZh ? "你的账号当前已被封禁，无法继续生成。" : "Your account is banned and cannot generate now.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setProgress(0);
    setCurrentStep(0);
    setProviderInfo("");

    saveDraftScript(text, loadedFileName || undefined);

    let createdJobId = "";

    try {
      const fallbackTitle = extractFallbackTitle(text, isZh);

      const { data, error } = await supabase.rpc("create_generation_job_and_consume_quota", {
        target_script_title: fallbackTitle,
        target_source_script: text,
        target_quota_cost: 1,
      });

      if (error || !data) {
        throw new Error(error?.message || "Failed to create generation job");
      }

      createdJobId = data as string;
      setJobId(createdJobId);

      const step0 = buildStepLogs(isZh, 0);
      setProgress(10);
      setCurrentStep(0);
      await updateJob(createdJobId, "processing", 10, null, null, null, step0);
      await sleep(250);

      const step1 = buildStepLogs(isZh, 1);
      setProgress(22);
      setCurrentStep(1);
      await updateJob(createdJobId, "processing", 22, null, null, null, step1);
      await sleep(250);

      const step2 = buildStepLogs(isZh, 2);
      setProgress(38);
      setCurrentStep(2);
      await updateJob(createdJobId, "processing", 38, null, null, null, step2);

      const analyzeRes = await fetch("/api/analyze-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script: text,
          locale,
        }),
      });

      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok) {
        throw new Error(
          analyzeData?.error ||
            (isZh ? "AI 解析失败，请稍后重试" : "AI analysis failed, please try again later")
        );
      }

      const aiResult: StructuredResultPayload =
        analyzeData?.result || buildFallbackResult(text, isZh);

      cacheLegacyResult(aiResult);

      if (analyzeData?.provider && analyzeData?.model) {
        setProviderInfo(`${analyzeData.provider} / ${analyzeData.model}`);
      }

      const step3 = buildStepLogs(isZh, 3);
      setProgress(62);
      setCurrentStep(3);
      await updateJob(createdJobId, "processing", 62, null, null, null, step3);
      await sleep(200);

      const step4 = buildStepLogs(isZh, 4);
      setProgress(84);
      setCurrentStep(4);
      await updateJob(createdJobId, "processing", 84, null, null, null, step4);
      await sleep(200);

      const resultUrl = `/${locale}/result?job=${createdJobId}`;
      const step5 = buildStepLogs(isZh, 6);

      setProgress(100);
      setCurrentStep(5);

      await updateJob(createdJobId, "success", 100, resultUrl, null, aiResult, step5);

      router.push(resultUrl);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isZh
          ? "生成失败，请稍后重试"
          : "Generation failed, please try again later";

      setErrorMessage(message);

      if (createdJobId) {
        const failedSteps = buildStepLogs(isZh, 0, Math.max(currentStep, 0));
        await updateJob(createdJobId, "failed", progress || 0, null, message, null, failedSteps);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const quotaText =
    profile?.plan === "studio"
      ? isZh
        ? "Studio 无限额度"
        : "Studio unlimited quota"
      : profile
      ? isZh
        ? `当前额度：${profile.used_count} / ${profile.monthly_quota}`
        : `Current quota: ${profile.used_count} / ${profile.monthly_quota}`
      : isZh
      ? "加载账户中..."
      : "Loading account...";

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}`} />
            <div>
              <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
              <div className="text-xs text-zinc-400">
                {isZh ? "AI 短剧与漫剧生成平台" : "AI Drama & Comic Video Studio"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/jobs`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.07]"
            >
              {isZh ? "我的任务" : "My Jobs"}
            </Link>
            <Link
              href={`/${locale}/account`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.07]"
            >
              {isZh ? "账户中心" : "Account"}
            </Link>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-8">
          <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
            {isZh ? "第三阶段：AI 剧本解析" : "Phase 3: AI Script Analysis"}
          </div>

          <h1 className="text-4xl font-bold">
            {isZh ? "上传剧本并交给 AI 解析" : "Upload Script and Let AI Analyze It"}
          </h1>

          <p className="mt-3 text-zinc-400">
            {isZh
              ? "现在支持文件上传、直接粘贴、模板导入和历史剧本复用，让剧本进入生成流程更顺手。"
              : "Now supports file upload, direct paste, template import, and history reuse for a smoother script-to-generation workflow."}
          </p>

          <div className="mt-4 text-sm text-zinc-500">{quotaText}</div>

          {providerInfo && (
            <div className="mt-2 text-sm text-emerald-300">
              {isZh ? "当前模型：" : "Current model: "} {providerInfo}
            </div>
          )}

          {profile?.status === "banned" && (
            <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {isZh ? "你的账号当前已被封禁，无法继续生成。" : "Your account is banned and cannot generate now."}
            </div>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                onClick={() => setSourceMode("upload")}
                className={`rounded-xl px-4 py-2 text-sm ${
                  sourceMode === "upload"
                    ? "bg-emerald-400 text-black"
                    : "border border-white/10 bg-zinc-950 text-zinc-300"
                }`}
              >
                {isZh ? "上传文件" : "Upload File"}
              </button>

              <button
                onClick={() => setSourceMode("paste")}
                className={`rounded-xl px-4 py-2 text-sm ${
                  sourceMode === "paste"
                    ? "bg-emerald-400 text-black"
                    : "border border-white/10 bg-zinc-950 text-zinc-300"
                }`}
              >
                {isZh ? "直接粘贴" : "Paste Script"}
              </button>

              <button
                onClick={() => setSourceMode("template")}
                className={`rounded-xl px-4 py-2 text-sm ${
                  sourceMode === "template"
                    ? "bg-emerald-400 text-black"
                    : "border border-white/10 bg-zinc-950 text-zinc-300"
                }`}
              >
                {isZh ? "模板导入" : "Templates"}
              </button>

              <button
                onClick={async () => {
                  setSourceMode("history");
                  await refreshHistoryScripts();
                }}
                className={`rounded-xl px-4 py-2 text-sm ${
                  sourceMode === "history"
                    ? "bg-emerald-400 text-black"
                    : "border border-white/10 bg-zinc-950 text-zinc-300"
                }`}
              >
                {isZh ? "历史剧本" : "History"}
              </button>
            </div>

            {sourceMode === "upload" && (
              <div className="mb-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xl font-semibold">
                    {isZh ? "上传剧本文件" : "Upload Script File"}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.text,.docx,.pdf"
                      onChange={onFileChange}
                      className="hidden"
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={readingFile || submitting || profile?.status === "banned"}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
                    >
                      {readingFile
                        ? isZh
                          ? "读取中..."
                          : "Reading..."
                        : isZh
                        ? "选择剧本文件"
                        : "Choose Script File"}
                    </button>
                  </div>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (!file) {
                      setIsDragging(false);
                      return;
                    }
                    await handleFileSelect(file);
                  }}
                  className={`rounded-2xl border border-dashed p-5 transition ${
                    isDragging
                      ? "border-emerald-400/50 bg-emerald-400/10"
                      : "border-white/10 bg-zinc-950"
                  }`}
                >
                  <div className="text-sm text-zinc-300">
                    {isZh
                      ? "把剧本文件拖到这里，或点击上方按钮上传"
                      : "Drag your script file here, or click the upload button above"}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    {isZh
                      ? "支持：txt / md / text / docx / pdf"
                      : "Supported: txt / md / text / docx / pdf"}
                  </div>
                </div>
              </div>
            )}

            {sourceMode === "template" && (
              <div className="mb-5">
                <div className="mb-4 text-xl font-semibold">
                  {isZh ? "选择剧本模板" : "Choose a Script Template"}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {exampleScripts.map((item) => (
                    <button
                      key={item.title}
                      onClick={() => {
                        setScriptText(item.text);
                        setLoadedFileName(item.title);
                        saveDraftScript(item.text, item.title);
                      }}
                      className="rounded-2xl border border-white/10 bg-zinc-950 p-5 text-left transition hover:border-emerald-400/30"
                    >
                      <div className="text-lg font-semibold text-white">{item.title}</div>
                      <div className="mt-2 line-clamp-4 text-sm text-zinc-400">
                        {item.text}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sourceMode === "history" && (
              <div className="mb-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-xl font-semibold">
                    {isZh ? "从历史剧本导入" : "Import from History"}
                  </div>

                  <button
                    onClick={refreshHistoryScripts}
                    disabled={loadingHistory}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
                  >
                    {loadingHistory
                      ? isZh
                        ? "刷新中..."
                        : "Refreshing..."
                      : isZh
                      ? "刷新历史"
                      : "Refresh"}
                  </button>
                </div>

                {historyJobs.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5 text-sm text-zinc-400">
                    {isZh ? "暂时没有可导入的历史剧本" : "No reusable script history yet"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyJobs.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          const value = item.source_script || "";
                          setScriptText(value);
                          setLoadedFileName(item.script_title || item.id);
                          saveDraftScript(value, item.script_title || item.id);
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-zinc-950 p-4 text-left transition hover:border-emerald-400/30"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-semibold text-white">
                              {item.script_title || (isZh ? "未命名剧本" : "Untitled Script")}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {new Date(item.created_at).toLocaleString()}
                            </div>
                          </div>

                          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                            {item.status}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-zinc-950 p-4">
                <div className="text-xs text-zinc-500">{isZh ? "当前来源" : "Current Source"}</div>
                <div className="mt-2 text-sm text-white">
                  {sourceMode === "upload"
                    ? isZh
                      ? "文件上传"
                      : "File Upload"
                    : sourceMode === "paste"
                    ? isZh
                      ? "直接粘贴"
                      : "Direct Paste"
                    : sourceMode === "template"
                    ? isZh
                      ? "模板导入"
                      : "Template Import"
                    : isZh
                    ? "历史剧本"
                    : "History Import"}
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-4">
                <div className="text-xs text-zinc-500">{isZh ? "字数统计" : "Character Count"}</div>
                <div className="mt-2 text-sm text-white">{scriptStats.charCount}</div>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-4">
                <div className="text-xs text-zinc-500">{isZh ? "行数统计" : "Line Count"}</div>
                <div className="mt-2 text-sm text-white">{scriptStats.lineCount}</div>
              </div>
            </div>

            {loadedFileName && (
              <div className="mb-4 rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-300">
                {isZh ? "当前剧本：" : "Current script: "} {loadedFileName}
              </div>
            )}

            <div className="mb-3 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setScriptText("");
                  setLoadedFileName("");
                  setErrorMessage("");
                  localStorage.removeItem(DRAFT_SCRIPT_TEXT_KEY);
                  localStorage.removeItem(DRAFT_SCRIPT_NAME_KEY);
                }}
                disabled={submitting}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
              >
                {isZh ? "清空剧本" : "Clear Script"}
              </button>
            </div>

            <textarea
              value={scriptText}
              onChange={(e) => {
                setScriptText(e.target.value);
                saveDraftScript(e.target.value, loadedFileName || undefined);
              }}
              placeholder={
                isZh
                  ? "请粘贴你的短剧或漫剧剧本，例如：\n\n林晚：你为什么现在才回来？\n顾沉：因为我终于查到了真相。\n旁白：一场误会，把两个人推向了命运的交叉口……"
                  : "Paste your script here..."
              }
              rows={18}
              disabled={submitting || profile?.status === "banned"}
              className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-4 text-sm text-white outline-none placeholder:text-zinc-500"
            />

            {errorMessage && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleGenerate}
                disabled={submitting || profile?.status === "banned"}
                className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
              >
                {submitting
                  ? isZh
                    ? "AI 解析中..."
                    : "AI Analyzing..."
                  : isZh
                  ? "开始生成"
                  : "Start Generating"}
              </button>

              <Link
                href={`/${locale}/jobs`}
                className="rounded-xl border border-white/10 px-6 py-3 text-sm text-zinc-200"
              >
                {isZh ? "查看任务中心" : "Open Jobs Center"}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-4 text-xl font-semibold">
              {isZh ? "任务进度" : "Job Progress"}
            </div>

            <div className="rounded-2xl bg-zinc-950 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-300">{isZh ? "当前进度" : "Current Progress"}</span>
                <span className="text-zinc-400">{progress}%</span>
              </div>

              <div className="h-3 rounded-full bg-zinc-900">
                <div
                  className="h-3 rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {jobId && (
                <div className="mt-4 break-all text-xs text-zinc-500">
                  {isZh ? "任务 ID：" : "Job ID: "} {jobId}
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {steps.map((step, index) => {
                const done = index < currentStep;
                const active = index === currentStep && submitting;

                return (
                  <div
                    key={step}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      done
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : active
                        ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                        : "border-white/10 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{step}</span>
                      <span className="text-xs">
                        {done
                          ? isZh
                            ? "已完成"
                            : "Done"
                          : active
                          ? isZh
                            ? "进行中"
                            : "In Progress"
                          : isZh
                          ? "等待中"
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">
              {isZh
                ? "现在你可以从多个来源导入剧本，不用每次都重复找文件或重新粘贴。"
                : "You can now import scripts from multiple sources without repeatedly searching for files or repasting text."}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}