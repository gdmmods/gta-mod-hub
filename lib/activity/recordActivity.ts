import { supabase } from "@/lib/supabase/client";

interface RecordActivityParams {
  actorCreatorId: string;

  eventType: string;

  targetType?: string;
  targetId?: string;

  parentType?: string;
  parentId?: string;

  visibility?: string;

  metadata?: Record<string, any>;
}

export async function recordActivity({
  actorCreatorId,
  eventType,
  targetType,
  targetId,
  parentType,
  parentId,
  visibility = "private",
  metadata = {},
}: RecordActivityParams) {
  const { error } = await supabase
    .from("activity_events")
    .insert({
      actor_creator_id: actorCreatorId,

      event_type: eventType,

      target_type: targetType ?? null,
      target_id: targetId ?? null,

      parent_type: parentType ?? null,
      parent_id: parentId ?? null,

      visibility,

      metadata,
    });

  if (error) {
    console.log(
  "ACTIVITY ERROR:",
  JSON.stringify(error, null, 2)
);

console.error(error);
  }
}