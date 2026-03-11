"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LanguageSwitch from "@/components/LanguageSwitch";
import BackButton from "@/components/BackButton";
import Link from "next/link";

export default function FilesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.startsWith("/en") ? "en" : "zh";
  const isZh = locale === "zh";

  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    void fetchFiles();
  }, [locale]);

  // Fetch user files
  async function fetchFiles() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/${locale}/auth`);
      return;
    }

    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    setFiles(data);
    setLoading(false);
  }

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleUpload = async () => {
    if (!fileName) return;

    setUploading(true);
    const file = document.getElementById("fileInput") as HTMLInputElement;
    const selectedFile = file?.files?.[0];

    if (selectedFile) {
      const { data, error } = await supabase.storage
        .from("uploads")
        .upload(`files/${selectedFile.name}`, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error(error);
        setUploading(false);
        return;
      }

      setUploadProgress(100);
      setTimeout(() => {
        fetchFiles(); // Fetch the updated list of files
      }, 2000);
    }
  };

  // Handle sign-out
  async function handleSignOut() {
    setUploading(true);
    await supabase.auth.signOut();
    setUploading(false);
    router.push(`/${locale}/auth`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06070a] text-white">
        <div className="flex min-h-screen items-center justify-center text-zinc-400">
          {isZh ? "加载文件..." : "Loading files..."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06070a] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${locale}`} />
            <div>
              <div className="text-xl font-semibold tracking-tight text-white">
                FulushouVideo
              </div>
              <div className="text-xs text-zinc-400">
                {isZh ? "文件管理与上传" : "File Management & Upload"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/generate`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.07]"
            >
              {isZh ? "开始生成任务" : "Start Task Generation"}
            </Link>

            <LanguageSwitch locale={locale} />
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-8 pt-14">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
              {isZh ? "上传文件 & 管理文件" : "Upload & Manage Files"}
            </h1>

            <p className="mt-6 text-base leading-8 text-zinc-300 md:text-lg">
              {isZh
                ? "上传你的文件进行处理，查看当前上传的文件，并管理它们。"
                : "Upload your files for processing, view currently uploaded files, and manage them."}
            </p>

            {/* File Upload */}
            <div className="mt-8">
              <input
                type="file"
                id="fileInput"
                onChange={handleFileChange}
                className="text-white bg-black border border-white/10 p-3 rounded-xl w-full"
              />
              {fileName && !uploading && (
                <div className="mt-4 text-sm text-zinc-300">{fileName}</div>
              )}
              {uploading && (
                <div className="mt-4 text-sm text-zinc-300">
                  {isZh ? "上传中..." : "Uploading..."} {uploadProgress}%
                </div>
              )}
            </div>

            <div className="mt-8">
              <button
                onClick={handleUpload}
                disabled={uploading || !fileName}
                className="rounded-2xl bg-emerald-400/10 px-5 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/15 disabled:opacity-50"
              >
                {isZh ? "开始上传" : "Start Uploading"}
              </button>
            </div>

            {/* Files Display */}
            {files.length > 0 ? (
              <div className="mt-8 space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5">
                    <div className="text-xl font-semibold text-white">{file.name}</div>
                    <div className="mt-3 text-sm text-zinc-400">
                      {isZh ? "上传时间" : "Uploaded At"}: {file.created_at}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Link
                        href={`/files/${file.id}`}
                        className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm text-emerald-300 transition hover:bg-emerald-400/15"
                      >
                        {isZh ? "查看文件" : "View File"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-white/10 bg-black/25 p-5 text-sm text-zinc-400">
                {isZh ? "暂无上传文件" : "No uploaded files"}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}