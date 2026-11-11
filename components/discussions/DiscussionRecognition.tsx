"use client";

import { Award } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { RecognitionState } from "@/lib/discussions/recognition";

export default function DiscussionRecognition({ modId, commentId, state, onChange }: {
  modId: string;
  commentId: string;
  state: RecognitionState;
  onChange: (state: RecognitionState) => void;
}) {
  const [mode, setMode] = useState<"award" | "revoke" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<string | null>(null);

  async function save(action: "award" | "revoke") {
    if (busy) return;
    const id = action === "revoke" ? state.recognitionId : (request.current ??= crypto.randomUUID());
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      const { data, error } = await supabase.rpc("write_discussion_recognition", {
        p_mod: modId, p_comment: commentId, p_action: action, p_request: id, p_reason: action === "award" ? reason : null,
      });
      if (error || !data) {
        setError(error?.message ?? "Recognition could not be updated.");
        return;
      }
      onChange(data);
      request.current = null;
      setMode(null);
      setReason("");
    } catch {
      setError("Recognition could not be updated. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-3 space-y-2">
    {state.active && <div className="text-xs text-purple-200">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1">
        <Award size={14} aria-hidden="true" /> Recognized by creator
      </span>
      {state.reason && <p className="mt-1 break-words text-zinc-400">{state.reason}</p>}
    </div>}
    {!mode && (state.canAward || state.canRevoke) && <button type="button" className="inline-flex items-center gap-1 text-xs text-purple-300 hover:underline"
      onClick={() => setMode(state.canRevoke ? "revoke" : "award")}>
      <Award size={14} aria-hidden="true" /> {state.canRevoke ? "Revoke recognition" : "Recognize contribution"}
    </button>}
    {mode && <form className="space-y-2" onSubmit={event => { event.preventDefault(); void save(mode); }}>
      {mode === "award" && <label className="block text-xs text-zinc-400">Reason (optional)
        <input value={reason} maxLength={240} onChange={event => setReason(event.target.value)}
          className="mt-1 block w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-zinc-100" />
      </label>}
      <div className="flex flex-wrap gap-3 text-xs">
        <button type="submit" disabled={busy} className="rounded-lg border border-purple-500/40 px-3 py-2 text-purple-200 disabled:opacity-50">
          {mode === "award" ? "Award Helpful Contribution" : "Confirm revocation"}
        </button>
        <button type="button" disabled={busy} onClick={() => { setMode(null); setError(""); }} className="text-zinc-400 hover:text-white">Cancel</button>
      </div>
    </form>}
    {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
  </div>;
}
