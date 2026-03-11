import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "@/lib/env";

export const supabase = createClient(
  getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
);