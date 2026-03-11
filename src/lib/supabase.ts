import { createClient } from "@supabase/supabase-js";

// 获取环境变量并检查是否存在
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-fallback-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-fallback-anon-key";

// 如果缺少环境变量，打印错误信息
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);