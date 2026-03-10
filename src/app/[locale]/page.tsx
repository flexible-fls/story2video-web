"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitch from "@/components/LanguageSwitch";
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

function getExampleScript(isZh: boolean) {
  return isZh
    ? `剧名：错爱归途

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
林晚：可你从来没有问过，我愿不愿意和你一起面对。`
    : `Title: Return of Misunderstanding

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
Lin Wan: But you never asked whether I wanted to face it with you.`;
}

function getScriptStats(text: string) {
  const trimmed = text.trim();
  return {
    charCount: trimmed.length,
    lineCount: trimmed ? trimmed.split("\n").length : 0,
  };
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

export default function HomePage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [scriptText, setScriptText] = useState("");
  const [loadedFileName, setLoadedFileName] = useState("");
  const [readingFile, setReadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const stats = useMemo(() => getScriptStats(scriptText), [scriptText]);

  useEffect(() => {
    bootstrap();
  }, [locale]);

  async function bootstrap() {
    const draft = loadDraftScript();
    if (draft.text) setScriptText(draft.text);
    if (draft.fileName) setLoadedFileName(draft.fileName);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsAuthed(false);
      setProfile(null);
      return;
    }

    setIsAuthed(true);

    const { data } = await supabase
      .from("profiles")
      .select("id,email,plan,monthly_quota,used_count,status")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setProfile(data as ProfileRow);
    }
  }

  async function handleFileSelect(file: File) {
    setReadingFile(true);
    setErrorMessage("");

    try {
      const text = await extractScriptTextFromFile(file, isZh);

      if (!text.trim()) {
        throw new Error(
          isZh ? "上传文件内容为空，无法提取剧本" : "The uploaded file is empty"
        );
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
      setIsDragging(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileSelect(file);
  }

  function goToGenerate() {
    const trimmed = scriptText.trim();

    if (!trimmed) {
      setErrorMessage(
        isZh ? "请先输入或上传剧本内容" : "Please upload or paste your script first"
      );
      return;
    }

    saveDraftScript(trimmed, loadedFileName || undefined);
    router.push(`/${locale}/generate`);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setIsAuthed(false);
    setProfile(null);
    setSigningOut(false);
    router.refresh();
    router.push(`/${locale}`);
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
      ? "未登录也可以先体验上传"
      : "You can try uploading before signing in";

  const planText = profile
    ? profile.plan === "studio"
      ? "Studio"
      : profile.plan === "pro"
      ? "Pro"
      : "Free"
    : isZh
    ? "访客"
    : "Guest";

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[120px] h-[380px] w-[380px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-80px] top-[120px] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute left-[20%] top-[40%] h-[220px] w-[220px] rounded-full bg-emerald-400/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05070b]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-2xl font-semibold tracking-tight">FulushouVideo</div>
            <div className="text-xs text-zinc-400">
              {isZh ? "AI 短剧与漫剧生成平台" : "AI Drama & Comic Video Studio"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/jobs`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
            >
              {isZh ? "我的任务" : "My Jobs"}
            </Link>

            {isAuthed ? (
              <>
                <Link
                  href={`/${locale}/account`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
                >
                  {isZh ? "账户中心" : "Account"}
                </Link>

                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
                >
                  {signingOut ? (isZh ? "退出中..." : "Signing out...") : isZh ? "退出登录" : "Sign Out"}
                </button>
              </>
            ) : (
              <Link
                href={`/${locale}/auth`}
                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                {isZh ? "登录 / 注册" : "Login / Sign Up"}
              </Link>
            )}

            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-14 pt-16">
        <div className="grid items-start gap-12 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="pt-8">
            <div className="mb-5 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
              {isZh ? "AI 剧情生产入口" : "AI Story Production Entry"}
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-7xl">
              {isZh ? "一份剧本，生成你的短剧与漫剧生产流程" : "One script, your full short-drama and comic workflow"}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 md:text-2xl md:leading-10">
              {isZh
                ? "FulushouVideo 帮你把剧本自动整理成结构化内容，包括角色识别、剧情摘要、分镜生成、爆点文案与任务化生产流程。"
                : "FulushouVideo turns scripts into structured production assets, including character extraction, story summary, storyboard generation, cover hooks, and a task-based workflow."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "剧本解析" : "Script Analysis"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "分镜结构化" : "Storyboard Structuring"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                {isZh ? "任务驱动生成" : "Task-driven Production"}
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                <div className="text-sm text-zinc-400">{isZh ? "更快进入生产" : "Faster Start"}</div>
                <div className="mt-3 text-2xl font-bold text-white">{isZh ? "上传即开始" : "Upload & Start"}</div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                <div className="text-sm text-zinc-400">{isZh ? "更适合剧情内容" : "Built for Story"}</div>
                <div className="mt-3 text-2xl font-bold text-white">{isZh ? "短剧 / 漫剧" : "Drama / Comic"}</div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                <div className="text-sm text-zinc-400">{isZh ? "任务化管理" : "Task Workflow"}</div>
                <div className="mt-3 text-2xl font-bold text-white">{isZh ? "进度可追踪" : "Track Progress"}</div>
              </div>
            </div>

            <div className="mt-10 rounded-[32px] border border-white/10 bg-gradient-to-r from-zinc-900/90 to-zinc-950/90 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
              <div className="text-sm font-medium text-emerald-300">
                {isZh ? "核心价值" : "Core Value"}
              </div>
              <div className="mt-3 text-3xl font-bold leading-tight text-white md:text-5xl">
                {isZh ? "不只是生成，而是帮你搭建完整的内容生产流程" : "More than generation — a full content workflow"}
              </div>
              <p className="mt-5 max-w-4xl text-base leading-8 text-zinc-300">
                {isZh
                  ? "传统短剧和漫剧制作里，剧本拆解、角色整理、分镜规划、爆点提炼都非常耗时。FulushouVideo 把这些高频重复工作自动化，让你从手动整理升级到任务驱动生成。"
                  : "Traditional short-drama and comic production requires script breakdown, character sorting, storyboard planning, and hook drafting. FulushouVideo automates those repetitive tasks and upgrades your workflow into a task-driven system."}
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[34px] bg-gradient-to-br from-emerald-400/10 via-transparent to-cyan-400/10 blur-xl" />
            <div className="relative rounded-[34px] border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 p-6 shadow-[0_24px_100px_rgba(0,0,0,0.48)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {isZh ? "上传剧本并进入生成" : "Upload Script and Continue"}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-zinc-400">
                    {isZh
                      ? "先上传或粘贴剧本，再进入生成页继续编辑与启动任务。"
                      : "Upload or paste your script here, then continue to the generation page."}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-right">
                  <div className="text-xs text-zinc-400">{isZh ? "当前身份" : "Current Status"}</div>
                  <div className="mt-1 text-sm font-semibold text-white">{planText}</div>
                </div>
              </div>

              <div className="mt-4 text-sm text-zinc-500">{quotaText}</div>

              <div className="mt-6 rounded-[24px] border border-white/8 bg-black/30 p-5">
                <div className="text-sm text-zinc-300">
                  {isZh ? "方式一：上传剧本文件" : "Method 1: Upload Script File"}
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
                  className={`mt-4 rounded-[20px] border border-dashed p-5 transition ${
                    isDragging
                      ? "border-emerald-400/50 bg-emerald-400/10"
                      : "border-white/10 bg-zinc-950"
                  }`}
                >
                  <div className="text-sm text-zinc-300">
                    {isZh
                      ? "拖拽剧本到这里，或点击按钮上传"
                      : "Drag your script here, or click the button to upload"}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    {isZh
                      ? "支持：txt / md / text / docx / pdf"
                      : "Supported: txt / md / text / docx / pdf"}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.text,.docx,.pdf"
                      onChange={onFileChange}
                      className="hidden"
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={readingFile}
                      className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
                    >
                      {readingFile
                        ? isZh
                          ? "读取中..."
                          : "Reading..."
                        : isZh
                        ? "上传剧本文件"
                        : "Upload Script"}
                    </button>

                    <button
                      onClick={() => {
                        setScriptText("");
                        setLoadedFileName("");
                        setErrorMessage("");
                        localStorage.removeItem(DRAFT_SCRIPT_TEXT_KEY);
                        localStorage.removeItem(DRAFT_SCRIPT_NAME_KEY);
                      }}
                      className="rounded-2xl border border-white/10 px-5 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.05]"
                    >
                      {isZh ? "清空" : "Clear"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-black/30 p-5">
                <div className="text-sm text-zinc-300">
                  {isZh ? "方式二：直接粘贴剧本" : "Method 2: Paste Script"}
                </div>

                <textarea
                  value={scriptText}
                  onChange={(e) => {
                    setScriptText(e.target.value);
                    saveDraftScript(e.target.value, loadedFileName || undefined);
                  }}
                  placeholder={
                    isZh
                      ? "请粘贴你的短剧或漫剧剧本..."
                      : "Paste your script here..."
                  }
                  rows={12}
                  className="mt-4 w-full rounded-[20px] border border-white/10 bg-zinc-950 px-4 py-4 text-sm text-white outline-none placeholder:text-zinc-500"
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-zinc-950 p-4">
                    <div className="text-xs text-zinc-500">{isZh ? "当前文件" : "Current File"}</div>
                    <div className="mt-2 truncate text-sm text-white">{loadedFileName || "-"}</div>
                  </div>

                  <div className="rounded-2xl bg-zinc-950 p-4">
                    <div className="text-xs text-zinc-500">{isZh ? "字数统计" : "Character Count"}</div>
                    <div className="mt-2 text-sm text-white">{stats.charCount}</div>
                  </div>

                  <div className="rounded-2xl bg-zinc-950 p-4">
                    <div className="text-xs text-zinc-500">{isZh ? "行数统计" : "Line Count"}</div>
                    <div className="mt-2 text-sm text-white">{stats.lineCount}</div>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={goToGenerate}
                  className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
                >
                  {isZh ? "进入生成页" : "Continue to Generate"}
                </button>

                <button
                  onClick={() => {
                    const example = getExampleScript(isZh);
                    setScriptText(example);
                    setLoadedFileName(isZh ? "示例剧本" : "Example Script");
                    saveDraftScript(example, isZh ? "示例剧本" : "Example Script");
                  }}
                  className="rounded-2xl border border-white/10 px-6 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.05]"
                >
                  {isZh ? "填充示例剧本" : "Use Example Script"}
                </button>

                <Link
                  href={`/${locale}/jobs`}
                  className="rounded-2xl border border-white/10 px-6 py-3 text-sm text-zinc-200 transition hover:bg-white/[0.05]"
                >
                  {isZh ? "查看任务中心" : "Open Jobs Center"}
                </Link>
              </div>

              <div className="mt-6 rounded-[20px] border border-white/8 bg-black/30 p-4 text-sm leading-7 text-zinc-400">
                {isZh
                  ? "这一步会先把剧本内容带入生成页。你进入生成页后仍然可以继续编辑、重新上传，然后再点击开始生成。"
                  : "This step carries your script into the generation page. You can still continue editing or re-uploading there before starting generation."}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "功能一" : "Feature 1"}
            </div>
            <div className="mt-3 text-3xl font-bold text-white">
              {isZh ? "AI 剧本结构化" : "AI Script Structuring"}
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              {isZh
                ? "自动识别角色、提炼剧情摘要、整理项目类型和适合传播的 AI 标题。"
                : "Automatically extracts characters, story summaries, project types, and marketable AI-enhanced titles."}
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "功能二" : "Feature 2"}
            </div>
            <div className="mt-3 text-3xl font-bold text-white">
              {isZh ? "分镜与封面文案" : "Storyboard & Cover Copy"}
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              {isZh
                ? "自动输出分镜结构、镜头说明和封面爆点文案，方便后续图像与视频生成。"
                : "Outputs storyboard structure, shot descriptions, and cover hook copy for future image and video generation."}
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7">
            <div className="text-sm font-medium text-emerald-300">
              {isZh ? "功能三" : "Feature 3"}
            </div>
            <div className="mt-3 text-3xl font-bold text-white">
              {isZh ? "任务化生产流程" : "Task-based Workflow"}
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              {isZh
                ? "每次生成都会记录任务状态、结构化结果和历史记录，更适合持续改稿和批量生产。"
                : "Each generation is tracked with status, structured output, and history, making it suitable for iterative editing and scaled production."}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="rounded-[36px] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 via-emerald-400/10 to-cyan-400/10 p-10 text-center shadow-[0_20px_80px_rgba(16,185,129,0.08)]">
          <div className="text-sm font-medium text-emerald-200">
            {isZh ? "开始创作" : "Start Creating"}
          </div>

          <h2 className="mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
            {isZh ? "把剧本交给 AI，让内容生产更快推进" : "Give your script to AI and move production faster"}
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-zinc-200">
            {isZh
              ? "从上传剧本、进入生成、查看结果到回看任务，这套流程已经可以支撑你的短剧与漫剧内容生产。"
              : "From uploading scripts to generating structured results and reviewing task history, this workflow is ready for drama and comic content production."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={goToGenerate}
              className="rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              {isZh ? "立即开始" : "Start Now"}
            </button>

            {!isAuthed ? (
              <Link
                href={`/${locale}/auth`}
                className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
              >
                {isZh ? "登录后管理任务" : "Login to Manage Jobs"}
              </Link>
            ) : (
              <Link
                href={`/${locale}/account`}
                className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
              >
                {isZh ? "进入账户中心" : "Open Account"}
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}