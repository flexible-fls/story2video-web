import { notFound } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { locales, type Locale } from "@/lib/i18n";
import LanguageSwitch from "@/components/LanguageSwitch";

type PageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function LocalizedHome({ params }: PageProps) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const t = getDictionary(locale);

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

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h1 className="mb-6 text-4xl font-bold">{t.heroTitle}</h1>

        <p className="mb-10 text-zinc-400">{t.heroDesc}</p>

        <div className="rounded-xl bg-zinc-900 p-6">
  <label className="mb-2 block">{t.uploadLabel}</label>

  <input type="file" className="mb-4" />

  <Link
    href={`/${locale}/generate`}
    className="inline-block rounded-lg bg-emerald-400 px-6 py-2 text-black"
  >
    {t.generateButton}
  </Link>
</div>
      </section>

      <footer className="py-6 text-center text-zinc-500">{t.footer}</footer>
    </main>
  );
}
