"use client";

/* eslint-disable @next/next/no-img-element -- Profile avatars and mod thumbnails use arbitrary creator-provided hosts. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCreatorContext } from "@/app/contexts/CreatorContext";
import { supabase } from "@/lib/supabase/client";
import FollowButton, { type FollowKind } from "./FollowButton";

type Row = { id: string; name: string | null; image: string | null; attribution: string | null; available: boolean };
const pageSize = 24;

function FollowingSection({ kind, creatorId }: { kind: FollowKind; creatorId: string | null }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let current = true;
    void supabase.rpc("list_following", { p_kind: kind, p_limit: pageSize + 1, p_offset: offset, p_expected_creator: creatorId }).then(({ data, error }) => {
      if (!current) return;
      setError(Boolean(error));
      if (!error) {
        const batch = (data ?? []) as Row[];
        setRows(previous => offset === 0 ? batch.slice(0, pageSize) : [...previous, ...batch.slice(0, pageSize)]);
        setHasMore(batch.length > pageSize);
      }
      setLoading(false);
    });
    return () => { current = false; };
  }, [kind, offset, creatorId]);

  const label = kind === "creator" ? "Creators" : kind === "user" ? "Users" : "Mods";
  return <section className="space-y-4">
    <h2 className="text-xl font-semibold">{label}</h2>
    {error && <p role="status" className="text-rose-300">Could not load followed {label.toLowerCase()}.</p>}
    {!loading && !error && !rows.length && <p className="text-zinc-400">You haven’t followed any {label.toLowerCase()} yet.</p>}
    <ul className="grid gap-3 sm:grid-cols-2">
      {rows.map(row => <li key={row.id} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        {row.image && <img alt="" src={row.image} className="size-12 shrink-0 rounded-lg object-cover" />}
        <div className="min-w-0 flex-1">
          {row.available ? <Link className="block truncate font-semibold hover:text-purple-300"
            href={kind === "user" ? "/profile/" + encodeURIComponent(row.attribution ?? "") : `/${kind === "creator" ? "creator" : "mods"}/${row.id}`}>{row.name}</Link>
            : <p className="text-zinc-400">{kind === "mod" ? "Mod" : "Profile"} unavailable</p>}
          {row.attribution && <p className="truncate text-sm text-zinc-400">{kind === "user" ? "@" : ""}{row.attribution}</p>}
        </div>
        <FollowButton kind={kind} id={row.id} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:border-purple-500 disabled:opacity-50"
          onUnfollow={() => setRows(previous => previous.filter(item => item.id !== row.id))} />
      </li>)}
    </ul>
    {loading && <p role="status" className="text-zinc-400">Loading…</p>}
    {hasMore && !loading && <button className="text-purple-300 hover:underline" type="button" onClick={() => {
      setLoading(true);
      setOffset(rows.length);
    }}>Load more {label.toLowerCase()}</button>}
  </section>;
}

export default function FollowingList() {
  const { accountId, activeCreator, activeCreatorId, loading, selecting } = useCreatorContext();
  if (loading || selecting) return <p role="status" className="text-zinc-400">Loading selected identity…</p>;
  if (!accountId) return <Link href="/login" className="text-purple-300 hover:underline">Sign in to manage follows</Link>;
  const identityKey = accountId + ":" + (activeCreatorId ?? "personal");
  return <div key={identityKey} className="space-y-8">
    <p className="text-zinc-400">Managing as <strong className="text-white">{activeCreator?.name ?? "Personal profile"}</strong></p>
    {activeCreator?.owner_type === "team" && <p className="text-sm text-zinc-400">Only the team leader can manage team follows.</p>}
    <FollowingSection kind="user" creatorId={activeCreatorId} />
    <FollowingSection kind="creator" creatorId={activeCreatorId} />
    <FollowingSection kind="mod" creatorId={activeCreatorId} />
  </div>;
}
