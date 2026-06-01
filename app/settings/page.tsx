"use client";

import Navbar from "@/components/layout/Navbar";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [creatorId, setCreatorId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: creatorMember } = await supabase
        .from("creator_members")
        .select("creator_id")
        .eq("profile_id", user.id)
        .eq("role", "owner")
        .single();

        if (creatorMember) {
        setCreatorId(creatorMember.creator_id);
        }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error);
    }

    if (data) {
      setUsername((data.username || "").toLowerCase());
      setDisplayName(data.display_name || "");
      setAvatarUrl(data.avatar_url || "");
      setBio(data.bio || "");
    }

    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.toLowerCase().trim(),
        display_name: displayName,
        avatar_url: avatarUrl,
        bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Failed to save profile.");
    } else {
      router.push(`/profile/${username.toLowerCase()}`);
    }

    setSaving(false);
  }

  if (loading) {
    return (   
      <main className="min-h-screen bg-black text-white p-10">
        Loading profile...
      </main>
    );
  }


  
  return ( 
 
    <>
    <Navbar />

    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-purple-400 uppercase tracking-[0.3em] text-sm mb-4">
          Account Settings
        </p>

        <h1 className="text-5xl font-bold mb-10">
          Profile Settings
        </h1>

        <div className="space-y-6 rounded-[32px] border border-zinc-800 bg-zinc-950 p-8">

          <div>
            <label className="block text-sm mb-2">
              Username
            </label>

            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Display Name
            </label>

            <input
              value={displayName}
              onChange={(e) =>
                setDisplayName(e.target.value)
              }
              className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Avatar URL
            </label>

            <input
              value={avatarUrl}
              onChange={(e) =>
                setAvatarUrl(e.target.value)
              }
              className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Bio
            </label>

            <textarea
              value={bio}
              onChange={(e) =>
                setBio(e.target.value)
              }
              rows={5}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3"
            />
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="
              rounded-xl
              px-6
              py-3
              bg-purple-600
              hover:bg-purple-500
              transition
            "
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>

          <div className="pt-8 border-t border-zinc-800">
            <p className="text-purple-400 uppercase tracking-[0.3em] text-sm mb-3">
                Creator Access
            </p>

            <h2 className="text-2xl font-bold mb-3">
                Ready to Publish Mods?
            </h2>

            <p className="text-zinc-400 mb-6">
                Create or Claim a creator profile and start building your presence on ModVault.
            </p>

            <div className="flex gap-3 flex-wrap">

                {creatorId && (
                  <button
                    onClick={() =>
                      router.push(`/creator/${creatorId}`)
                    }
                    className="
                      rounded-xl
                      px-6
                      py-3
                      bg-purple-600
                      hover:bg-purple-500
                      transition
                    "
                  >
                    Manage Creator
                  </button>
                )}

                <button
                  onClick={() =>
                    router.push("/become-creator")
                  }
                  className="
                    rounded-xl
                    px-6
                    py-3
                    bg-zinc-800
                    hover:bg-zinc-700
                    transition
                  "
                >
                  Create / Claim Creator
                </button>

              </div>

            </div>
        </div>
      </div>
    
    </main>
    </>
  );
}