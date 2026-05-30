import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/layout/Navbar";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({
  params,
}: PageProps) {
  const { username } = await params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

console.log("USERNAME PARAM:", username);
console.log("PROFILE:", profile);

  if (!profile) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-3xl font-bold">
          Profile not found
        </h1>
      </main>
    );
  }

  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-20">

        <div className="rounded-[32px] border border-zinc-800 bg-zinc-950 p-10">

          <div className="flex items-center gap-6 mb-8">

            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-28 h-28 rounded-full object-cover border border-zinc-700"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-zinc-800" />
            )}

            <div>
              <h1 className="text-5xl font-bold">
                {profile.display_name || profile.username}
              </h1>

              <p className="text-zinc-400 mt-2">
                @{profile.username}
              </p>
            </div>

          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">
              About
            </h2>

            <p className="text-zinc-300">
              {profile.bio || "No bio yet."}
            </p>
          </div>

        </div>

      </div>
    </main>
    </>
  );
}