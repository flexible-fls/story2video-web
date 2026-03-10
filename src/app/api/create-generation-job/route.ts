import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {

  const body = await req.json();

  const {
    user_id,
    email,
    script_title,
    plan,
    quota_cost
  } = body;

  const { data, error } = await supabase
    .from("generation_jobs")
    .insert([
      {
        user_id,
        email,
        script_title,
        plan,
        quota_cost,
        status: "pending"
      }
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }

  return NextResponse.json(data);
}