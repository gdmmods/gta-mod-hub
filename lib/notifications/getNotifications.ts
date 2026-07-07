import { supabase } from "@/lib/supabase/client";

export async function getNotifications(profileId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      activity_events(*)
    `)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}