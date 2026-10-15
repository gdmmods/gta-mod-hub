import { createClient } from "@supabase/supabase-js";

function createDiscoverySupabase(url: string, key: string, token: string) {
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export type DiscoveryRequestContext = {
  supabase: ReturnType<typeof createDiscoverySupabase>;
  userId: string;
};

export async function getDiscoveryRequestContext(
  request: Request
): Promise<DiscoveryRequestContext | null> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !supabaseUrl || !anonKey) return null;

  const supabase = createDiscoverySupabase(supabaseUrl, anonKey, token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { supabase, userId: data.user.id };
}

export async function canManageCreator(
  context: DiscoveryRequestContext,
  creatorId: string
): Promise<boolean> {
  const { data: creator, error } = await context.supabase
    .from("creators")
    .select("id, owner_id")
    .eq("id", creatorId)
    .maybeSingle();

  return !error && creator?.owner_id === context.userId;
}