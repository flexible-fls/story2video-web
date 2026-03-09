export const dictionary = {
  zh: {
    headerSubtitle: "AI 短剧与漫剧生产平台",
    heroTitle: "从标准剧本直接生成短剧与漫剧视频",
    heroDesc: "上传剧本，自动解析剧情、人物与场景，生成可执行的视频生产方案。",
    uploadLabel: "上传剧本",
    generateButton: "开始生成",
    footer: "FulushouVideo · AI 剧本视频生成平台",
  },
  en: {
    headerSubtitle: "AI Drama & Comic Video Studio",
    heroTitle: "Turn standard scripts into short drama and comic videos",
    heroDesc: "Upload scripts and automatically parse plot, characters, and scenes into executable video production outputs.",
    uploadLabel: "Upload Script",
    generateButton: "Start Generating",
    footer: "FulushouVideo · AI Script-to-Video Platform",
  },
};

export function getDictionary(locale: "zh" | "en") {
  return dictionary[locale];
}
