"use client";

import { useState, type ChangeEvent } from "react";
import { profileImageLimit, profileImageTypes, profileSocialFields } from "@/lib/profile/fields";
import { supabase } from "@/lib/supabase/client";

export const profileInputClass = "w-full min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-purple-500";

type TextValues = { name: string; tagline: string; location: string; bio: string };
type TextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

export function ProfileTextFields({ form, onChange, extended = true }: { form: TextValues; onChange: TextChange; extended?: boolean }) {
  return <div className="space-y-4">
    {([["name", "Display name", 120], ["tagline", "Short introduction", 200], ["location", "Location (optional)", 120]] as const).filter(([field]) => extended || field === "name").map(([field, label, maxLength]) =>
      <label key={field} className="block space-y-2 text-sm text-zinc-300">
        <span>{label}</span><input name={field} value={form[field]} onChange={onChange} maxLength={maxLength} className={profileInputClass} />
      </label>)}
    <label className="block space-y-2 text-sm text-zinc-300">
      <span>Biography</span><textarea name="bio" value={form.bio} onChange={onChange} maxLength={5000} rows={6} className={profileInputClass} />
    </label>
  </div>;
}

const socialLabels: Record<string, string> = {
  website: "Website", discord: "Discord", youtube: "YouTube", instagram: "Instagram",
  twitter: "X / Twitter", github: "GitHub", patreon: "Patreon", kofi: "Ko-fi", store: "Store", support_email: "Support email",
};

export function ProfileSocialFields({ socials, onChange, creator = false }: {
  socials: Record<string, string>;
  onChange: (name: string, value: string) => void;
  creator?: boolean;
}) {
  const fields = creator ? [...profileSocialFields, "patreon", "kofi", "store", "support_email"] : profileSocialFields;
  return <div className="grid gap-4 sm:grid-cols-2">
    {fields.map(field => <label key={field} className="block space-y-2 text-sm text-zinc-300">
      <span>{socialLabels[field]}</span>
      <input name={field} value={socials[field] ?? ""} onChange={event => onChange(field, event.target.value)}
        inputMode={field === "support_email" ? "email" : "url"} maxLength={2048} className={profileInputClass} />
    </label>)}
  </div>;
}

export function ProfileImageFields({ values, onChange, onUploadingChange, uploadEnabled = true, bannerEnabled = true }: {
  values: { avatar: string; banner: string };
  onChange: (field: "avatar" | "banner", value: string) => void;
  onUploadingChange: (busy: boolean) => void;
  uploadEnabled?: boolean;
  bannerEnabled?: boolean;
}) {
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const [error, setError] = useState("");

  async function upload(field: "avatar" | "banner", file: File) {
    setError("");
    const extension = Object.prototype.hasOwnProperty.call(profileImageTypes, file.type)
      ? profileImageTypes[file.type as keyof typeof profileImageTypes] : undefined;
    if (!extension || file.size === 0 || file.size > profileImageLimit) {
      setError("Choose a JPEG, PNG, WebP, or GIF image up to 5 MB.");
      return;
    }

    setUploading(field);
    onUploadingChange(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to upload a profile image.");
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const bucket = supabase.storage.from("profile-images");
      const result = await bucket.upload(path, file, { contentType: file.type, upsert: false });
      if (result.error) throw new Error("Could not upload this profile image. Try again or enter an image URL.");
      onChange(field, bucket.getPublicUrl(path).data.publicUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not upload this profile image.");
    } finally {
      setUploading(null);
      onUploadingChange(false);
    }
  }

  return <div className="space-y-4">
    {(["avatar", "banner"] as const).filter(field => bannerEnabled || field === "avatar").map(field => <div key={field} className="space-y-2">
      <label className="block space-y-2 text-sm text-zinc-300">
        <span>{field === "avatar" ? "Avatar image URL" : "Banner image URL"}</span>
        <input name={field} value={values[field]} inputMode="url" maxLength={2048} disabled={Boolean(uploading)}
          className={profileInputClass} onChange={event => onChange(field, event.target.value)} />
      </label>
      {uploadEnabled && <label className="block space-y-2 text-sm text-zinc-400">
        <span>{uploading === field ? "Uploading…" : "Upload " + field}</span>
        <input type="file" accept={Object.keys(profileImageTypes).join(",")} disabled={Boolean(uploading)}
          className="block max-w-full file:mr-3 file:rounded-lg file:border-0 file:bg-purple-500/15 file:px-3 file:py-2 file:text-purple-200 disabled:opacity-50"
          onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(field, file);
          }} />
      </label>}
    </div>)}
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
  </div>;
}
