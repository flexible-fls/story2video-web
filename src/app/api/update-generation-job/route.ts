import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {

  const body = await req.json();

  const {
    id,
    status,
    progress,
    result_url,
    error_message
  } = body;

  const { error } = await supabase
    .from("generation_jobs")
    .update({
      status,
      progress,
      result_url,
      error_message,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }

  return NextResponse.json({
    success: true
  });
}