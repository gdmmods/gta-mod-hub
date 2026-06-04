export const dynamic = "force-dynamic";

import CreatorOwnershipGuard from "@/components/creator/edit (outdated)/CreatorOwnershipGuard";
import CreatorEditLayout from "@/components/creator/edit (outdated)/CreatorEditLayout";
import CreatorEditForm from "@/components/creator/edit (outdated)/CreatorEditForm";

import { supabaseAdmin } from "@/lib/supabase/admin";

interface EditCreatorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCreatorPage({
  params,
}: EditCreatorPageProps) {

  const { id } = await params;

  const {
    data: creator,
    error,
  } = await supabaseAdmin
    .from("creators")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !creator) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Creator not found.
      </main>
    );
  }

  return (
    <CreatorOwnershipGuard creatorId={id}>
      <CreatorEditLayout
        title="Edit Creator Profile"
        description="Manage creator branding, socials, profile details, specialization tags, and public presence."
      >
        <CreatorEditForm creator={creator} />
      </CreatorEditLayout>
    </CreatorOwnershipGuard>
  );
}