"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

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

async function readTextFile(file: File) {
  return await file.text();
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

    const { data } = await supabase
      .from("profiles")
      .select("id,email,plan,monthly_quota,used_count,status,role")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setProfile(data as ProfileRow);
    }

    const draft = loadDraftScript();
    if (draft.text) setScriptText(draft.text);
    if (draft.fileName) setLoadedFileName(draft.fileName);
  }

  async function handleFileSelect(file: File) {
    setReadingFile(true);
    setErrorMessage("");

    try {
      const lowerName = file.name.toLowerCase();

      if (
        !lowerName.endsWith(".txt") &&
        !lowerName.endsWith(".md") &&
        !lowerName.endsWith(".text")
      ) {
        throw new Error(
          isZh
            ? "当前版本先支持 txt / md / text 文件，请先用文本文件上传。"
            : "This version currently supports txt / md / text files only."
        );
      }

      const text = await readTextFile(file);

      if (!text.trim()) {
        throw new Error(isZh ? "上传文件内容为空" : "The uploaded file is empty");
      }

      setScriptText(text);
      setLoadedFileName(file.name);
      saveDraftScript(text, file.name);
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
              ? "首页带过来的剧本会自动显示在这里。你可以继续编辑，或者重新上传 txt / md 文本文件。点击开始生成后，系统会调用 AI 生成结构化结果。"
              : "The script from the homepage is automatically loaded here. You can continue editing or re-upload a text file. When you start generation, the system calls AI to create structured output."}
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xl font-semibold">
                {isZh ? "剧本输入" : "Script Input"}
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.text"
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
                    ? "重新上传文件"
                    : "Upload File"}
                </button>

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
            </div>

            {loadedFileName && (
              <div className="mb-4 text-sm text-zinc-500">
                {isZh ? "当前文件：" : "Current file: "} {loadedFileName}
              </div>
            )}

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
                ? "这一版已经支持多模型切换。当前默认建议用 DeepSeek 跑通流程，后续可通过环境变量切回 OpenAI。"
                : "This version supports multi-provider switching. DeepSeek is recommended for now, and you can switch back to OpenAI via environment variables later."}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}