import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasEnv } from "@/lib/env";

let browserSupabase: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (browserSupabase) {
    return browserSupabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseUrl.trim()) {
    console.error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
    return null;
  }

  if (!supabaseAnonKey || !supabaseAnonKey.trim()) {
    console.error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return null;
  }

  browserSupabase = createClient(supabaseUrl.trim(), supabaseAnonKey.trim());
  return browserSupabase;
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabaseBrowserClient();

      if (!client) {
        throw new Error(
          `Supabase browser client is unavailable because required public environment variables are missing. Tried to access: ${String(
            prop
          )}`
        );
      }

      const value = client[prop as keyof typeof client];

      if (typeof value === "function") {
        return value.bind(client);
      }

      return value;
    },
  }
) as SupabaseClient;

export function isSupabaseBrowserReady() {
  return hasEnv("NEXT_PUBLIC_SUPABASE_URL") && hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}