"use client";

import { useState } from "react";
import Link from "next/link";
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

  const features = [
    {
      title: locale === "zh" ? "剧本智能解析" : "Smart Script Parsing",
      desc:
        locale === "zh"
          ? "自动识别剧名、类型、角色、分镜与核心冲突。"
          : "Automatically extract title, genre, characters, storyboard, and core conflict.",
    },
    {
      title: locale === "zh" ? "短剧结构化生产" : "Structured Drama Production",
      desc:
        locale === "zh"
          ? "将原始文本整理为可执行的短剧生产结果页。"
          : "Turn raw scripts into structured, production-ready short drama outputs.",
    },
    {
      title: locale === "zh" ? "封面与爆点文案" : "Hook & Cover Copy",
      desc:
        locale === "zh"
          ? "自动生成标题、爆点文案、封面卖点建议。"
          : "Generate AI titles, hook lines, and cover copy suggestions automatically.",
    },
    {
      title: locale === "zh" ? "视频预览工作流" : "Video Preview Workflow",
      desc:
        locale === "zh"
          ? "接入生成中流程与模拟视频预览，贴近真实产品体验。"
          : "Includes a generation flow and simulated video preview for a real product feel.",
    },
  ];

  const steps =
    locale === "zh"
      ? [
          "上传标准剧本",
          "系统解析项目与角色",
          "生成分镜、标题、文案",
          "进入结果页与视频预览",
        ]
      : [
          "Upload your standard script",
          "Parse project structure and characters",
          "Generate storyboard, titles, and copy",
          "View result page and video preview",
        ];

  const faqs =
    locale === "zh"
      ? [
          {
            q: "支持哪些剧本格式？",
            a: "当前支持 txt / md / doc / docx / pdf，测试阶段建议优先使用 txt。",
          },
          {
            q: "适合真人短剧还是漫剧？",
            a: "两者都支持，当前原型更偏向短剧生产结构，后续可扩展到漫剧和视频生成。",
          },
          {
            q: "现在已经接入真实视频生成了吗？",
            a: "当前是结构化原型版本，已完成上传、解析、结果展示与预览流程，后续可对接 Runway、Pika 等能力。",
          },
        ]
      : [
          {
            q: "What script formats are supported?",
            a: "Currently supports txt / md / doc / docx / pdf. For testing, txt is recommended.",
          },
          {
            q: "Is it for live-action short dramas or comic dramas?",
            a: "Both. The current prototype focuses more on short drama production structure, but can expand to comic and video generation.",
          },
          {
            q: "Does it generate real videos yet?",
            a: "This is currently a structured production prototype with upload, parsing, results, and preview flow. Real video generation can be connected later.",
          },
        ];

  const pricing =
    locale === "zh"
      ? [
          {
            name: "Free",
            price: "¥0",
            period: "/月",
            desc: "适合测试与体验",
            features: ["每月 5 个剧本", "基础分镜解析", "AI 标题生成", "结果页预览"],
            button: "立即开始",
            highlight: false,
          },
          {
            name: "Pro",
            price: "¥99",
            period: "/月",
            desc: "适合个人创作者",
            features: ["每月 50 个剧本", "高级角色识别", "封面文案与爆点文案", "视频预览工作流"],
            button: "升级 Pro",
            highlight: true,
          },
          {
            name: "Studio",
            price: "¥399",
            period: "/月",
            desc: "适合团队生产",
            features: ["无限剧本处理", "团队协作能力", "后续可接 API", "优先支持与商用扩展"],
            button: "联系商务",
            highlight: false,
          },
        ]
      : [
          {
            name: "Free",
            price: "$0",
            period: "/month",
            desc: "Best for testing",
            features: ["5 scripts / month", "Basic storyboard parsing", "AI title generation", "Result page preview"],
            button: "Start Free",
            highlight: false,
          },
          {
            name: "Pro",
            price: "$19",
            period: "/month",
            desc: "Best for creators",
            features: ["50 scripts / month", "Advanced character extraction", "Hook and cover copy", "Video preview workflow"],
            button: "Upgrade Pro",
            highlight: true,
          },
          {
            name: "Studio",
            price: "$79",
            period: "/month",
            desc: "Best for teams",
            features: ["Unlimited script processing", "Team collaboration", "Future API access", "Priority support & commercial scaling"],
            button: "Contact Sales",
            highlight: false,
          },
        ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">FulushouVideo</div>
            <div className="text-xs text-zinc-400">{t.headerSubtitle}</div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/auth`}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              {locale === "zh" ? "登录" : "Sign In"}
            </Link>

            <Link
              href={`/${locale}/auth`}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
            >
              {locale === "zh" ? "开始使用" : "Get Started"}
            </Link>

            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs text-emerald-300">
              {locale === "zh"
                ? "AI 短剧 / 漫剧生产平台"
                : "AI Short Drama / Comic Production Platform"}
            </div>

            <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-5xl">
              {locale === "zh"
                ? "从标准剧本直接生成短剧生产结果、爆点文案与视频预览"
                : "Turn standard scripts into drama outputs, hook copy, and video-ready previews"}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">
              {locale === "zh"
                ? "FulushouVideo 面向真人短剧与漫剧团队，帮助你把原始剧本快速转成角色、分镜、项目摘要、标题文案和可视化结果页。"
                : "FulushouVideo helps live-action and comic drama teams transform raw scripts into characters, storyboard, summaries, titles, copywriting, and visual production outputs."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-300">
              <div className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2">
                {locale === "zh" ? "剧本解析" : "Script Parsing"}
              </div>
              <div className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2">
                {locale === "zh" ? "分镜生成" : "Storyboard"}
              </div>
              <div className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2">
                {locale === "zh" ? "封面文案" : "Cover Copy"}
              </div>
              <div className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2">
                {locale === "zh" ? "视频预览" : "Video Preview"}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/30">
            <div className="mb-4">
              <div className="text-lg font-semibold">
                {locale === "zh" ? "立即开始生成" : "Start Generating"}
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                {locale === "zh"
                  ? "上传剧本后，系统会自动进入生成流程。"
                  : "Upload your script and enter the generation workflow instantly."}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-950 p-4">
              <label className="mb-3 block text-sm font-medium text-zinc-200">
                {t.uploadLabel}
              </label>

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
                  ? "支持 txt / md / doc / docx / pdf，建议先用 txt 测试。"
                  : "Supports txt / md / doc / docx / pdf. For testing, txt is recommended."}
              </div>
            </div>

            {file && (
              <div className="mt-4 rounded-xl bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                {locale === "zh" ? "已选择文件：" : "Selected file: "}
                <span className="text-white">{file.name}</span>
              </div>
            )}

            {message && <div className="mt-4 text-sm text-emerald-400">{message}</div>}

            <button
              onClick={handleUpload}
              disabled={loading}
              className="mt-5 h-12 w-full rounded-xl bg-emerald-400 px-6 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
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

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <div className="mb-6">
            <div className="text-2xl font-semibold">
              {locale === "zh" ? "核心能力" : "Core Capabilities"}
            </div>
            <div className="mt-2 text-zinc-400">
              {locale === "zh"
                ? "为短剧与漫剧内容团队提供从文本到生产结构的 AI 工作流。"
                : "An AI workflow for short drama and comic drama teams, from text to production structure."}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map((item) => (
              <div key={item.title} className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-lg font-semibold">{item.title}</div>
                <div className="mt-3 text-sm leading-6 text-zinc-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-2xl font-semibold">
              {locale === "zh" ? "生成流程" : "Generation Workflow"}
            </div>
            <div className="mt-2 text-zinc-400">
              {locale === "zh"
                ? "上传后自动进入解析、生成、结果输出流程。"
                : "After upload, the system moves automatically through parsing, generation, and results."}
            </div>

            <div className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-2xl bg-zinc-950 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-black">
                    {index + 1}
                  </div>
                  <div className="text-sm text-zinc-300">{step}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <div className="text-2xl font-semibold">
              {locale === "zh" ? "结果能力展示" : "Output Overview"}
            </div>
            <div className="mt-2 text-zinc-400">
              {locale === "zh"
                ? "上传剧本后，系统将输出更适合短剧团队使用的结构化结果。"
                : "After upload, the system generates structured outputs for short drama production teams."}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{locale === "zh" ? "AI 标题" : "AI Title"}</div>
                <div className="mt-3 font-medium">
                  {locale === "zh"
                    ? "自动提炼更适合传播的短剧标题"
                    : "Generate more marketable and viral drama titles"}
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{locale === "zh" ? "封面文案" : "Cover Copy"}</div>
                <div className="mt-3 font-medium">
                  {locale === "zh"
                    ? "自动生成爆点文案与封面卖点"
                    : "Generate hook lines and cover selling points"}
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{locale === "zh" ? "角色识别" : "Character Detection"}</div>
                <div className="mt-3 font-medium">
                  {locale === "zh"
                    ? "从对白结构中自动识别人设"
                    : "Detect key characters directly from dialogue structure"}
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-950 p-5">
                <div className="text-sm text-zinc-400">{locale === "zh" ? "分镜预览" : "Storyboard Preview"}</div>
                <div className="mt-3 font-medium">
                  {locale === "zh"
                    ? "自动整理镜头顺序与短剧节奏"
                    : "Structure shots and rhythm for short-form drama production"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <div className="text-2xl font-semibold">
            {locale === "zh" ? "价格方案" : "Pricing"}
          </div>
          <div className="mt-2 text-zinc-400">
            {locale === "zh"
              ? "为个人创作者、工作室与团队准备的不同使用方案。"
              : "Flexible plans for creators, studios, and production teams."}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl border p-6 ${
                  plan.highlight
                    ? "border-emerald-400 bg-zinc-950 shadow-lg shadow-emerald-400/10"
                    : "border-white/10 bg-zinc-950"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold">{plan.name}</div>
                  {plan.highlight && (
                    <div className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-medium text-black">
                      {locale === "zh" ? "推荐" : "Popular"}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="pb-1 text-sm text-zinc-400">{plan.period}</span>
                </div>

                <div className="mt-3 text-sm text-zinc-400">{plan.desc}</div>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`mt-8 w-full rounded-xl py-3 text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-emerald-400 text-black hover:opacity-90"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {plan.button}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
          <div className="text-2xl font-semibold">FAQ</div>
          <div className="mt-2 text-zinc-400">
            {locale === "zh"
              ? "一些你现在最关心的问题。"
              : "A few questions you probably care about right now."}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-2xl bg-zinc-950 p-5">
                <div className="font-semibold">{item.q}</div>
                <div className="mt-3 text-sm leading-6 text-zinc-400">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-zinc-500">{t.footer}</footer>
    </main>
  );
}
