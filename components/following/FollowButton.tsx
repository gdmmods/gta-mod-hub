"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCreatorContext } from "@/app/contexts/CreatorContext";
import { supabase } from "@/lib/supabase/client";

export type FollowKind = "user" | "creator" | "mod";
const followLabels: Record<FollowKind, string> = { user: "Follow User", creator: "Follow Creator", mod: "Follow Mod" };
export const profileFollowClassName = "block w-full rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 py-3 text-center font-semibold text-white shadow-[0_0_30px_rgba(168,85,247,0.22)] transition hover:opacity-90 disabled:opacity-50";

type FollowState = { following: boolean; canFollow: boolean; signedIn: boolean; identityCreatorId: string | null };

type Props = {
  kind: FollowKind;
  id: string;
  className: string;
  onUnfollow?: () => void;
};

export default function FollowButton(props: Props) {
  const { accountId, activeCreatorId, loading, selecting } = useCreatorContext();
  return <IdentityFollowButton key={[accountId, activeCreatorId, props.kind, props.id].join(":")}
    {...props} creatorId={activeCreatorId} identityBusy={loading || selecting} />;
}

function IdentityFollowButton({ kind, id, className, onUnfollow, creatorId, identityBusy }: Props & {
  creatorId: string | null;
  identityBusy: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<FollowState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const managing = Boolean(onUnfollow);

  useEffect(() => {
    if (managing || identityBusy) return;
    let current = true;
    async function load() {
      const { data, error } = await supabase.rpc("follow_state", { p_kind: kind, p_id: id });
      if (!current) return;
      const unavailable = error || data?.identityCreatorId !== creatorId;
      setState(unavailable ? null : data);
      setError(unavailable ? "Following is currently unavailable for this identity." : "");
    }
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") setTimeout(() => { if (current) void load(); }, 0);
    });
    return () => { current = false; subscription.unsubscribe(); };
  }, [kind, id, managing, creatorId, identityBusy]);

  if (!identityBusy && !managing && state?.signedIn === false && state.canFollow) {
    return <Link href="/login" className={className}>{followLabels[kind]}</Link>;
  }

  const following = !identityBusy && (managing || Boolean(state?.following));
  const disabled = identityBusy || busy || (!managing && (!state || (!following && !state.canFollow)));

  async function toggle() {
    setBusy(true);
    setError("");
    const { error } = await supabase.rpc("set_follow", { p_kind: kind, p_id: id, p_follow: !following, p_expected_creator: creatorId });
    setBusy(false);
    if (error) {
      if (error.code === "42501" && !(await supabase.auth.getUser()).data.user) {
        router.push("/login");
        return;
      }
      setError("Could not change your follow. Please try again.");
      return;
    }
    setState(previous => previous && { ...previous, following: !following });
    onUnfollow?.();
    if (kind !== "mod" && !managing) router.refresh();
  }

  return <>
    <button type="button" className={className} disabled={disabled} aria-pressed={managing ? undefined : following}
      title={following ? "Unfollow" : state && !state.canFollow ? "Following is unavailable for this profile or mod" : undefined}
      onClick={() => void toggle()}>
      {!managing && following && <Check aria-hidden="true" className="mr-1 inline size-4" />}
      {managing ? "Unfollow" : identityBusy || (!state && !error) ? "Loading…" : following ? "Following" : followLabels[kind]}
    </button>
    {error && <p role="status" className="mt-1 text-xs text-rose-300">{error}</p>}
  </>;
}
