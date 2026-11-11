"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { profileInputClass } from "./ProfileFormFields";

export const collaborationAvailability = {
  open: "Open to collaboration", selective: "Selective", unavailable: "Not currently available",
} as const;
const fields = [
  { name: "skills", label: "Skills I can offer", max: 200 },
  { name: "interests", label: "Creative interests", max: 200 },
  { name: "looking_for", label: "Looking for", max: 300 },
] as const;

const empty = { skills: "", interests: "", looking_for: "", availability: "" };

export default function CollaborationEditor({ creatorId = null }: { creatorId?: string | null }) {
  const [values, setValues] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void supabase.rpc("my_collaboration_profile", { p_creator: creatorId }).abortSignal(controller.signal).then(({ data, error }) => {
      if (controller.signal.aborted) return;
      if (error) setError("Could not load collaboration details.");
      else if (data) setValues({
        skills: data.skills ?? "", interests: data.interests ?? "",
        looking_for: data.looking_for ?? "", availability: data.availability ?? "",
      });
      setLoading(false);
    });
    return () => controller.abort();
  }, [creatorId]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loading) return;
    setSaving(true);
    setError("");
    setSaved(false);
    const { error } = await supabase.rpc("save_collaboration_profile", {
      p_creator: creatorId, p_skills: values.skills, p_interests: values.interests,
      p_looking_for: values.looking_for, p_availability: values.availability || null,
    });
    if (error) setError(error.code === "42501" ? error.message : "Could not save collaboration details.");
    else setSaved(true);
    setSaving(false);
  }

  function change(name: keyof typeof empty, value: string) {
    setSaved(false);
    setValues(previous => ({ ...previous, [name]: value }));
  }

  return <form onSubmit={save} className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-8">
    <h2 className="text-xl font-semibold">Collaboration</h2>
    <p className="text-sm text-zinc-400">Optional details shown in People search.</p>
    <fieldset disabled={loading || saving || error === "Could not load collaboration details."} className="space-y-4">
      {fields.map(({ name, label, max }) => <label key={name} className="block space-y-2 text-sm">
        <span>{label}</span>
        <input className={profileInputClass} value={values[name]} maxLength={max} onChange={event => change(name, event.target.value)} />
      </label>)}
      <label className="block space-y-2 text-sm">
        <span>Collaboration availability</span>
        <select className={profileInputClass} value={values.availability} onChange={event => change("availability", event.target.value)}>
          <option value="">Unspecified</option>
          {Object.entries(collaborationAvailability).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <button type="submit" className="rounded-xl bg-purple-600 px-4 py-2 font-medium hover:bg-purple-500 disabled:opacity-50">
        {loading ? "Loading…" : saving ? "Saving…" : "Save collaboration details"}
      </button>
    </fieldset>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    {saved && <p role="status" className="text-sm text-purple-300">Collaboration details saved.</p>}
  </form>;
}
