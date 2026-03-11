"use client";

import { usePathname, useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref: string;
  labelZh?: string;
  labelEn?: string;
};

export default function BackButton({
  fallbackHref,
  labelZh = "返回",
  labelEn = "Back",
}: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isZh = pathname.startsWith("/zh");

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
    >
      <span aria-hidden="true">←</span>
      <span>{isZh ? labelZh : labelEn}</span>
    </button>
  );
}