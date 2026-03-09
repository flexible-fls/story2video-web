import type { Locale } from "./i18n";

type Dict = {
  headerSubtitle: string;
  heroTitle: string;
  heroDesc: string;
  uploadLabel: string;
  generateButton: string;
  footer: string;
};

const zh: Dict = {
  headerSubtitle: "AI 短剧与漫剧生成平台",
  heroTitle: "从标准剧本直接生成真人短剧与漫剧视频",
  heroDesc: "上传剧本，自动解析剧情、人物与场景，生成可执行的视频生产方案。",
  uploadLabel: "上传剧本",
  generateButton: "开始生成",
  footer: "FulushouVideo · AI 剧本视频生成平台",
};

const en: Dict = {
  headerSubtitle: "AI Drama & Comic Video Studio",
  heroTitle: "Generate live drama and comic videos directly from scripts",
  heroDesc: "Upload scripts, automatically parse story, characters, and scenes, and generate production-ready video plans.",
  uploadLabel: "Upload Script",
  generateButton: "Generate",
  footer: "FulushouVideo · AI Script-to-Video Platform",
};

export function getDictionary(locale: Locale): Dict {
  return locale === "en" ? en : zh;
}
