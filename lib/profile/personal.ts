import type { SupabaseClient } from "@supabase/supabase-js";

const baseFields = "id,username,display_name,avatar_url,bio";
const extraFields = "banner_url,tagline,location,interests,socials";

export type PersonalProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  banner_url?: string | null;
  tagline?: string | null;
  location?: string | null;
  interests?: string[];
  socials?: Record<string, string>;
};

export async function loadPersonalProfile(client: SupabaseClient, field: "id" | "username", value: string) {
  const result = await client.from("profiles").select(baseFields + "," + extraFields).eq(field, value).maybeSingle();
  if (result.error?.code === "42703" || result.error?.code === "PGRST204") {
    const fallback = await client.from("profiles").select(baseFields).eq(field, value).maybeSingle();
    return { profile: fallback.data as PersonalProfile | null, error: fallback.error, extended: false };
  }
  return { profile: result.data as PersonalProfile | null, error: result.error, extended: true };
}
