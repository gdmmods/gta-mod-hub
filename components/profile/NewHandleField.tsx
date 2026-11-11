"use client";

import { supabase } from "@/lib/supabase/client";

export async function checkNewHandle(handle: string, signup = false): Promise<string | null> {
  if (!/^[a-z0-9][a-z0-9_.-]{2,31}$/.test(handle)) {
    return "Use 3–32 characters, starting with a letter or number. You can also use dots, underscores, and hyphens.";
  }
  const { data, error } = await supabase.rpc(
    signup ? "signup_handle_availability" : "identity_handle_availability",
    { p_handle: handle }
  );
  if (error) return "Could not check handle availability. Please try again.";
  if (data === "available") return null;
  if (data === "reserved") return "This handle is reserved.";
  return "This handle is already in use or was previously reserved.";
}

export default function NewHandleField({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) {
  return <label className="block text-sm text-zinc-400">
    Public handle
    <input
      name="handle"
      value={value}
      onChange={event => onChange(event.target.value)}
      autoComplete="username"
      autoCapitalize="none"
      spellCheck={false}
      maxLength={32}
      className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white"
      placeholder="your-handle"
    />
    <span className="mt-2 block text-xs">Required to create this profile. Use 3–32 letters, numbers, dots, underscores, or hyphens.</span>
  </label>;
}
