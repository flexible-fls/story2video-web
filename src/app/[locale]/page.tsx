"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import LanguageSwitch from "@/components/LanguageSwitch";

export default function LocalizedHome() {
  const pathname = usePathname();
  const router = useRouter();

  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const t = getDictionary(locale);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload() {
    if (!file) {
      setMessage(locale === "zh" ? "请先选择剧本文件" : "Please choose a script file first");
      return;
    }

    setLoading(true);
    setMessage(locale === "zh" ? "上传中..." : "Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("scriptText", data.script);

        const parseRes = await fetch("/api/parse-script", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            script: data.script,
          }),
        });

        const parsed = await parseRes.json();

      if (parsed.success) {
  localStorage.setItem("parsedTitle", parsed.title || "");
  localStorage.setItem("parsedAiTitle", parsed.aiTitle || "");
  localStorage.setItem("parsedProjectType", parsed.projectType || "");
  localStorage.setItem("parsedGenre", parsed.genre || "");
  localStorage.setItem("parsedSpec", parsed.spec || "");
  localStorage.setItem("parsedHighlight", parsed.highlight || "");
  localStorage.setItem("parsedSummary", parsed.summary || "");
  localStorage.setItem("parsedHook", parsed.hook || "");
  localStorage.setItem("parsedCoverCopy", JSON.stringify(parsed.coverCopy || []));
  localStorage.setItem("parsedCharacters", JSON.stringify(parsed.characters || []));
  localStorage.setItem("parsedStoryboard", JSON.stringify(parsed.storyboard || []));
}


        setMessage(
          locale === "zh"
            ? `上传成功：${data.fileName}`
            : `Upload successful: ${data.fileName}`
        );

        setTimeout(() => {
          router.push(`/${locale}/generate`);
        }, 500);
      } else {
        setMessage(
          locale === "zh"
            ? "上传失败，请重试"
            : "Upload failed, please try again"
        );
      }
    } catch (error) {
      setMessage(
        locale === "zh"
          ? "上传失败，请检查网络"
          : "Upload failed, please check your network"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
            <div className="text-xs text-zinc-400">{t.headerSubtitle}</div>
          </div>
          <LanguageSwitch locale={locale} />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <h1 className="mb-5 text-4xl font-bold leading-tight">{t.heroTitle}</h1>
          <p className="mb-10 text-zinc-400">{t.heroDesc}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/20">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_220px] lg:items-end">
            <div>
              <label className="mb-3 block text-sm font-medium text-zinc-200">
                {t.uploadLabel}
              </label>

              <div className="rounded-xl border border-dashed border-white/15 bg-zinc-950 p-4">
                <input
                  type="file"
                  accept=".txt,.md,.doc,.docx,.pdf"
                  className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] || null;
                    setFile(selected);
                    setMessage("");
                  }}
                />

                <div className="mt-3 text-xs text-zinc-500">
                  {locale === "zh"
                    ? "支持 txt / md / doc / docx / pdf，推荐先使用 txt 进行测试"
                    : "Supports txt / md / doc / docx / pdf, txt is recommended for testing"}
                </div>
              </div>

              {file && (
                <div className="mt-4 rounded-lg bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                  {locale === "zh" ? "已选择文件：" : "Selected file: "}
                  <span className="text-white">{file.name}</span>
                </div>
              )}

              {message && (
                <div className="mt-4 text-sm text-emerald-400">{message}</div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={loading}
              className="h-12 rounded-xl bg-emerald-400 px-6 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
            >
              {loading
                ? locale === "zh"
                  ? "处理中..."
                  : "Processing..."
                : t.generateButton}
            </button>
          </div>
        </div>
      </section>

      <footer className="py-6 text-center text-zinc-500">{t.footer}</footer>
    </main>
  );
}
