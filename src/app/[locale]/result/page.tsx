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
                ? "这里会展示剧本解析后的结构化结果，包括项目信息、剧情摘要、角色列表、分镜脚本和封面文案建议。"
                : "This page shows your structured output, including project info, story summary, characters, storyboard, and cover copy suggestions."}
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
                  ? "你可以返回任务中心查看全部任务，也可以继续上传新剧本开始下一轮生成。"
                  : "You can go back to the jobs center or upload a new script to start the next generation."}
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