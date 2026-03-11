import { NextResponse } from "next/server";
import { createServerSupabaseAdmin } from "@/lib/server-supabase";

type CreateGenerationJobBody = {
  user_id?: unknown;
  email?: unknown;
  script_title?: unknown;
  plan?: unknown;
  quota_cost?: unknown;
};

function asTrimmedString(value: unknown, maxLength = 255) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateGenerationJobBody;

    const user_id = asTrimmedString(body.user_id, 128);
    const email = asTrimmedString(body.email, 255) || null;
    const script_title = asTrimmedString(body.script_title, 255) || null;
    const plan = asTrimmedString(body.plan, 50) || "free";
    const quota_cost =
      typeof body.quota_cost === "number" && Number.isFinite(body.quota_cost)
        ? Math.max(0, Math.floor(body.quota_cost))
        : 0;

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const supabase = createServerSupabaseAdmin();

    const { data, error } = await supabase
      .from("generation_jobs")
      .insert([
        {
          user_id,
          email,
          script_title,
          plan,
          quota_cost,
          status: "pending",
          progress: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create generation job",
      },
      { status: 500 }
    );
  }
}