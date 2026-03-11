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

type ShotImageItem = {
  shot: number;
  title: string;
  imageUrl: string;
  promptUsed: string;
  revisedPrompt?: string;
};

type VideoTaskItem = {
  id: string;
  shot: number;
  title: string;
  imageUrl: string;
  promptText: string;
  provider: "runway";
  providerTaskId: string;
  status: "queued" | "processing" | "succeeded" | "failed" | "unknown";
  model: string;
  ratio: string;
  duration: number;
  videoUrl?: string;
  errorMessage?: string;
  createdAt: string;
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
  preprocessInfo?: {
    detectedFormat: string;
    extractedCharacters: string[];
    extractedSceneHints: string[];
  };
  shotPrompts?: ShotPromptItem[];
  shotImages?: ShotImageItem[];
  videoTasks?: VideoTaskItem[];
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

function createVideoPrompt(shot: ShotImageItem, isZh: boolean) {
  return isZh
    ? `请基于这张镜头图生成一个高质量短视频镜头，保持角色一致性、场景一致性和镜头氛围，动作自然，运镜平稳，电影感光影，时长 5 秒，适合短剧与漫剧内容生产。镜头标题：${shot.title}`
    : `Create a high-quality short video shot based on this frame. Keep character consistency, scene consistency, cinematic lighting, natural motion, smooth camera movement, and a polished short-drama/comic style. Duration 5 seconds. Shot title: ${shot.title}`;
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
  const [shotImages, setShotImages] = useState<ShotImageItem[]>([]);
  const [videoTasks, setVideoTasks] = useState<VideoTaskItem[]>([]);

  const [videoActionLoadingId, setVideoActionLoadingId] = useState<string>("");
  const [videoInfo, setVideoInfo] = useState("");

  useEffect(() => {
    bootstrap();
  }, [jobId, locale, router]);

  useEffect(() => {
    if (!copyMessage) return;
    const timer = setTimeout(() => setCopyMessage(""), 1800);
    return () => clearTimeout(timer);
  }, [copyMessage]);

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
        if (legacy) {
          setPayload(legacy);
          setShotPrompts(legacy.shotPrompts || []);
          setShotImages(legacy.shotImages || []);
          setVideoTasks(legacy.videoTasks || []);
        }
        setLoading(false);
        return;
      }

      const row = data as GenerationJobRow;
      setJob(row);

      if (row.result_json) {
        setPayload(row.result_json);
        setShotPrompts(row.result_json.shotPrompts || []);
        setShotImages(row.result_json.shotImages || []);
        setVideoTasks(row.result_json.videoTasks || []);
      } else {
        const legacy = loadLegacyResult();
        if (legacy) {
          setPayload(legacy);
          setShotPrompts(legacy.shotPrompts || []);
          setShotImages(legacy.shotImages || []);
          setVideoTasks(legacy.videoTasks || []);
        }
      }

      setLoading(false);
      return;
    }

    const legacy = loadLegacyResult();
    if (legacy) {
      setPayload(legacy);
      setShotPrompts(legacy.shotPrompts || []);
      setShotImages(legacy.shotImages || []);
      setVideoTasks(legacy.videoTasks || []);
    } else {
      setErrorMessage(isZh ? "当前没有可展示的结果" : "No result available");
    }

    setLoading(false);
  }

  async function persistResult(
    nextPayload: StructuredResultPayload
  ) {
    setPayload(nextPayload);

    if (!jobId) return;

    await supabase
      .from("generation_jobs")
      .update({
        result_json: nextPayload,
      })
      .eq("id", jobId);
  }

  async function syncPayload(
    nextShotPrompts?: ShotPromptItem[],
    nextShotImages?: ShotImageItem[],
    nextVideoTasks?: VideoTaskItem[]
  ) {
    if (!payload) return;

    const updatedPayload: StructuredResultPayload = {
      ...payload,
      shotPrompts: nextShotPrompts ?? shotPrompts,
      shotImages: nextShotImages ?? shotImages,
      videoTasks: nextVideoTasks ?? videoTasks,
    };

    if (nextShotPrompts) setShotPrompts(nextShotPrompts);
    if (nextShotImages) setShotImages(nextShotImages);
    if (nextVideoTasks) setVideoTasks(nextVideoTasks);

    await persistResult(updatedPayload);
  }

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
        label: isZh ? "镜头图数量" : "Shot Images",
        value: shotImages.length,
      },
      {
        label: isZh ? "视频任务数" : "Video Tasks",
        value: videoTasks.length,
      },
    ];
  }, [payload, isZh, shotImages.length, videoTasks.length]);

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

  function formatVideoTaskStatus(status: VideoTaskItem["status"]) {
    if (status === "queued") return isZh ? "排队中" : "Queued";
    if (status === "processing") return isZh ? "生成中" : "Processing";
    if (status === "succeeded") return isZh ? "成功" : "Succeeded";
    if (status === "failed") return isZh ? "失败" : "Failed";
    return isZh ? "未知" : "Unknown";
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
    setCopyMessage(isZh ? "内容已复制" : "Copied");
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

  async function handleCreateVideoTask(shot: ShotImageItem) {
    setVideoActionLoadingId(`create-${shot.shot}`);
    setVideoInfo("");

    try {
      const promptText = createVideoPrompt(shot, isZh);

      const response = await fetch("/api/video/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: shot.imageUrl,
          promptText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || (isZh ? "创建视频任务失败" : "Failed to create video task"));
      }

      const now = new Date().toISOString();
      const newTask: VideoTaskItem = {
        id: `${shot.shot}-${data.providerTaskId}`,
        shot: shot.shot,
        title: shot.title,
        imageUrl: shot.imageUrl,
        promptText,
        provider: "runway",
        providerTaskId: data.providerTaskId,
        status: data.status || "queued",
        model: data.model || "gen4.5",
        ratio: data.ratio || "1280:720",
        duration: data.duration || 5,
        createdAt: now,
        updatedAt: now,
      };

      const nextTasks = [newTask, ...videoTasks.filter((item) => item.id !== newTask.id)];
      await syncPayload(undefined, undefined, nextTasks);

      setVideoInfo(
        isZh
          ? `已创建视频任务：镜头 ${shot.shot}`
          : `Video task created for shot ${shot.shot}`
      );
    } catch (error) {
      setVideoInfo(
        error instanceof Error
          ? error.message
          : isZh
          ? "创建视频任务失败"
          : "Failed to create video task"
      );
    } finally {
      setVideoActionLoadingId("");
    }
  }

  async function handleRefreshVideoTask(task: VideoTaskItem) {
    setVideoActionLoadingId(`refresh-${task.providerTaskId}`);
    setVideoInfo("");

    try {
      const response = await fetch(`/api/video/status/${task.providerTaskId}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || (isZh ? "查询视频任务失败" : "Failed to query video task"));
      }

      const nextTasks = videoTasks.map((item) => {
        if (item.providerTaskId !== task.providerTaskId) return item;

        return {
          ...item,
          status: data.status || item.status,
          videoUrl: data.videoUrl || item.videoUrl,
          errorMessage: data.errorMessage || item.errorMessage,
          updatedAt: new Date().toISOString(),
        };
      });

      await syncPayload(undefined, undefined, nextTasks);

      setVideoInfo(
        isZh
          ? `已刷新视频任务：镜头 ${task.shot}`
          : `Video task refreshed for shot ${task.shot}`
      );
    } catch (error) {
      setVideoInfo(
        error instanceof Error
          ? error.message
          : isZh
          ? "查询视频任务失败"
          : "Failed to query video task"
      );
    } finally {
      setVideoActionLoadingId("");
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
              {isZh ? "查看你的生成结果与视频工作流" : "Review your result and video workflow"}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              {isZh
                ? "这里会展示剧本解析后的结构化结果、分镜 Prompt、镜头图片，以及最新接入的图生视频任务。"
                : "This page shows structured script results, shot prompts, shot images, and the newly integrated image-to-video workflow."}
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
                {isZh ? "当前任务状态与导出入口。" : "Current job status and export actions."}
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
          </div>
        </section>
      ) : (
        <>
          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-zinc-900/90 via-zinc-900/80 to-zinc-900/90 p-8">
              <div className="max-w-4xl">
                <div className="text-sm font-medium text-emerald-300">
                  {isZh ? "项目定位" : "Project Snapshot"}
                </div>
                <h2 className="mt-3 text-4xl font-bold leading-tight text-white">
                  {payload.aiTitle || payload.title || (isZh ? "未命名项目" : "Untitled Project")}
                </h2>
                <p className="mt-4 text-base leading-8 text-zinc-300">
                  {payload.summary || (isZh ? "暂无剧情摘要" : "No summary")}
                </p>
              </div>
            </div>
          </section>

          {payload.preprocessInfo ? (
            <section className="mx-auto max-w-7xl px-6 py-12">
              <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
                <div className="mb-5">
                  <div className="text-sm font-medium text-emerald-300">
                    {isZh ? "剧本识别信息" : "Script Recognition Info"}
                  </div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {isZh ? "系统对剧本的预识别结果" : "System preprocessing insights"}
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
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
              <div className="mb-5 text-3xl font-bold text-white">
                {isZh ? "封面文案建议" : "Cover Copy Suggestions"}
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
              <div className="mb-5 text-3xl font-bold text-white">
                {isZh ? "分镜脚本" : "Storyboard"}
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
              <div className="mb-5 text-3xl font-bold text-white">
                {isZh ? "镜头 Prompt" : "Shot Prompts"}
              </div>

              {shotPrompts.length > 0 ? (
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
              ) : (
                <div className="rounded-[24px] border border-white/8 bg-black/25 p-5 text-zinc-400">
                  {isZh ? "还没有镜头 Prompt 数据" : "No shot prompts yet"}
                </div>
              )}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="rounded-[32px] border border-cyan-400/20 bg-gradient-to-b from-cyan-400/10 to-zinc-950 p-7">
              <div className="mb-5">
                <div className="text-sm font-medium text-cyan-300">
                  {isZh ? "镜头图片与图生视频" : "Shot Images & Image-to-Video"}
                </div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {isZh ? "基于镜头图直接创建视频任务" : "Create video tasks directly from shot images"}
                </div>
                <div className="mt-3 text-sm leading-7 text-zinc-300">
                  {isZh
                    ? "每张镜头图都可以单独发起视频生成，这样你后面就能按镜头逐个修改、逐个重做。"
                    : "Each shot image can create its own video task, so you can revise and retry shot by shot later."}
                </div>
              </div>

              {videoInfo && (
                <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                  {videoInfo}
                </div>
              )}

              {shotImages.length > 0 ? (
                <div className="space-y-6">
                  {shotImages.map((item) => {
                    const relatedTasks = videoTasks.filter((task) => task.shot === item.shot);

                    return (
                      <div
                        key={`${item.shot}-${item.title}`}
                        className="rounded-[24px] border border-white/8 bg-black/25 p-5"
                      >
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                              {isZh ? `镜头 ${item.shot}` : `Shot ${item.shot}`}
                            </div>
                            <div className="mt-3 text-xl font-semibold text-white">{item.title}</div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleCreateVideoTask(item)}
                              disabled={videoActionLoadingId === `create-${item.shot}`}
                              className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
                            >
                              {videoActionLoadingId === `create-${item.shot}`
                                ? isZh
                                  ? "创建中..."
                                  : "Creating..."
                                : isZh
                                ? "生成该镜头视频"
                                : "Create Video for This Shot"}
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                          <div className="overflow-hidden rounded-[20px] border border-white/8 bg-zinc-950">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="space-y-4">
                            {relatedTasks.length > 0 ? (
                              relatedTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="rounded-[20px] border border-white/8 bg-zinc-950 p-4"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-sm text-zinc-400">
                                      {isZh ? "任务状态" : "Task Status"}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-200">
                                        {formatVideoTaskStatus(task.status)}
                                      </div>
                                      <button
                                        onClick={() => handleRefreshVideoTask(task)}
                                        disabled={videoActionLoadingId === `refresh-${task.providerTaskId}`}
                                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-zinc-200 disabled:opacity-50"
                                      >
                                        {videoActionLoadingId === `refresh-${task.providerTaskId}`
                                          ? isZh
                                            ? "刷新中..."
                                            : "Refreshing..."
                                          : isZh
                                          ? "刷新状态"
                                          : "Refresh Status"}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-4 text-sm leading-7 text-zinc-300">
                                    {task.promptText}
                                  </div>

                                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-xl border border-white/8 bg-black/30 p-3 text-xs text-zinc-300">
                                      {isZh ? "模型" : "Model"}：{task.model}
                                    </div>
                                    <div className="rounded-xl border border-white/8 bg-black/30 p-3 text-xs text-zinc-300">
                                      {isZh ? "比例" : "Ratio"}：{task.ratio}
                                    </div>
                                    <div className="rounded-xl border border-white/8 bg-black/30 p-3 text-xs text-zinc-300">
                                      {isZh ? "时长" : "Duration"}：{task.duration}s
                                    </div>
                                  </div>

                                  {task.videoUrl ? (
                                    <div className="mt-4 overflow-hidden rounded-xl border border-white/8 bg-black/30 p-3">
                                      <video
                                        src={task.videoUrl}
                                        controls
                                        className="w-full rounded-lg"
                                      />
                                    </div>
                                  ) : null}

                                  {task.errorMessage ? (
                                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                                      {task.errorMessage}
                                    </div>
                                  ) : null}
                                </div>
                              ))
                            ) : (
                              <div className="rounded-[20px] border border-white/8 bg-zinc-950 p-4 text-sm leading-7 text-zinc-400">
                                {isZh
                                  ? "这个镜头还没有视频任务。点击右上角按钮即可基于这张图创建图生视频任务。"
                                  : "This shot has no video task yet. Click the button above to create an image-to-video task from this image."}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[24px] border border-white/8 bg-black/25 p-5 text-zinc-400">
                  {isZh ? "还没有镜头图片，暂时不能发起图生视频任务。" : "No shot images yet, so image-to-video tasks cannot be started."}
                </div>
              )}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
              <div className="mb-5 text-3xl font-bold text-white">
                {isZh ? "原始剧本" : "Original Script"}
              </div>

              <pre className="overflow-auto rounded-[24px] border border-white/8 bg-black/25 p-5 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {payload.script || (isZh ? "暂无剧本内容" : "No script content")}
              </pre>
            </div>
          </section>
        </>
      )}
    </main>
  );
}