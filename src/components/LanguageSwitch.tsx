import Link from "next/link";
import { type Locale } from "@/lib/i18n";

export default function LanguageSwitch({ locale }: { locale: Locale }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1 backdrop-blur">
      <Link
        href="/zh"
        className={`rounded-full px-4 py-2 text-sm transition ${
          locale === "zh"
            ? "bg-white text-black shadow-sm"
            : "text-zinc-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        中文
      </Link>

      <Link
        href="/en"
        className={`rounded-full px-4 py-2 text-sm transition ${
          locale === "en"
            ? "bg-white text-black shadow-sm"
            : "text-zinc-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        EN
      </Link>
    </div>
  );
}