import Link from "next/link";
import CollaborationEditor from "@/components/profile/CollaborationEditor";
import Navbar from "@/components/layout/Navbar";
import PersonalProfileEditor from "@/components/profile/PersonalProfileEditor";
import { loadPersonalProfile } from "@/lib/profile/personal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  const result = user ? await loadPersonalProfile(client, "id", user.id) : null;
  return <main className="min-h-screen bg-black text-white">
    <Navbar />
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <h1 className="text-4xl font-bold">Profile Settings</h1>
      {!user ? <Link href="/login" className="text-purple-300 hover:underline">Sign in to edit your profile</Link>
        : result?.profile ? <>
          <PersonalProfileEditor profile={result.profile} extended={result.extended} />
          <CollaborationEditor key={result.profile.id} />
        </>
        : <p role="alert" className="text-rose-300">Your profile could not be loaded. Refresh and try again.</p>}
    </div>
  </main>;
}
