import Link from "next/link";
type PageProps = {
  params: Promise<{
    locale: "zh" | "en";
  }>;
};

export default async function GeneratePage({ params }: PageProps) {
  const { locale } = await params;

  const isZh = locale === "zh";

  const title = isZh ? "正在生成项目" : "Generating Project";
  const subtitle = isZh
    ? "系统正在解析剧本并生成视频生产方案"
    : "The system is parsing your script and generating the video production plan";

  const steps = isZh
    ? [
        "剧本解析中",
        "人物识别中",
        "场景拆分中",
        "分镜生成中",
        "生产包整理中",
      ]
    : [
        "Parsing script",
        "Detecting characters",
        "Splitting scenes",
        "Generating storyboard",
        "Preparing production package",
      ];

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
          <h1 className="text-4xl font-bold">{title}</h1>
          <p className="mt-3 text-zinc-400">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
              <span>{isZh ? "当前进度" : "Current Progress"}</span>
              <span>68%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-zinc-800">
              <div className="h-3 w-[68%] rounded-full bg-emerald-400" />
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950 px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-sm font-semibold text-black">
                    {index + 1}
                  </div>
                  <span>{step}</span>
                </div>
                <span className="text-sm text-emerald-400">
                  {index < 3
                    ? isZh
                      ? "已完成"
                      : "Done"
                    : index === 3
                    ? isZh
                      ? "进行中"
                      : "In Progress"
                    : isZh
                    ? "等待中"
                    : "Pending"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-zinc-800 p-4 text-sm text-zinc-300">
            {isZh
              ? "提示：这是当前的演示版进度页。下一步我们会接入真实的剧本上传与任务处理逻辑。"
              : "Tip: This is the current demo progress page. Next we will connect real script upload and task processing logic."}
          </div>
          <div className="mt-8 rounded-xl bg-zinc-800 p-4 text-sm text-zinc-300">
  {isZh
    ? "提示：这是当前的演示版进度页。下一步我们会接入真实的剧本上传与任务处理逻辑。"
    : "Tip: This is the current demo progress page. Next we will connect real script upload and task processing logic."}
</div>

<div className="mt-6">
  <Link
    href={`/${locale}/result`}
    className="inline-block rounded-xl bg-white px-5 py-3 text-sm font-medium text-black"
  >
    {isZh ? "查看结果页" : "View Result Page"}
  </Link>
</div>
        </div>
      </section>
    </main>
  );
}
