import Link from "next/link";
import { type Locale } from "@/lib/i18n";

export default function LanguageSwitch({ locale }: { locale: Locale }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/zh"
        className={`rounded-full border px-4 py-2 text-sm ${
          locale === "zh"
            ? "border-white/15 bg-white/10 text-white"
            : "border-white/10 bg-white/5 text-zinc-300"
        }`}
      >
        中文
      </Link>

      <Link
        href="/en"
        className={`rounded-full border px-4 py-2 text-sm ${
          locale === "en"
            ? "border-white/15 bg-white/10 text-white"
            : "border-white/10 bg-white/5 text-zinc-300"
        }`}
      >
        EN
      </Link>
    </div>
  );
}
