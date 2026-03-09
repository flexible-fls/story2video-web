"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StoryboardItem = {
  shot: number;
  title: string;
  desc: string;
};

function clearProjectCache() {
  const keys = [
    "scriptText",
    "parsedTitle",
    "parsedAiTitle",
    "parsedProjectType",
    "parsedGenre",
    "parsedSpec",
    "parsedHighlight",
    "parsedSummary",
    "parsedHook",
    "parsedCoverCopy",
    "parsedCharacters",
    "parsedStoryboard",
  ];

  keys.forEach((key) => localStorage.removeItem(key));
}

export default function ResultPage() {
  const router = useRouter();

  const [script, setScript] = useState("");
  const [locale, setLocale] = useState<"zh" | "en">("zh");
  const [characters, setCharacters] = useState<string[]>([]);
  const [storyboard, setStoryboard] = useState<StoryboardItem[]>([]);
  const [summary, setSummary] = useState("");
  const [title, setTitle] = useState("");
  const [aiTitle, setAiTitle] = useState("");
  const [projectType, setProjectType] = useState("");
  const [genre, setGenre] = useState("");
  const [spec, setSpec] = useState("");
  const [highlight, setHighlight] = useState("");
  const [hook, setHook] = useState("");
  const [coverCopy, setCoverCopy] = useState<string[]>([]);

  useEffect(() => {
    const path = window.location.pathname;
    const currentLocale = path.startsWith("/en") ? "en" : "zh";
    setLocale(currentLocale);

    const text = localStorage.getItem("scriptText");
    if (text) setScript(text);

    const savedTitle = localStorage.getItem("parsedTitle");
    if (savedTitle) setTitle(savedTitle);

    const savedAiTitle = localStorage.getItem("parsedAiTitle");
    if (savedAiTitle) setAiTitle(savedAiTitle);

    const savedProjectType = localStorage.getItem("parsedProjectType");
    if (savedProjectType) setProjectType(savedProjectType);

    const savedGenre = localStorage.getItem("parsedGenre");
    if (savedGenre) setGenre(savedGenre);

    const savedSpec = localStorage.getItem("parsedSpec");
    if (savedSpec) setSpec(savedSpec);

    const savedHighlight = localStorage.getItem("parsedHighlight");
    if (savedHighlight) setHighlight(savedHighlight);

    const savedSummary = localStorage.getItem("parsedSummary");
    if (savedSummary) setSummary(savedSummary);

    const savedHook = localStorage.getItem("parsedHook");
    if (savedHook) setHook(savedHook);

    const savedCharacters = localStorage.getItem("parsedCharacters");
    if (savedCharacters) setCharacters(JSON.parse(savedCharacters));

    const savedStoryboard = localStorage.getItem("parsedStoryboard");
    if (savedStoryboard) setStoryboard(JSON.parse(savedStoryboard));

    const savedCoverCopy = localStorage.getItem("parsedCoverCopy");
    if (savedCoverCopy) setCoverCopy(JSON.parse(savedCoverCopy));
  }, []);

  const isZh = locale === "zh";

  function handleRegenerate() {
    clearProjectCache();
    router.push(`/${locale}`);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-semibold">FulushouVideo</div>
            <div className="text-xs text-zinc-400">
              {isZh ? "AI 短剧与漫剧生成平台" : "AI Drama & Comic Video Studio"}
            </div>
          </div>

          <Link
            href={`/${locale}`}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300"
          >
            {isZh ? "返回首页" : "Back Home"}
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-10">
          <h1 className="text-4xl font-bold">
            {isZh ? "生成结果" : "Generation Result"}
          </h1>
          <p className="mt-3 text-zinc-400">
            {isZh
              ? "这是根据你上传的剧本自动生成的结构化结果。"
              : "This is the structured output generated automatically from your uploaded script."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold">
              {isZh ? "项目信息" : "Project Information"}
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-zinc-950 p-4">
                <div className="text-sm text-zinc-400">{isZh ? "剧名" : "Title"}</div>
                <div className="mt-2 font-medium">{title || (isZh ? "未识别" : "Not detected")}</div>
              </div>

              <div className="rounded-xl bg-zinc-950 p-4">
                <div className="text-sm text-zinc-400">{isZh ? "AI生成标题" : "AI Title"}</div>
                <div className="mt-2 font-medium">{aiTitle || (isZh ? "未生成" : "Not generated")}</div>
              </div>

              <div className="rounded-xl bg-zinc-950 p-4">
                <div className="text-sm text-zinc-400">{isZh ? "项目类型" : "Project Type"}</div>
                <div className="mt-2 font-medium">{projectType || (isZh ? "未识别" : "Not detected")}</div>
              </div>

              <div className="rounded-xl bg-zinc-950 p-4">
                <div className="text-sm text-zinc-400">{isZh ? "题材类型" : "Genre"}</div>
                <div className="mt-2 font-medium">{genre || (isZh ? "未识别" : "Not detected")}</div>
              </div>

              <div className="rounded-xl bg-zinc-950 p-4">
                <div className="text-sm text-zinc-400">{isZh ? "规格" : "Spec"}</div>
                <div className="mt-2 font-medium">{spec || (isZh ? "未识别" : "Not detected")}</div>
              </div>

              <div className="rounded-xl bg-zinc-950 p-4">
                <div className="text-sm text-zinc-400">{isZh ? "题材亮点" : "Highlight"}</div>
                <div className="mt-2 font-medium">{highlight || (isZh ? "未识别" : "Not detected")}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              {isZh ? "导出与下载" : "Export & Download"}
            </h2>

            <div className="mt-4 space-y-3">
              <button className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-medium text-black">
                {isZh ? "下载视频" : "Download Video"}
              </button>
              <button className="w-full rounded-xl border border-white/10 px-4 py-3 text-zinc-200">
                {isZh ? "下载分镜脚本" : "Download Storyboard"}
              </button>
              <button className="w-full rounded-xl border border-white/10 px-4 py-3 text-zinc-200">
                {isZh ? "下载生产包" : "Download Production Package"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              {isZh ? "爆点文案" : "Hook Line"}
            </h2>
            <div className="mt-4 rounded-xl bg-zinc-950 p-4 text-zinc-200">
              {hook || (isZh ? "暂无爆点文案" : "No hook line")}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              {isZh ? "封面文案建议" : "Cover Copy Suggestions"}
            </h2>
            <div className="mt-4 space-y-3">
              {coverCopy.length > 0 ? (
                coverCopy.map((item, index) => (
                  <div key={index} className="rounded-xl bg-zinc-950 p-4 text-sm text-zinc-300">
                    {item}
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-zinc-950 p-4 text-sm text-zinc-400">
                  {isZh ? "暂无封面文案" : "No cover copy"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold">
            {isZh ? "剧情摘要" : "Story Summary"}
          </h2>
          <div className="mt-4 rounded-xl bg-zinc-950 p-4 text-zinc-300">
            {summary || (isZh ? "暂无摘要" : "No summary")}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              {isZh ? "角色列表" : "Characters"}
            </h2>

            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              {characters.length > 0 ? (
                characters.map((name) => (
                  <div key={name} className="rounded-xl bg-zinc-950 p-4">
                    <div className="font-medium">{name}</div>
                    <div className="mt-1 text-zinc-400">
                      {isZh ? "从剧本中自动识别的角色" : "Auto-detected character from script"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-zinc-950 p-4 text-zinc-400">
                  {isZh ? "暂无角色数据" : "No character data"}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              {isZh ? "分镜脚本" : "Storyboard"}
            </h2>

            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              {storyboard.length > 0 ? (
                storyboard.map((item) => (
                  <div key={item.shot} className="rounded-xl bg-zinc-950 p-4">
                    <div className="font-medium">{item.title}</div>
                    <div className="mt-1 text-zinc-400">{item.desc}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-zinc-950 p-4 text-zinc-400">
                  {isZh ? "暂无分镜数据" : "No storyboard data"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {isZh ? "剧本内容" : "Script Content"}
          </h2>

          <pre className="whitespace-pre-wrap rounded-xl bg-zinc-950 p-4 text-sm text-zinc-300">
            {script || (isZh ? "暂无剧本内容" : "No script content")}
          </pre>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/${locale}`}
              className="rounded-xl border border-white/10 px-5 py-3 text-zinc-200"
            >
              {isZh ? "返回首页" : "Back Home"}
            </Link>

            <button
              onClick={handleRegenerate}
              className="rounded-xl bg-white px-5 py-3 text-black"
            >
              {isZh ? "重新生成" : "Generate Again"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
