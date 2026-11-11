"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { profileInputClass } from "./ProfileFormFields";
import { supabase } from "@/lib/supabase/client";

export default function IdentityHandleEditor({ creatorId = null, username }: { creatorId?: string | null; username?: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const request = creatorId
      ? supabase.rpc("get_creator_handle", { p_creator: creatorId })
      : supabase.rpc("get_personal_handle", { p_username: username });
    void request.then(result => {
      if (!active) return;
      if (result.error) {
        setError(true);
        setMessage("Handle settings are currently unavailable.");
        return;
      }
      setSaved(result.data);
      setValue(result.data ?? "");
      setReady(true);
    });
    return () => { active = false; };
  }, [creatorId, username]);

  const candidate = value.trim();
  const changed = Boolean(candidate) && candidate.toLowerCase() !== saved?.toLowerCase();

  async function check() {
    setBusy(true);
    setError(false);
    const { data, error } = await supabase.rpc("identity_handle_availability", { p_handle: candidate });
    setBusy(false);
    const messages: Record<string, string> = {
      available: "This handle is available.",
      unavailable: "This handle is in use or was previously reserved.",
      reserved: "This handle is reserved.",
      invalid: "Use 3–32 letters, numbers, dots, underscores, or hyphens. Start with a letter or number.",
    };
    setError(Boolean(error) || data !== "available");
    setMessage(error ? "Could not check handle availability." : messages[data] ?? "Could not check handle availability.");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !ready || !changed) return;
    setBusy(true);
    setError(false);
    setMessage("");
    const result = await supabase.rpc("set_identity_handle", { p_creator: creatorId, p_handle: candidate });
    setBusy(false);
    if (result.error) {
      setError(true);
      setMessage(["22023", "23505", "42501"].includes(result.error.code)
        ? result.error.message : "Could not save this handle. Try again.");
      return;
    }
    setSaved(result.data);
    setValue(result.data);
    setMessage("Saved @" + result.data + ".");
    router.refresh();
  }

  return <form onSubmit={save} className="space-y-4 rounded-[32px] border border-zinc-800 bg-zinc-950 p-5 sm:p-8">
    <h2 className="text-xl font-semibold">Public handle</h2>
    <p className="text-sm text-zinc-400">Use 3–32 letters, numbers, dots, underscores, or hyphens. Start with a letter or number. Previous handles stay reserved.</p>
    <label className="block space-y-2 text-sm text-zinc-300">
      <span>Handle</span>
      <input value={value} onChange={event => { setValue(event.target.value); setMessage(""); }}
        disabled={!ready || busy} maxLength={32} autoCapitalize="none" spellCheck={false} className={profileInputClass} />
    </label>
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={!ready || !changed || busy} onClick={() => void check()}
        className="rounded-xl border border-purple-500/30 px-4 py-2 text-sm text-purple-200 disabled:opacity-50">Check availability</button>
      <button type="submit" disabled={!ready || !changed || busy}
        className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">Save handle</button>
    </div>
    {message && <p role={error ? "alert" : "status"} className={error ? "text-sm text-rose-300" : "text-sm text-emerald-300"}>{message}</p>}
  </form>;
}
