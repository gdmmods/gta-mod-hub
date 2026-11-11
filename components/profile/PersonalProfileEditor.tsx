"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useCreatorContext } from "@/app/contexts/CreatorContext";
import { normalizeProfileLinks, profileSocialFields } from "@/lib/profile/fields";
import type { PersonalProfile } from "@/lib/profile/personal";
import { supabase } from "@/lib/supabase/client";
import IdentityHandleEditor from "./IdentityHandleEditor";
import { ProfileImageFields, ProfileSocialFields, ProfileTextFields, profileInputClass } from "./ProfileFormFields";

export default function PersonalProfileEditor({ profile, extended }: { profile: PersonalProfile; extended: boolean }) {
  const router = useRouter();
  const { activeCreatorId } = useCreatorContext();
  const [username, setUsername] = useState(profile.username ?? "");
  const [form, setForm] = useState({
    name: profile.display_name ?? "",
    tagline: profile.tagline ?? "",
    location: profile.location ?? "",
    bio: profile.bio ?? "",
    avatar: profile.avatar_url ?? "",
    banner: profile.banner_url ?? "",
    interests: (profile.interests ?? []).join(", "),
    socials: profile.socials ?? {},
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function change(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || uploading) return;
    setError("");
    setSaving(true);
    try {
      const profileUsername = profile.username ?? username.trim().toLowerCase();
      if (!profile.username && !/^[a-z0-9][a-z0-9_.-]{2,31}$/.test(profileUsername)) {
        throw new Error("Choose a username with 3–32 characters, starting with a letter or number.");
      }
      const images = normalizeProfileLinks(
        { avatar: form.avatar !== (profile.avatar_url ?? "") ? form.avatar : "",
          banner: extended && form.banner !== (profile.banner_url ?? "") ? form.banner : "" },
        ["avatar", "banner"],
      );
      const interests = [...new Set(form.interests.split(",").map(value => value.trim()).filter(Boolean))];
      if (extended && (interests.length > 20 || interests.some(value => value.length > 60))) {
        throw new Error("Use up to 20 interests with no more than 60 characters each.");
      }

      const { data, error } = await supabase.from("profiles").update({
        ...(profile.username ? {} : { username: profileUsername }),
        display_name: form.name.trim() || null,
        avatar_url: form.avatar === (profile.avatar_url ?? "") ? profile.avatar_url : images.avatar ?? null,
        bio: form.bio.trim() || null,
        updated_at: new Date().toISOString(),
        ...(extended ? {
          banner_url: form.banner === (profile.banner_url ?? "") ? profile.banner_url : images.banner ?? null,
          tagline: form.tagline.trim() || null,
          location: form.location.trim() || null,
          interests,
          socials: normalizeProfileLinks(form.socials, profileSocialFields),
        } : {}),
      }).eq("id", profile.id).select("username").maybeSingle();
      if (error?.code === "23505") throw new Error("That username is in use or was previously reserved.");
      if (!profile.username && error?.code === "22023") throw new Error(error.message);
      if (error || !data) throw new Error("Could not save your personal profile. Check that you’re signed in and try again.");
      router.push("/profile/" + encodeURIComponent(data.username));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your personal profile.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <form onSubmit={save} className="space-y-7 rounded-[32px] border border-zinc-800 bg-zinc-950 p-5 sm:p-8">
      <fieldset disabled={saving} className="space-y-7">
        <legend className="text-xl font-semibold">Personal profile</legend>
        {profile.username ? <p className="text-sm text-zinc-400">Profile URL: /profile/{profile.username}</p>
          : <label className="block space-y-2 text-sm text-zinc-300">
              <span>Profile username</span>
              <input name="username" value={username} onChange={event => setUsername(event.target.value)} maxLength={32}
                autoCapitalize="none" spellCheck={false} className={profileInputClass} required />
              <span className="block text-zinc-400">This is your permanent profile address and first public handle.</span>
            </label>}
        <ProfileTextFields form={form} onChange={change} extended={extended} />
        <ProfileImageFields values={form} onChange={(field, value) => setForm(previous => ({ ...previous, [field]: value }))}
          onUploadingChange={setUploading} uploadEnabled={extended} bannerEnabled={extended} />
        {extended && <>
          <label className="block space-y-2 text-sm text-zinc-300">
            <span>Interests (comma separated)</span>
            <input name="interests" value={form.interests} onChange={change} maxLength={1240} className={profileInputClass} />
          </label>
          <ProfileSocialFields socials={form.socials}
            onChange={(field, value) => setForm(previous => ({ ...previous, socials: { ...previous.socials, [field]: value } }))} />
        </>}
      </fieldset>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <button type="submit" disabled={saving || uploading} className="rounded-xl bg-purple-600 px-6 py-3 font-medium hover:bg-purple-500 disabled:opacity-50">
        {saving ? "Saving…" : "Save Profile"}
      </button>
    </form>
    {profile.username && <IdentityHandleEditor username={profile.username} />}
    <section className="space-y-3 rounded-[32px] border border-zinc-800 bg-zinc-950 p-5 sm:p-8">
      <h2 className="text-xl font-semibold">Creator Access</h2>
      <div className="flex flex-wrap gap-4 text-sm text-purple-300">
        {activeCreatorId && <Link href={"/creator/" + activeCreatorId} className="hover:underline">Manage Creator</Link>}
        <Link href="/become-creator" className="hover:underline">Create / Claim Creator</Link>
      </div>
    </section>
  </>;
}
