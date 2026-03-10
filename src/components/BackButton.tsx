"use client";

import { useRouter } from "next/navigation";

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

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  const isZh =
    typeof window !== "undefined"
      ? window.location.pathname.startsWith("/zh")
      : true;

  return (
    <button
      onClick={handleBack}
      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
    >
      {isZh ? labelZh : labelEn}
    </button>
  );
}