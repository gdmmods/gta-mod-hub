import { supabase } from "@/lib/supabase/client";

interface RecordActivityOptions {
  eventType: string;

  actor: {
    type: "creator" | "user" | "system";
    id?: string;
  };

  target: {
    type: string;
    id: string;
  };

  parent?: {
    type: string;
    id: string;
  };

  visibility?: "public" | "private" | "internal";

  title?: string;
  summary?: string;

  metadata?: Record<string, any>;
}

export async function recordActivity(
  options: RecordActivityOptions
) {
  const { error } = await supabase
    .from("activity_events")
    .insert({
      event_type: options.eventType,

      actor_type: options.actor.type,
      actor_id: options.actor.id ?? null,

      target_type: options.target.type,
      target_id: options.target.id,

      parent_type: options.parent?.type ?? null,
      parent_id: options.parent?.id ?? null,

      visibility: options.visibility ?? "public",

      title: options.title ?? null,
      summary: options.summary ?? null,

      metadata: options.metadata ?? {},
    });

  if (error) {
    console.log(
      "ACTIVITY ERROR:",
      JSON.stringify(error, null, 2)
    );

    console.error(error);
  }

}