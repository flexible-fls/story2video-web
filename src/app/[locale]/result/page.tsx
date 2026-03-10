"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

type StoryboardItem = {
  shot: number;
  title: string;
  desc: string;
};

type ShotPromptItem = {
  shot: number;
  title: string;
  zhPrompt: string;
  enPrompt: string;
  negativePrompt: string;
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

type GenerationJobRow = {
  id: string;
  user_id: string;
  email: string | null;
  script_title: string | null;
  status: string;
  progress: number;
  result_url: string | null;
  error_message: string | null;
  plan: string;
  quota_cost: number;
  result_json: StructuredResultPayload | null;
  created_at: string;
  updated_at: string;
};

function loadLegacyResult(): StructuredResultPayload | null {
  if (typeof window === "undefined") return null;

  const script = localStorage.getItem("scriptText") || "";
  const title = localStorage.getItem("parsedTitle") || "";
  const aiTitle = localStorage.getItem("parsedAiTitle") || "";
  const projectType = localStorage.getItem("parsedProjectType") || "";
  const genre = localStorage.getItem("parsedGenre") || "";
  const spec = localStorage.getItem("parsedSpec") || "";
  const highlight = localStorage.getItem("parsedHighlight") || "";
  const summary = localStorage.getItem("parsedSummary") || "";
  const hook = localStorage.getItem("parsedHook") || "";
  const characters = JSON.parse(localStorage.getItem("parsedCharacters") || "[]");
  const storyboard = JSON.parse(localStorage.getItem("parsedStoryboard") || "[]");
  const coverCopy = JSON.parse(localStorage.getItem("parsedCoverCopy") || "[]");

  if (!script && !title && !summary) return null;

  return {
    title,
    aiTitle,
    projectType,
    genre,
    spec,
    highlight,
    summary,
    hook,
    coverCopy,
    characters,
    storyboard,
    script,
  };
}

function downloadTextFile(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildExportText(payload: StructuredResultPayload, isZh: boolean) {
  const lines: string[] = [];

  if (payload.preprocessInfo) {
    lines.push(isZh ? "【剧本识别信息】" : "[Preprocess Info]");
    lines.push(
      `${isZh ? "识别格式" : "Detected Format"}：${payload.preprocessInfo.detectedFormat || "-"}`
    );
    lines.push(
      `${isZh ? "预识别角色" : "Pre-detected Characters"}：${
        payload.preprocessInfo.extractedCharacters?.join(isZh ? "、" : ", ") || "-"
      }`
    );
    lines.push(
      `${isZh ? "场景提示" : "Scene Hints"}：${
        payload.preprocessInfo.extractedSceneHints?.join(isZh ? "；" : "; ") || "-"
      }`
    );
    lines.push("");
  }

  lines.push(isZh ? "【项目标题】" : "[Title]");
  lines.push(payload.title || "-");
  lines.push("");

  lines.push(isZh ? "【AI 标题】" : "[AI Title]");
  lines.push(payload.aiTitle || "-");
  lines.push("");

  lines.push(isZh ? "【项目类型】" : "[Project Type]");
  lines.push(payload.projectType || "-");
  lines.push("");

  lines.push(isZh ? "【题材类型】" : "[Genre]");
  lines.push(payload.genre || "-");
  lines.push("");

  lines.push(isZh ? "【规格】" : "[Spec]");
  lines.push(payload.spec || "-");
  lines.push("");

  lines.push(isZh ? "【亮点】" : "[Highlight]");
  lines.push(payload.highlight || "-");
  lines.push("");

  lines.push(isZh ? "【剧情摘要】" : "[Summary]");
  lines.push(payload.summary || "-");
  lines.push("");

  lines.push(isZh ? "【爆点文案】" : "[Hook]");
  lines.push(payload.hook || "-");
  lines.push("");

  lines.push(isZh ? "【封面文案】" : "[Cover Copy]");
  if (payload.coverCopy.length > 0) {
    payload.coverCopy.forEach((item, index) => {
      lines.push(`${index + 1}. ${item}`);
    });
  } else {
    lines.push("-");
  }
  lines.push("");

  lines.push(isZh ? "【角色列表】" : "[Characters]");
  if (payload.characters.length > 0) {
    payload.characters.forEach((item, index) => {
      lines.push(`${index + 1}. ${item}`);
    });
  } else {
    lines.push("-");
  }
  lines.push("");

  lines.push(isZh ? "【分镜脚本】" : "[Storyboard]");
  if (payload.storyboard.length > 0) {
    payload.storyboard.forEach((item) => {
      lines.push(`${isZh ? "镜头" : "Shot"} ${item.shot}: ${item.title}`);
      lines.push(item.desc);
      lines.push("");
    });
  } else {
    lines.push("-");
    lines.push("");
  }

  lines.push(isZh ? "【原始剧本】" : "[Original Script]");
  lines.push(payload.script || "-");

  return lines.join("\n");
}

function buildPromptExportText(prompts: ShotPromptItem[], isZh: boolean) {
  const lines: string[] = [];

  prompts.forEach((item) => {
    lines.push(`${isZh ? "镜头" : "Shot"} ${item.shot} - ${item.title}`);
    lines.push(isZh ? "【中文 Prompt】" : "[Chinese Prompt]");
    lines.push(item.zhPrompt);
    lines.push("");
    lines.push(isZh ? "【English Prompt】" : "[English Prompt]");
    lines.push(item.enPrompt);
    lines.push("");
    lines.push(isZh ? "【负面提示词】" : "[Negative Prompt]");
    lines.push(item.negativePrompt);
    lines.push("");
    lines.push("--------------------------------------------------");
    lines.push("");
  });

  return lines.join("\n");
}

export default function ResultPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";
  const jobId = searchParams.get("job");

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<GenerationJobRow | null>(null);
  const [payload, setPayload] = useState<StructuredResultPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [shotPrompts, setShotPrompts] = useState<ShotPromptItem[]>([]);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptInfo, setPromptInfo] = useState("");

  useEffect(() => {
    bootstrap();
  }, [jobId, locale, router]);

  async function bootstrap() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/${locale}/auth`);
      return;
    }

    if (jobId) {
      const { data, error } = await supabase
        .from("generation_jobs")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();

      if (error || !data) {
        setErrorMessage(isZh ? "没有找到对应的任务结果" : "Job result not found");
        const legacy = loadLegacyResult();
        if (legacy) setPayload(legacy);
        setLoading(false);
        return;
      }

      const row = data as GenerationJobRow;
      setJob(row);

      if (row.result_json) {
        setPayload(row.result_json);
      } else {
        const legacy = loadLegacyResult();
        if (legacy) setPayload(legacy);
      }

      setLoading(false);
      return;
    }

    const legacy = loadLegacyResult();
    if (legacy) {
      setPayload(legacy);
    } else {
      setErrorMessage(isZh ? "当前没有可展示的结果" : "No result available");
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!copyMessage) return;
    const timer = setTimeout(() => setCopyMessage(""), 1800);
    return () => clearTimeout(timer);
  }, [copyMessage]);

  const stats = useMemo(() => {
    if (!payload) return [];

    const scriptLength = payload.script.trim().length;

    return [
      {
        label: isZh ? "识别角色数" : "Characters",
        value: payload.characters.length,
      },
      {
        label: isZh ? "分镜条数" : "Storyboard Shots",
        value: payload.storyboard.length,
      },
      {
        label: isZh ? "封面文案" : "Cover Copies",
        value: payload.coverCopy.length,
      },
      {
        label: isZh ? "剧本字数" : "Script Length",
        value: scriptLength,
      },
    ];
  }, [payload, isZh]);

  function formatTime(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  }

  function formatPlan(plan?: string) {
    if (plan === "studio") return "Studio";
    if (plan === "pro") return "Pro";
    return "Free";
  }

  function formatJobStatus(status?: string) {
    if (status === "pending") return isZh ? "等待中" : "Pending";
    if (status === "processing") return isZh ? "生成中" : "Processing";
    if (status === "success") return isZh ? "成功" : "Success";
    if (status === "failed") return isZh ? "失败" : "Failed";
    return status || "-";
  }

  function getStatusStyle(status?: string) {
    if (status === "success") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    if (status === "failed") return "border-red-500/20 bg-red-500/10 text-red-300";
    if (status === "processing") return "border-blue-500/20 bg-blue-500/10 text-blue-300";
    return "border-white/10 bg-white/[0.03] text-zinc-300";
  }

  function formatDetectedFormat(format?: string) {
    if (!format) return "-";
    if (!isZh) return format;

    if (format === "dialogue") return "对话体";
    if (format === "screenplay") return "短剧 / 分场体";
    if (format === "novel") return "小说体";
    if (format === "mixed") return "混合体";
    if (format === "unknown") return "未识别";
    return format;
  }

  async function copyStructuredResult() {
    if (!payload) return;
    const text = buildExportText(payload, isZh);
    await navigator.clipboard.writeText(text);
    setCopyMessage(isZh ? "结构化结果已复制" : "Structured result copied");
  }

  async function copyScriptOnly() {
    if (!payload?.script) return;
    await navigator.clipboard.writeText(payload.script);
    setCopyMessage(isZh ? "原始剧本已复制" : "Original script copied");
  }

  async function copyPromptText(text: string) {
    await navigator.clipboard.writeText(text);
    setCopyMessage(isZh ? "Prompt 已复制" : "Prompt copied");
  }

  function exportJson() {
    if (!payload) return;
    const fileName = `${payload.title || "result"}.json`;
    downloadTextFile(fileName, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  }

  function exportTxt() {
    if (!payload) return;
    const fileName = `${payload.title || "result"}.txt`;
    const text = buildExportText(payload, isZh);
    downloadTextFile(fileName, text);
  }

  function exportPromptTxt() {
    if (!payload || shotPrompts.length === 0) return;
    const fileName = `${payload.title || "result"}-shot-prompts.txt`;
    const text = buildPromptExportText(shotPrompts, isZh);
    downloadTextFile(fileName, text);
  }

  async function handleGenerateShotPrompts() {
    if (!payload) return;

    setPromptLoading(true);
    setPromptInfo("");

    try {
      const res = await fetch("/api/generate-shot-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale,
          result: payload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || (isZh ? "分镜 Prompt 生成失败" : "Prompt generation failed"));
      }

      setShotPrompts(Array.isArray(data?.prompts) ? data.prompts : []);
      if (data?.provider && data?.model) {
        setPromptInfo(`${data.provider} / ${data.model}`);
      }
    } catch (error) {
      setPromptInfo(
        error instanceof Error
          ? error.message
          : isZh
          ? "分镜 Prompt 生成失败"
          : "Prompt generation failed"
      );
    } finally {
      setPromptLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06070a] text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "结果加载中..." : "Loading result..."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[100px] h-[320px] w-[320px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-120px] top-[220px] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}/jobs`} />
            <div>
              <div className="text-xl font-semibold tracking-tight text-white">FulushouVideo</div>
              <div className="text-xs text-zinc-400">
                {isZh ? "生成结果" : "Generation Result"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/jobs`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
            >
              {isZh ? "任务中心" : "Jobs"}
            </Link>
            <Link
              href={`/${locale}/generate`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
            >
              {isZh ? "重新生成" : "Generate Again"}
            </Link>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-10 pt-16">
        <div className="grid items-start gap-10 xl:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-medium text-emerald-300">
              {isZh ? "结构化结果页" : "Structured Result"}
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">
              {isZh ? "查看你的生成结果与结构化内容" : "Review your generated structured output"}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              {isZh
                ? "这里会展示剧本解析后的结构化结果，包括项目信息、剧情摘要、角色列表、分镜脚本、剧本识别信息、封面文案建议，以及下一步可直接用于出图的分镜 Prompt。"
                : "This page shows your structured output, including project info, story summary, characters, storyboard, preprocess info, cover copy, and image-ready shot prompts for the next production step."}
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                >
                  <div className="text-sm text-zinc-400">{item.label}</div>
                  <div className="mt-3 text-3xl font-bold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-emerald-400/10 via-transparent to-cyan-400/10 blur-xl" />
            <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="text-3xl font-bold text-white">
                {isZh ? "任务摘要" : "Job Summary"}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                {isZh ? "当前任务的状态、套餐和结果入口。" : "Status, plan, and result access for the current job."}
              </div>

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              {copyMessage && (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                  {copyMessage}
                </div>
              )}

              <div className="mt-6 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "任务状态" : "Job Status"}</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className={`rounded-full border px-3 py-1 text-sm ${getStatusStyle(job?.status)}`}>
                    {formatJobStatus(job?.status)}
                  </div>
                  <div className="text-sm text-zinc-300">
                    {isZh ? `进度 ${job?.progress ?? 0}%` : `Progress ${job?.progress ?? 0}%`}
                  </div>
                </div>
                <div className="mt-4 h-3 rounded-full bg-zinc-900">
                  <div
                    className={`h-3 rounded-full ${
                      job?.status === "success"
                        ? "bg-emerald-400"
                        : job?.status === "failed"
                        ? "bg-red-400"
                        : job?.status === "processing"
                        ? "bg-blue-400"
                        : "bg-zinc-400"
                    }`}
                    style={{ width: `${Math.max(Math.min(job?.progress ?? 0, 100), job?.progress ? 6 : 0)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/8 bg-black/40 p-5">
                  <div className="text-sm text-zinc-400">{isZh ? "套餐" : "Plan"}</div>
                  <div className="mt-3 text-3xl font-bold text-white">{formatPlan(job?.plan)}</div>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-black/40 p-5">
                  <div className="text-sm text-zinc-400">{isZh ? "消耗额度" : "Quota Cost"}</div>
                  <div className="mt-3 text-3xl font-bold text-white">{job?.quota_cost ?? 0}</div>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "创建时间" : "Created At"}</div>
                <div className="mt-3 text-base text-zinc-200">{formatTime(job?.created_at)}</div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-5">
                <div className="text-sm text-zinc-400">{isZh ? "更新时间" : "Updated At"}</div>
                <div className="mt-3 text-base text-zinc-200">{formatTime(job?.updated_at)}</div>
              </div>

              {job?.error_message ? (
                <div className="mt-4 rounded-[24px] border border-red-500/20 bg-red-500/10 p-5">
                  <div className="text-sm text-red-300">{isZh ? "错误信息" : "Error Message"}</div>
                  <div className="mt-3 text-sm leading-7 text-red-200">{job.error_message}</div>
                </div>
              ) : null}

              {payload ? (
                <div className="mt-6 rounded-[24px] border border-white/8 bg-black/40 p-5">
                  <div className="mb-4 text-sm text-zinc-400">
                    {isZh ? "导出与复制" : "Export & Copy"}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={exportJson}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07]"
                    >
                      {isZh ? "导出 JSON" : "Export JSON"}
                    </button>

                    <button
                      onClick={exportTxt}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07]"
                    >
                      {isZh ? "导出 TXT" : "Export TXT"}
                    </button>

                    <button
                      onClick={copyStructuredResult}
                      className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/15"
                    >
                      {isZh ? "复制结构化结果" : "Copy Structured Result"}
                    </button>

                    <button
                      onClick={copyScriptOnly}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07]"
                    >
                      {isZh ? "复制原始剧本" : "Copy Script"}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {job?.result_url ? (
                  <a
                    href={job.result_url}
                    className="rounded-2xl bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
                  >
                    {isZh ? "打开结果链接" : "Open Result URL"}
                  </a>
                ) : (
                  <Link
                    href={`/${locale}/jobs`}
                    className="rounded-2xl bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-black transition hover:bg-emerald-300"
                  >
                    {isZh ? "返回任务中心" : "Back to Jobs"}
                  </Link>
                )}

                <Link
                  href={`/${locale}/generate`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-center text-sm text-zinc-200 transition hover:bg-white/[0.07]"
                >
                  {isZh ? "继续生成" : "Generate Again"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!payload ? (
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-10 text-center">
            <div className="text-2xl font-bold text-white">
              {isZh ? "当前没有可展示的结构化结果" : "No structured result available"}
            </div>
            <div className="mt-3 text-zinc-400">
              {isZh ? "你可以返回任务中心，或者重新创建新的生成任务。" : "You can go back to the jobs center or start a new generation."}
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href={`/${locale}/jobs`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm text-zinc-200"
              >
                {isZh ? "返回任务中心" : "Back to Jobs"}
              </Link>
              <Link
                href={`/${locale}/generate`}
                className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black"
              >
                {isZh ? "去生成" : "Create Now"}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-zinc-900/90 via-zinc-900/80 to-zinc-900/90 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
              <div className="max-w-4xl">
                <div className="text-sm font-medium text-emerald-300">
                  {isZh ? "项目定位" : "Project Snapshot"}
                </div>
                <h2 className="mt-3 text-4xl font-bold leading-tight text-white">
                  {payload.aiTitle || payload.title || (isZh ? "未命名项目" : "Untitled Project")}
                </h2>
                <p className="mt-4 text-base leading-8 text-zinc-300">
                  {payload.summary || (isZh ? "暂无剧情摘要" : "No story summary yet.")}
                </p>
              </div>
            </div>
          </section>

          {payload.preprocessInfo ? (
            <section className="mx-auto max-w-7xl px-6 py-12">
              <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-emerald-300">
                      {isZh ? "剧本识别信息" : "Script Recognition Info"}
                    </div>
                    <div className="mt-2 text-3xl font-bold text-white">
                      {isZh ? "系统对剧本的预识别结果" : "System preprocessing insights"}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "识别格式" : "Detected Format"}</div>
                    <div className="mt-3 text-xl font-semibold text-white">
                      {formatDetectedFormat(payload.preprocessInfo.detectedFormat)}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "预识别角色" : "Pre-detected Characters"}</div>
                    <div className="mt-3 text-sm leading-7 text-zinc-300">
                      {payload.preprocessInfo.extractedCharacters.length > 0
                        ? payload.preprocessInfo.extractedCharacters.join(isZh ? "、" : ", ")
                        : "-"}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "场景提示" : "Scene Hints"}</div>
                    <div className="mt-3 text-sm leading-7 text-zinc-300">
                      {payload.preprocessInfo.extractedSceneHints.length > 0
                        ? payload.preprocessInfo.extractedSceneHints.join(isZh ? "；" : "; ")
                        : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7 xl:col-span-2">
                <div className="mb-5 text-3xl font-bold text-white">
                  {isZh ? "项目信息" : "Project Information"}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "剧名" : "Title"}</div>
                    <div className="mt-3 text-xl font-semibold text-white">{payload.title || "-"}</div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "AI 标题" : "AI Title"}</div>
                    <div className="mt-3 text-xl font-semibold text-white">{payload.aiTitle || "-"}</div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "项目类型" : "Project Type"}</div>
                    <div className="mt-3 text-xl font-semibold text-white">{payload.projectType || "-"}</div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "题材类型" : "Genre"}</div>
                    <div className="mt-3 text-xl font-semibold text-white">{payload.genre || "-"}</div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "规格" : "Spec"}</div>
                    <div className="mt-3 text-xl font-semibold text-white">{payload.spec || "-"}</div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                    <div className="text-sm text-zinc-400">{isZh ? "亮点" : "Highlight"}</div>
                    <div className="mt-3 text-sm leading-7 text-zinc-300">{payload.highlight || "-"}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
                <div className="mb-5 text-3xl font-bold text-white">
                  {isZh ? "爆点文案" : "Hook Copy"}
                </div>

                <div className="rounded-[24px] border border-emerald-400/15 bg-emerald-400/10 p-5 text-base leading-8 text-zinc-100">
                  {payload.hook || (isZh ? "暂无爆点文案" : "No hook copy")}
                </div>

                <div className="mt-5 text-sm text-zinc-400">
                  {isZh ? "这部分适合首页传播、封面文案和短视频开头钩子。" : "This section is suitable for cover text, distribution hooks, and opening lines."}
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-emerald-300">
                    {isZh ? "封面文案建议" : "Cover Copy Suggestions"}
                  </div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {isZh ? "更适合传播的标题与封面内容" : "Copy ideas better suited for distribution"}
                  </div>
                </div>
              </div>

              {payload.coverCopy.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {payload.coverCopy.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="rounded-[24px] border border-white/8 bg-black/25 p-5 text-sm leading-7 text-zinc-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-white/8 bg-black/25 p-5 text-zinc-400">
                  {isZh ? "暂无封面文案建议" : "No cover copy suggestions"}
                </div>
              )}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7 xl:col-span-2">
                <div className="mb-5 text-3xl font-bold text-white">
                  {isZh ? "剧情摘要" : "Story Summary"}
                </div>
                <div className="rounded-[24px] border border-white/8 bg-black/25 p-5 whitespace-pre-wrap text-base leading-8 text-zinc-200">
                  {payload.summary || (isZh ? "暂无剧情摘要" : "No summary")}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
                <div className="mb-5 text-3xl font-bold text-white">
                  {isZh ? "角色列表" : "Characters"}
                </div>

                {payload.characters.length > 0 ? (
                  <div className="space-y-3">
                    {payload.characters.map((name) => (
                      <div
                        key={name}
                        className="rounded-[24px] border border-white/8 bg-black/25 p-5"
                      >
                        <div className="text-lg font-semibold text-white">{name}</div>
                        <div className="mt-2 text-sm text-zinc-400">
                          {isZh ? "从剧本中自动识别" : "Auto-detected from script"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-white/8 bg-black/25 p-5 text-zinc-400">
                    {isZh ? "暂无角色数据" : "No character data"}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-emerald-300">
                    {isZh ? "分镜脚本" : "Storyboard"}
                  </div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {isZh ? "适合短剧与漫剧制作的镜头结构" : "Shot structure for drama and comic production"}
                  </div>
                </div>
              </div>

              {payload.storyboard.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {payload.storyboard.map((item) => (
                    <div
                      key={item.shot}
                      className="rounded-[24px] border border-white/8 bg-black/25 p-5"
                    >
                      <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                        {isZh ? `镜头 ${item.shot}` : `Shot ${item.shot}`}
                      </div>
                      <div className="mt-4 text-xl font-semibold text-white">{item.title}</div>
                      <div className="mt-3 text-sm leading-7 text-zinc-300">{item.desc}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-white/8 bg-black/25 p-5 text-zinc-400">
                  {isZh ? "暂无分镜数据" : "No storyboard data"}
                </div>
              )}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="rounded-[32px] border border-emerald-400/20 bg-gradient-to-b from-emerald-400/10 to-zinc-950 p-7">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-medium text-emerald-300">
                    {isZh ? "AI 出图 Prompt" : "AI Image Prompts"}
                  </div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {isZh ? "把分镜直接变成出图提示词" : "Turn storyboard into image-ready prompts"}
                  </div>
                  <div className="mt-3 text-sm leading-7 text-zinc-300">
                    {isZh
                      ? "这是 AI 生产链的下一环。你可以先生成每个镜头的出图 Prompt，后续再接图像模型与视频模型。"
                      : "This is the next stage of the AI production chain. Generate image prompts for each shot before connecting image and video models."}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleGenerateShotPrompts}
                    disabled={promptLoading}
                    className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    {promptLoading
                      ? isZh
                        ? "生成中..."
                        : "Generating..."
                      : isZh
                      ? "生成分镜 Prompt"
                      : "Generate Shot Prompts"}
                  </button>

                  <button
                    onClick={exportPromptTxt}
                    disabled={shotPrompts.length === 0}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm text-zinc-200 disabled:opacity-50"
                  >
                    {isZh ? "导出 Prompt" : "Export Prompts"}
                  </button>
                </div>
              </div>

              {promptInfo && (
                <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                  {promptInfo}
                </div>
              )}

              {shotPrompts.length === 0 ? (
                <div className="rounded-[24px] border border-white/8 bg-black/25 p-5 text-zinc-400">
                  {isZh
                    ? "还没有生成 Prompt。点击上方按钮后，系统会为每个镜头生成中文 Prompt、英文 Prompt 和负面提示词。"
                    : "No prompts generated yet. Click the button above to create Chinese prompts, English prompts, and negative prompts for each shot."}
                </div>
              ) : (
                <div className="space-y-5">
                  {shotPrompts.map((item) => (
                    <div
                      key={`${item.shot}-${item.title}`}
                      className="rounded-[24px] border border-white/8 bg-black/25 p-5"
                    >
                      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                            {isZh ? `镜头 ${item.shot}` : `Shot ${item.shot}`}
                          </div>
                          <div className="mt-3 text-xl font-semibold text-white">{item.title}</div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => copyPromptText(item.zhPrompt)}
                            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-zinc-200"
                          >
                            {isZh ? "复制中文 Prompt" : "Copy ZH Prompt"}
                          </button>
                          <button
                            onClick={() => copyPromptText(item.enPrompt)}
                            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-zinc-200"
                          >
                            {isZh ? "复制英文 Prompt" : "Copy EN Prompt"}
                          </button>
                          <button
                            onClick={() => copyPromptText(item.negativePrompt)}
                            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-zinc-200"
                          >
                            {isZh ? "复制负面词" : "Copy Negative"}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-3">
                        <div className="rounded-[20px] border border-white/8 bg-zinc-950 p-4">
                          <div className="text-sm font-medium text-emerald-300">
                            {isZh ? "中文 Prompt" : "Chinese Prompt"}
                          </div>
                          <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                            {item.zhPrompt}
                          </div>
                        </div>

                        <div className="rounded-[20px] border border-white/8 bg-zinc-950 p-4">
                          <div className="text-sm font-medium text-emerald-300">
                            {isZh ? "英文 Prompt" : "English Prompt"}
                          </div>
                          <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                            {item.enPrompt}
                          </div>
                        </div>

                        <div className="rounded-[20px] border border-white/8 bg-zinc-950 p-4">
                          <div className="text-sm font-medium text-emerald-300">
                            {isZh ? "负面提示词" : "Negative Prompt"}
                          </div>
                          <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                            {item.negativePrompt}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-emerald-300">
                    {isZh ? "原始剧本" : "Original Script"}
                  </div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {isZh ? "本次生成使用的剧本内容" : "Script content used for this job"}
                  </div>
                </div>
              </div>

              <pre className="overflow-auto rounded-[24px] border border-white/8 bg-black/25 p-5 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {payload.script || (isZh ? "暂无剧本内容" : "No script content")}
              </pre>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-20">
            <div className="relative overflow-hidden rounded-[36px] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 via-emerald-400/10 to-cyan-400/10 p-10 text-center shadow-[0_20px_80px_rgba(16,185,129,0.08)]">
              <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative text-sm font-medium text-emerald-200">
                {isZh ? "继续创作" : "Continue Creating"}
              </div>

              <h2 className="relative mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
                {isZh ? "继续创建新的任务，让内容生产持续推进" : "Create new jobs and keep your workflow moving"}
              </h2>

              <p className="relative mx-auto mt-4 max-w-3xl text-base leading-8 text-zinc-200">
                {isZh
                  ? "你现在已经能把剧本解析成结构化结果，并进一步生成出图 Prompt。下一步就可以继续接入图片生成。"
                  : "You can now turn scripts into structured results and then into image-ready prompts. The next step is connecting image generation."}
              </p>

              <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={`/${locale}/jobs`}
                  className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  {isZh ? "返回任务中心" : "Back to Jobs"}
                </Link>

                <Link
                  href={`/${locale}/generate`}
                  className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
                >
                  {isZh ? "继续生成" : "Generate Again"}
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}