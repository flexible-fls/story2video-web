"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
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
        label: isZh ? "封面文案条数" : "Cover Copy Items",
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

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "结果加载中..." : "Loading result..."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
            <div className="text-xs text-zinc-400">
              {isZh ? "生成结果" : "Generation Result"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/jobs`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {isZh ? "任务中心" : "Jobs"}
            </Link>
            <Link
              href={`/${locale}/generate`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {isZh ? "重新生成" : "Generate Again"}
            </Link>
            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
            {isZh ? "结构化结果页" : "Structured Result"}
          </div>

          <h1 className="text-4xl font-bold">
            {isZh ? "生成结果" : "Generation Result"}
          </h1>

          <p className="mt-3 text-zinc-400">
            {isZh
              ? "这里展示本次生成任务产出的结构化内容，后续可继续接入图片、配音、视频合成。"
              : "This page shows the structured output of the job and can later be extended with images, voice, and final video composition."}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {job && (
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="text-sm text-zinc-400">{isZh ? "任务状态" : "Job Status"}</div>
              <div className="mt-3 text-2xl font-bold">{formatJobStatus(job.status)}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="text-sm text-zinc-400">{isZh ? "任务进度" : "Progress"}</div>
              <div className="mt-3 text-2xl font-bold">{job.progress}%</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="text-sm text-zinc-400">{isZh ? "套餐" : "Plan"}</div>
              <div className="mt-3 text-2xl font-bold">{formatPlan(job.plan)}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="text-sm text-zinc-400">{isZh ? "创建时间" : "Created At"}</div>
              <div className="mt-3 text-sm font-medium">{formatTime(job.created_at)}</div>
            </div>
          </div>
        )}

        {!payload ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8 text-zinc-400">
            {isZh ? "当前没有可展示的结构化结果。" : "There is no structured result to display yet."}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
                  <div className="text-sm text-zinc-400">{item.label}</div>
                  <div className="mt-3 text-4xl font-bold">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6 xl:col-span-2">
                <div className="mb-4 text-xl font-semibold">
                  {isZh ? "项目信息" : "Project Information"}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-950 p-4">
                    <div className="text-xs text-zinc-500">{isZh ? "剧名" : "Title"}</div>
                    <div className="mt-2 font-medium">{payload.title || "-"}</div>
                  </div>
                  <div className="rounded-2xl bg-zinc-950 p-4">
                    <div className="text-xs text-zinc-500">{isZh ? "AI 标题" : "AI Title"}</div>
                    <div className="mt-2 font-medium">{payload.aiTitle || "-"}</div>
                  </div>
                  <div className="rounded-2xl bg-zinc-950 p-4">
                    <div className="text-xs text-zinc-500">{isZh ? "项目类型" : "Project Type"}</div>
                    <div className="mt-2 font-medium">{payload.projectType || "-"}</div>
                  </div>
                  <div className="rounded-2xl bg-zinc-950 p-4">
                    <div className="text-xs text-zinc-500">{isZh ? "题材类型" : "Genre"}</div>
                    <div className="mt-2 font-medium">{payload.genre || "-"}</div>
                  </div>
                  <div className="rounded-2xl bg-zinc-950 p-4">
                    <div className="text-xs text-zinc-500">{isZh ? "规格" : "Spec"}</div>
                    <div className="mt-2 font-medium">{payload.spec || "-"}</div>
                  </div>
                  <div className="rounded-2xl bg-zinc-950 p-4">
                    <div className="text-xs text-zinc-500">{isZh ? "题材亮点" : "Highlight"}</div>
                    <div className="mt-2 font-medium">{payload.highlight || "-"}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
                <div className="mb-4 text-xl font-semibold">
                  {isZh ? "导出与跳转" : "Export & Actions"}
                </div>

                <div className="space-y-3">
                  {job?.result_url ? (
                    <a
                      href={job.result_url}
                      className="block rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
                    >
                      {isZh ? "打开结果链接" : "Open Result URL"}
                    </a>
                  ) : null}

                  <Link
                    href={`/${locale}/jobs`}
                    className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-200"
                  >
                    {isZh ? "返回任务中心" : "Back to Jobs"}
                  </Link>

                  <Link
                    href={`/${locale}/history`}
                    className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-200"
                  >
                    {isZh ? "查看生成历史" : "Open History"}
                  </Link>

                  <Link
                    href={`/${locale}/generate`}
                    className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-200"
                  >
                    {isZh ? "继续生成新项目" : "Generate New Project"}
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="mb-4 text-xl font-semibold">
                {isZh ? "爆点文案" : "Hook Line"}
              </div>
              <div className="rounded-2xl bg-zinc-950 p-4 text-zinc-200">
                {payload.hook || (isZh ? "暂无爆点文案" : "No hook line")}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="mb-4 text-xl font-semibold">
                {isZh ? "封面文案建议" : "Cover Copy Suggestions"}
              </div>

              {payload.coverCopy.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {payload.coverCopy.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-200">
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-zinc-950 p-4 text-zinc-400">
                  {isZh ? "暂无封面文案" : "No cover copy"}
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6 xl:col-span-2">
                <div className="mb-4 text-xl font-semibold">
                  {isZh ? "剧情摘要" : "Story Summary"}
                </div>
                <div className="rounded-2xl bg-zinc-950 p-4 whitespace-pre-wrap text-zinc-200">
                  {payload.summary || (isZh ? "暂无摘要" : "No summary")}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
                <div className="mb-4 text-xl font-semibold">
                  {isZh ? "角色列表" : "Characters"}
                </div>

                {payload.characters.length > 0 ? (
                  <div className="space-y-3">
                    {payload.characters.map((name) => (
                      <div key={name} className="rounded-2xl bg-zinc-950 p-4">
                        <div className="font-medium">{name}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {isZh ? "从剧本中自动识别" : "Auto-detected from script"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-zinc-950 p-4 text-zinc-400">
                    {isZh ? "暂无角色数据" : "No character data"}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="mb-4 text-xl font-semibold">
                {isZh ? "分镜脚本" : "Storyboard"}
              </div>

              {payload.storyboard.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {payload.storyboard.map((item) => (
                    <div key={item.shot} className="rounded-2xl bg-zinc-950 p-4">
                      <div className="text-xs text-zinc-500">
                        {isZh ? "镜头" : "Shot"} {item.shot}
                      </div>
                      <div className="mt-2 font-medium">{item.title}</div>
                      <div className="mt-2 text-sm text-zinc-300">{item.desc}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-zinc-950 p-4 text-zinc-400">
                  {isZh ? "暂无分镜数据" : "No storyboard data"}
                </div>
              )}
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <div className="mb-4 text-xl font-semibold">
                {isZh ? "剧本内容" : "Script Content"}
              </div>

              <pre className="overflow-auto rounded-2xl bg-zinc-950 p-4 whitespace-pre-wrap text-sm text-zinc-300">
                {payload.script || (isZh ? "暂无剧本内容" : "No script content")}
              </pre>
            </div>
          </>
        )}
      </section>
    </main>
  );
}