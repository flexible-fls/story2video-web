import { supabase } from "@/lib/supabase";

export async function logActivity(params: {
  userId: string | null;
  actorEmail?: string | null;
  actionType: string;
  targetType?: string | null;
  targetId?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!params.userId) return;

  try {
    await supabase.rpc("log_activity", {
      p_user_id: params.userId,
      p_actor_email: params.actorEmail ?? null,
      p_action_type: params.actionType,
      p_target_type: params.targetType ?? null,
      p_target_id: params.targetId ?? null,
      p_message: params.message ?? null,
      p_metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("logActivity failed:", error);
  }
}