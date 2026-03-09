"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function GeneratePage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [progress, setProgress] = useState(12);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(
    () =>
      isZh
        ? [
            "读取上传剧本",
            "解析项目信息",
            "识别主要角色",
            "生成分镜脚本",
            "整理摘要与爆点",
            "准备结果页",
          ]
        : [
            "Reading uploaded script",
            "Parsing project info",
            "Detecting main characters",
            "Generating storyboard",
            "Preparing summary and hook",
            "Preparing result page",
          ],
    [isZh]
  );

  useEffect(() => {
    const timers: number[] = [];

    timers.push(
      window.setTimeout(() => {
        setProgress(28);
        setCurrentStep(1);
      }, 500)
    );

    timers.push(
      window.setTimeout(() => {
        setProgress(46);
        setCurrentStep(2);
      }, 1100)
    );

    timers.push(
      window.setTimeout(() => {
        setProgress(67);
        setCurrentStep(3);
      }, 1800)
    );

    timers.push(
      window.setTimeout(() => {
        setProgress(84);
        setCurrentStep(4);
      }, 2500)
    );

    timers.push(
      window.setTimeout(() => {
        setProgress(100);
        setCurrentStep(5);
      }, 3200)
    );

    timers.push(
      window.setTimeout(() => {
        router.push(`/${locale}/result`);
      }, 3800)
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [locale, router]);

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
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            {isZh ? "正在生成项目" : "Generating Project"}
          </h1>
          <p className="mt-3 text-zinc-400">
            {isZh
              ? "系统正在解析你的剧本并生成结构化结果，请稍候。"
              : "The system is parsing your script and preparing structured output."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
              <span>{isZh ? "当前进度" : "Current Progress"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-zinc-800">
              <div
                className="h-3 rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const done = index < currentStep;
              const active = index === currentStep;

              return (
                <div
                  key={step}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950 px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        done || active
                          ? "bg-emerald-400 text-black"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span>{step}</span>
                  </div>

                  <span
                    className={`text-sm ${
                      done || active ? "text-emerald-400" : "text-zinc-500"
                    }`}
                  >
                    {done
                      ? isZh
                        ? "已完成"
                        : "Done"
                      : active
                      ? isZh
                        ? "进行中"
                        : "In Progress"
                      : isZh
                      ? "等待中"
                      : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl bg-zinc-800 p-4 text-sm text-zinc-300">
            {isZh
              ? "提示：当前为增强版演示流程，系统会自动跳转到结果页。"
              : "Tip: This is the enhanced demo flow. The system will automatically redirect to the result page."}
          </div>
        </div>
      </section>
    </main>
  );
}
