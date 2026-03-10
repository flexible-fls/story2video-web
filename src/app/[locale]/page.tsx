"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import LanguageSwitch from "@/components/LanguageSwitch";

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

async function readTextFile(file: File) {
  return await file.text();
}

type FeatureItem = {
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
};

type StepItem = {
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
};

type AudienceItem = {
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
};

type PlanItem = {
  name: string;
  tagZh: string;
  tagEn: string;
  descZh: string;
  descEn: string;
  pointsZh: string[];
  pointsEn: string[];
  highlight?: boolean;
};

export default function LocaleHomePage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [scriptText, setScriptText] = useState("");
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const canContinue = useMemo(() => scriptText.trim().length > 0, [scriptText]);

  const features: FeatureItem[] = [
    {
      titleZh: "剧本上传",
      titleEn: "Script Upload",
      descZh: "支持上传 txt / md 文本文件，或者直接粘贴剧本内容，快速进入生成流程。",
      descEn: "Upload txt / md files or paste your script directly to enter the generation flow quickly.",
    },
    {
      titleZh: "角色识别",
      titleEn: "Character Detection",
      descZh: "自动识别主要人物与对话主体，减少人工整理角色关系的时间。",
      descEn: "Automatically identify main characters and dialogue speakers to reduce manual organization.",
    },
    {
      titleZh: "剧情摘要",
      titleEn: "Story Summary",
      descZh: "自动提炼故事主线、冲突点和情绪节奏，方便后续内容制作。",
      descEn: "Generate concise summaries of the story arc, conflicts, and emotional beats.",
    },
    {
      titleZh: "分镜生成",
      titleEn: "Storyboard Build",
      descZh: "把剧本转换成适合短剧和漫剧生产的镜头结构。",
      descEn: "Transform scripts into storyboard structures suitable for short dramas and comic-style videos.",
    },
    {
      titleZh: "爆点文案",
      titleEn: "Hook Copy",
      descZh: "生成更适合传播的标题、钩子文案和封面内容建议。",
      descEn: "Generate hooks, titles, and cover copy ideas better suited for distribution.",
    },
    {
      titleZh: "任务中心",
      titleEn: "Jobs Center",
      descZh: "所有生成任务进入任务系统，方便查看进度、状态、结果和历史。",
      descEn: "Every generation enters the job system so you can track status, progress, results, and history.",
    },
  ];

  const steps: StepItem[] = [
    {
      titleZh: "上传剧本",
      titleEn: "Upload Script",
      descZh: "上传文本文件或直接粘贴剧本内容。",
      descEn: "Upload a text file or paste your script directly.",
    },
    {
      titleZh: "自动解析",
      titleEn: "Auto Parse",
      descZh: "系统自动提取角色、剧情摘要和结构信息。",
      descEn: "The system extracts characters, summaries, and structure automatically.",
    },
    {
      titleZh: "生成结果",
      titleEn: "Generate Output",
      descZh: "输出适合短剧与漫剧制作的结构化内容。",
      descEn: "Generate structured outputs suitable for short drama and comic production.",
    },
    {
      titleZh: "查看任务",
      titleEn: "Track Jobs",
      descZh: "进入任务中心查看进度、结果和历史记录。",
      descEn: "Go to the jobs center to track progress, results, and history.",
    },
  ];

  const audiences: AudienceItem[] = [
    {
      titleZh: "短剧创作者",
      titleEn: "Short Drama Creators",
      descZh: "想更快完成剧本拆解、分镜规划和内容准备。",
      descEn: "For creators who want to speed up script breakdown and storyboard planning.",
    },
    {
      titleZh: "漫剧工作室",
      titleEn: "Comic Drama Studios",
      descZh: "把剧情快速转换成适合漫剧生产的结构化结果。",
      descEn: "For studios that need to convert story scripts into production-ready comic structures.",
    },
    {
      titleZh: "内容团队 / MCN",
      titleEn: "Content Teams / MCNs",
      descZh: "希望把短剧生产流程做得更标准化、更高效。",
      descEn: "For teams that want a more standardized and efficient production workflow.",
    },
    {
      titleZh: "AI 内容创作者",
      titleEn: "AI Content Creators",
      descZh: "想用更低成本开始做剧情型视频和漫剧内容。",
      descEn: "For creators exploring AI-driven drama and comic-style content production.",
    },
  ];

  const plans: PlanItem[] = [
    {
      name: "Free",
      tagZh: "免费体验",
      tagEn: "Free Trial",
      descZh: "适合第一次体验平台流程，快速了解 AI 剧本解析和结构化生成。",
      descEn: "Best for first-time users who want to explore AI script parsing and structured generation.",
      pointsZh: ["基础体验", "适合试用流程", "快速开始"],
      pointsEn: ["Basic access", "Best for first-time trial", "Fast start"],
    },
    {
      name: "Pro",
      tagZh: "个人创作者",
      tagEn: "For Creators",
      descZh: "适合高频使用的独立创作者，获得更多额度和更稳定的日常创作支持。",
      descEn: "For solo creators who need more quota and a more stable everyday production workflow.",
      pointsZh: ["更多生成额度", "适合日常创作", "更高频使用"],
      pointsEn: ["More generation quota", "Great for daily creation", "For frequent use"],
      highlight: true,
    },
    {
      name: "Studio",
      tagZh: "团队 / 工作室",
      tagEn: "For Teams",
      descZh: "适合连续生产项目的团队与工作室，支持更高强度的创作任务。",
      descEn: "For teams and studios running continuous projects with heavier production needs.",
      pointsZh: ["更高使用上限", "适合项目生产", "工作室级使用"],
      pointsEn: ["Higher usage ceiling", "Built for projects", "Studio-grade workflow"],
    },
  ];

  async function handleFileSelect(file: File) {
    setUploading(true);
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
      setFileName(file.name);
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
      setUploading(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileSelect(file);
  }

  function handleContinue() {
    const text = scriptText.trim();

    if (!text) {
      setErrorMessage(isZh ? "请先上传或粘贴剧本内容" : "Please upload or paste your script first");
      return;
    }

    saveDraftScript(text, fileName || undefined);
    router.push(`/${locale}/generate`);
  }

  function clearDraft() {
    setScriptText("");
    setFileName("");
    setErrorMessage("");
    localStorage.removeItem(DRAFT_SCRIPT_TEXT_KEY);
    localStorage.removeItem(DRAFT_SCRIPT_NAME_KEY);
  }

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[80px] h-[320px] w-[320px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-120px] top-[180px] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute left-[20%] top-[720px] h-[260px] w-[260px] rounded-full bg-emerald-400/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-semibold tracking-tight text-white">FulushouVideo</div>
            <div className="text-xs text-zinc-400">
              {isZh ? "AI 短剧与漫剧生成平台" : "AI Drama & Comic Video Platform"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/jobs`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
            >
              {isZh ? "我的任务" : "My Jobs"}
            </Link>

            <Link
              href={`/${locale}/account`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
            >
              {isZh ? "账户中心" : "Account"}
            </Link>

            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-8 pt-16">
        <div className="grid items-center gap-10 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="relative">
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-medium text-emerald-300">
              {isZh ? "AI 剧情生产入口" : "AI Story Production Entry"}
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl">
              {isZh ? "一份剧本，生成你的短剧与漫剧生产流程" : "Turn one script into your AI story production flow"}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              {isZh
                ? "FulushouVideo 帮你把剧本自动整理成结构化内容，包括角色识别、剧情摘要、分镜生成、爆点文案与任务化生成流程。"
                : "FulushouVideo transforms scripts into structured production output including character detection, story summary, storyboard generation, hook copy, and job-driven workflow."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "剧本解析" : "Script Parsing"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "分镜结构化" : "Storyboard Structuring"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "任务驱动生成" : "Job-driven Generation"}
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "更快进入生产" : "Faster Production"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{isZh ? "上传即开始" : "Upload to Start"}</div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "更适合剧情内容" : "Built for Storytelling"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{isZh ? "短剧 / 漫剧" : "Drama / Comic"}</div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="text-sm text-zinc-400">{isZh ? "任务化管理" : "Trackable Workflow"}</div>
                <div className="mt-3 text-3xl font-bold text-white">{isZh ? "进度可追踪" : "Track Progress"}</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-emerald-400/10 via-transparent to-cyan-400/10 blur-xl" />
            <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {isZh ? "上传剧本并进入生成" : "Upload Script and Continue"}
                  </div>
                  <div className="mt-2 text-sm text-zinc-400">
                    {isZh
                      ? "先上传或粘贴剧本，再进入生成页继续编辑与启动任务。"
                      : "Upload or paste your script first, then continue to the generation page."}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/40 p-4">
                <div className="mb-3 text-sm text-zinc-400">
                  {isZh ? "方式一：上传文本文件" : "Option 1: Upload text file"}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.text"
                  onChange={onFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
                  >
                    {uploading
                      ? isZh
                        ? "读取中..."
                        : "Reading..."
                      : isZh
                      ? "上传 txt / md 文件"
                      : "Upload txt / md file"}
                  </button>

                  <button
                    onClick={clearDraft}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
                  >
                    {isZh ? "清空" : "Clear"}
                  </button>
                </div>

                {fileName && (
                  <div className="mt-3 text-sm text-zinc-500">
                    {isZh ? "已载入文件：" : "Loaded file: "} {fileName}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/40 p-4">
                <div className="mb-3 text-sm text-zinc-400">
                  {isZh ? "方式二：直接粘贴剧本" : "Option 2: Paste script directly"}
                </div>

                <textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder={
                    isZh
                      ? "请粘贴你的短剧或漫剧剧本...\n\n林晚：你为什么现在才回来？\n顾沉：因为我终于查到了真相。"
                      : "Paste your script here..."
                  }
                  rows={12}
                  className="w-full rounded-[24px] border border-white/10 bg-zinc-900/90 px-4 py-4 text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </div>

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
                >
                  {isZh ? "进入生成页" : "Continue to Generate"}
                </button>

                <Link
                  href={`/${locale}/jobs`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
                >
                  {isZh ? "查看任务中心" : "Open Jobs"}
                </Link>
              </div>

              <div className="mt-6 rounded-[22px] border border-white/8 bg-black/40 p-4 text-sm leading-7 text-zinc-400">
                {isZh
                  ? "这一步会先把剧本内容带入生成页。你进入生成页后仍然可以继续编辑、重新上传，然后再点击开始生成。"
                  : "Your script will be carried into the generate page automatically, and you can still edit it there before starting generation."}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-zinc-900/90 via-zinc-900/80 to-zinc-900/90 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          <div className="max-w-4xl">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "核心价值" : "Core Value"}
            </div>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-white">
              {isZh ? "不只是生成，而是帮你搭建完整的内容生产流程" : "Not just generation, but a full content production workflow"}
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              {isZh
                ? "传统短剧和漫剧制作里，剧本拆解、角色整理、分镜规划、爆点提炼都非常耗时。FulushouVideo 把这些高频重复工作自动化，让你从手动整理升级到任务驱动生成。"
                : "Traditional short drama and comic production is slowed down by repeated manual work. FulushouVideo automates these recurring steps so you can move from manual preparation to a job-driven workflow."}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <div className="text-sm font-medium text-emerald-300">{isZh ? "核心功能" : "Core Features"}</div>
          <h2 className="mt-3 text-4xl font-bold text-white">
            {isZh ? "为短剧与漫剧生产设计的关键能力" : "Built for short drama and comic production"}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((item, index) => (
            <div
              key={item.titleZh}
              className="group rounded-[30px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/20 hover:shadow-[0_14px_40px_rgba(16,185,129,0.08)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-sm font-semibold text-emerald-300">
                0{index + 1}
              </div>
              <div className="text-xl font-semibold text-white">
                {isZh ? item.titleZh : item.titleEn}
              </div>
              <div className="mt-3 text-sm leading-7 text-zinc-400">
                {isZh ? item.descZh : item.descEn}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <div className="text-sm font-medium text-emerald-300">{isZh ? "使用流程" : "Workflow"}</div>
          <h2 className="mt-3 text-4xl font-bold text-white">
            {isZh ? "4 步开始你的 AI 剧情生产" : "Start your AI story workflow in 4 steps"}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((item, index) => (
            <div
              key={item.titleZh}
              className="rounded-[30px] border border-white/10 bg-zinc-900/80 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
            >
              <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                {isZh ? `第 ${index + 1} 步` : `Step ${index + 1}`}
              </div>
              <div className="mt-4 text-2xl font-bold text-white">{isZh ? item.titleZh : item.titleEn}</div>
              <div className="mt-3 text-sm leading-7 text-zinc-400">
                {isZh ? item.descZh : item.descEn}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <div className="text-sm font-medium text-emerald-300">{isZh ? "适合谁使用" : "Who It's For"}</div>
          <h2 className="mt-3 text-4xl font-bold text-white">
            {isZh ? "适合这些创作者和团队" : "Built for creators and teams like these"}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {audiences.map((item) => (
            <div
              key={item.titleZh}
              className="rounded-[28px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6"
            >
              <div className="text-xl font-semibold text-white">{isZh ? item.titleZh : item.titleEn}</div>
              <div className="mt-3 text-sm leading-7 text-zinc-400">
                {isZh ? item.descZh : item.descEn}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <div className="text-sm font-medium text-emerald-300">{isZh ? "套餐方案" : "Pricing Plans"}</div>
          <h2 className="mt-3 text-4xl font-bold text-white">
            {isZh ? "按你的创作频率选择合适方案" : "Choose the right plan for your workflow"}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-400">
            {isZh
              ? "你购买的不只是额度，而是更稳定、更高效的短剧与漫剧生产能力。"
              : "You are not only paying for quota, but for a more stable and efficient story production workflow."}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-[32px] border p-7 ${
                plan.highlight
                  ? "border-emerald-400/30 bg-gradient-to-b from-emerald-400/12 to-zinc-900"
                  : "border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950"
              }`}
            >
              {plan.highlight && (
                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />
              )}

              <div className="relative flex items-center justify-between gap-3">
                <div className="text-3xl font-bold text-white">{plan.name}</div>
                <div
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    plan.highlight
                      ? "bg-emerald-400 text-black"
                      : "border border-white/10 text-zinc-300"
                  }`}
                >
                  {isZh ? plan.tagZh : plan.tagEn}
                </div>
              </div>

              <p className="relative mt-4 text-sm leading-7 text-zinc-300">
                {isZh ? plan.descZh : plan.descEn}
              </p>

              <div className="relative mt-6 space-y-3">
                {(isZh ? plan.pointsZh : plan.pointsEn).map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-zinc-200"
                  >
                    {point}
                  </div>
                ))}
              </div>

              <div className="relative mt-6">
                <Link
                  href={`/${locale}/billing`}
                  className={`inline-flex rounded-2xl px-5 py-3 text-sm font-semibold ${
                    plan.highlight
                      ? "bg-emerald-400 text-black"
                      : "border border-white/10 bg-white/[0.03] text-zinc-200"
                  }`}
                >
                  {isZh ? "查看套餐" : "View Plan"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          <div className="max-w-5xl">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "为什么选择 FulushouVideo" : "Why FulushouVideo"}
            </div>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-white">
              {isZh ? "不是泛用 AI 工具，而是更懂短剧与漫剧的生产平台" : "Not a generic AI tool, but a production platform built for story content"}
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                <div className="text-lg font-semibold text-white">
                  {isZh ? "更懂短剧结构" : "Built for Story Structure"}
                </div>
                <div className="mt-3 text-sm leading-7 text-zinc-400">
                  {isZh
                    ? "不是通用文本生成，而是围绕剧情冲突、节奏和镜头表达。"
                    : "Focused on story beats, conflict pacing, and visual structure rather than generic text output."}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                <div className="text-lg font-semibold text-white">
                  {isZh ? "更适合漫剧流程" : "Built for Comic-style Workflow"}
                </div>
                <div className="mt-3 text-sm leading-7 text-zinc-400">
                  {isZh
                    ? "从剧本到分镜再到任务系统，天然适合漫剧化制作。"
                    : "From script to storyboard to jobs, the workflow naturally fits comic-style production."}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                <div className="text-lg font-semibold text-white">
                  {isZh ? "更像 SaaS 平台" : "A Real SaaS Workflow"}
                </div>
                <div className="mt-3 text-sm leading-7 text-zinc-400">
                  {isZh
                    ? "不仅能生成，还具备任务中心、历史记录和可持续使用的结构。"
                    : "Not just generation, but jobs, history, and a workflow designed for continuous production."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-[36px] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 via-emerald-400/10 to-cyan-400/10 p-10 text-center shadow-[0_20px_80px_rgba(16,185,129,0.08)]">
          <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative text-sm font-medium text-emerald-200">
            {isZh ? "开始创作" : "Start Creating"}
          </div>

          <h2 className="relative mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
            {isZh ? "现在就上传你的剧本，开始 AI 短剧与漫剧生产流程" : "Upload your script and start your AI story production workflow"}
          </h2>

          <p className="relative mx-auto mt-4 max-w-3xl text-base leading-8 text-zinc-200">
            {isZh
              ? "从剧本解析、角色整理、分镜生成到任务化跟踪，让内容生产从手工整理升级为结构化流程。"
              : "Move from manual script preparation to a structured, trackable AI workflow for story content production."}
          </p>

          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {isZh ? "免费开始" : "Start Free"}
            </button>

            <Link
              href={`/${locale}/billing`}
              className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
            >
              {isZh ? "查看套餐" : "View Pricing"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}