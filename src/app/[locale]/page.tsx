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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
            <div className="text-xs text-zinc-400">
              {isZh ? "AI 短剧与漫剧生成平台" : "AI Drama & Comic Video Platform"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/jobs`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {isZh ? "我的任务" : "My Jobs"}
            </Link>

            <Link
              href={`/${locale}/account`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {isZh ? "账户中心" : "Account"}
            </Link>

            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
              {isZh ? "AI 剧本生产入口" : "AI Script Production Entry"}
            </div>

            <h1 className="text-5xl font-bold leading-tight">
              {isZh ? "一份剧本，生成你的短剧与漫剧生产流程" : "Turn one script into your AI drama workflow"}
            </h1>

            <p className="mt-5 max-w-2xl text-lg text-zinc-400">
              {isZh
                ? "支持先上传文本剧本，再进入生成页继续编辑和启动任务。这样首页上传的内容会自动带入生成流程，不需要重复复制粘贴。"
                : "Upload your script first, then continue on the generation page without pasting it again."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-400">
              <div className="rounded-full border border-white/10 px-4 py-2">
                {isZh ? "剧本解析" : "Script Parsing"}
              </div>
              <div className="rounded-full border border-white/10 px-4 py-2">
                {isZh ? "分镜结构化" : "Storyboard Structuring"}
              </div>
              <div className="rounded-full border border-white/10 px-4 py-2">
                {isZh ? "任务驱动生成" : "Job-driven Generation"}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="mb-4 text-2xl font-semibold">
              {isZh ? "上传剧本并进入生成" : "Upload Script and Continue"}
            </div>

            <div className="rounded-2xl bg-zinc-950 p-4">
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
                  className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
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
                  onClick={() => {
                    setScriptText("");
                    setFileName("");
                    setErrorMessage("");
                    localStorage.removeItem(DRAFT_SCRIPT_TEXT_KEY);
                    localStorage.removeItem(DRAFT_SCRIPT_NAME_KEY);
                  }}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-200"
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

            <div className="mt-4 rounded-2xl bg-zinc-950 p-4">
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
                rows={14}
                className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-sm text-white outline-none placeholder:text-zinc-500"
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
                className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
              >
                {isZh ? "进入生成页" : "Continue to Generate"}
              </button>

              <Link
                href={`/${locale}/jobs`}
                className="rounded-xl border border-white/10 px-6 py-3 text-sm text-zinc-200"
              >
                {isZh ? "查看任务中心" : "Open Jobs"}
              </Link>
            </div>

            <div className="mt-6 rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">
              {isZh
                ? "这一步会先把剧本内容带入生成页。你进入生成页后仍然可以继续编辑、重新上传，然后再点击开始生成。"
                : "Your script will be carried into the generate page automatically, and you can still edit it there before starting generation."}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}