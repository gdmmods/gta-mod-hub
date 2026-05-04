"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditCreatorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* -----------------------------
     FETCH CREATOR
  ----------------------------- */
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("LOAD ERROR:", error);
      }

      if (data) {
        setName(data.name || "");
        setBio(data.bio || "");
        setAvatar(data.avatar || "");
        setBanner(data.banner || "");
      }

      setLoading(false);
    };

    if (id) load();
  }, [id]);

  /* -----------------------------
     SAVE
  ----------------------------- */
  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("creators")
      .update({
        name,
        bio,
        avatar,
        banner,
      })
      .eq("id", id);

    if (error) {
      console.error("SAVE ERROR:", error);
      alert("Error saving");
      setSaving(false);
      return;
    }

    // 🔥 force fresh data reload
    router.push(`/creator/${id}`);
    router.refresh();
  };

  if (loading) {
    return <div className="text-white p-10">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-black text-white p-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Creator</h1>

      <div className="space-y-4">
        <input
          className="w-full p-3 bg-neutral-900 rounded"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          className="w-full p-3 bg-neutral-900 rounded"
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <input
          className="w-full p-3 bg-neutral-900 rounded"
          placeholder="Avatar URL"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        />

        <input
          className="w-full p-3 bg-neutral-900 rounded"
          placeholder="Banner URL"
          value={banner}
          onChange={(e) => setBanner(e.target.value)}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-white text-black px-5 py-2 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </main>
  );
}