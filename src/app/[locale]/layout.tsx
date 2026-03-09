import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (locale === "zh") {
    return {
      title: "AI短剧与漫剧生成平台",
      description:
        "FulushouVideo 是面向真人短剧与漫剧团队的 AI 生产平台，支持剧本解析、角色识别、分镜生成、爆点文案与视频预览工作流。",
      keywords: [
        "AI短剧生成",
        "AI漫剧生成",
        "剧本转视频",
        "短剧分镜生成",
        "短剧生产平台",
        "FulushouVideo",
      ],
      openGraph: {
        title: "FulushouVideo - AI短剧与漫剧生成平台",
        description:
          "上传剧本，自动解析角色、分镜、标题文案与视频预览结果。",
        url: "https://fulushouvideo.com/zh",
        locale: "zh_CN",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "FulushouVideo - AI短剧与漫剧生成平台",
        description:
          "上传剧本，自动解析角色、分镜、标题文案与视频预览结果。",
      },
      alternates: {
        canonical: "https://fulushouvideo.com/zh",
        languages: {
          zh: "https://fulushouvideo.com/zh",
          en: "https://fulushouvideo.com/en",
        },
      },
    };
  }

  return {
    title: "AI Drama & Comic Video Studio",
    description:
      "FulushouVideo is an AI production platform for live-action short dramas and comic videos, supporting script parsing, character extraction, storyboard generation, hook copy, and video preview workflows.",
    keywords: [
      "AI drama generator",
      "AI comic generator",
      "script to video",
      "storyboard generator",
      "AI short drama production",
      "FulushouVideo",
    ],
    openGraph: {
      title: "FulushouVideo - AI Drama & Comic Video Studio",
      description:
        "Upload scripts and generate characters, storyboard, AI titles, cover copy, and preview-ready outputs.",
      url: "https://fulushouvideo.com/en",
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "FulushouVideo - AI Drama & Comic Video Studio",
      description:
        "Upload scripts and generate characters, storyboard, AI titles, cover copy, and preview-ready outputs.",
    },
    alternates: {
      canonical: "https://fulushouvideo.com/en",
      languages: {
        zh: "https://fulushouvideo.com/zh",
        en: "https://fulushouvideo.com/en",
      },
    },
  };
}

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
