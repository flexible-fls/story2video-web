import { NextResponse } from "next/server";
import { createServerSupabaseAdmin } from "@/lib/server-supabase";

type UpdateGenerationJobBody = {
  id?: unknown;
  status?: unknown;
  progress?: unknown;
  result_url?: unknown;
  error_message?: unknown;
};

const ALLOWED_STATUSES = new Set(["pending", "processing", "success", "failed"]);

function asTrimmedString(value: unknown, maxLength = 2000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as UpdateGenerationJobBody;

    const id = asTrimmedString(body.id, 128);
    const status = asTrimmedString(body.status, 32);
    const progress =
      typeof body.progress === "number" && Number.isFinite(body.progress)
        ? Math.max(0, Math.min(100, Math.round(body.progress)))
        : 0;
    const result_url = asTrimmedString(body.result_url, 1000) || null;
    const error_message = asTrimmedString(body.error_message, 1000) || null;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = createServerSupabaseAdmin();

    const { error } = await supabase
      .from("generation_jobs")
      .update({
        status,
        progress,
        result_url,
        error_message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update generation job",
      },
      { status: 500 }
    );
  }
}