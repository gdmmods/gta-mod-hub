import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAuthorizedModEditor } from "@/lib/server/mod-edit-authorization";

export default async function AuthorizedModEditLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: mod, error: modError } = await supabase
    .from("mods")
    .select("id, creator_id")
    .eq("id", id)
    .maybeSingle();
  if (modError || !mod?.creator_id) notFound();

  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("id, owner_id")
    .eq("id", mod.creator_id)
    .maybeSingle();
  if (
    creatorError ||
    !isAuthorizedModEditor({
      userId: user.id,
      modCreatorId: mod.creator_id,
      linkedCreatorId: creator?.id,
      creatorOwnerId: creator?.owner_id,
    })
  ) {
    notFound();
  }

  return children;
}
