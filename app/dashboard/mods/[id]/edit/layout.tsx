import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const { data: canEdit, error } = await supabase.rpc("can_edit_mod", { p_mod: id });
  if (error || !canEdit) notFound();
  return children;
}
