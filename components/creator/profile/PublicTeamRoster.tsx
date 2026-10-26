"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CreatorModsGrid from "@/components/creator/profile/CreatorModsGrid";

export type PublicTeamMember = {
  creator_id: string;
  creator_name: string;
  creator_avatar: string | null;
  public_role: "owner" | "member";
};

export type PublicTeamMod = {
  id: string;
  title: string;
  image: string;
  category: string | null;
  description: string;
  likes: number;
  downloads: number;
  source_url: string;
  tags: string[];
  visibility: string;
  release_state: string;
  mod_creators?: Array<{ creators: { id: string; name: string } | { id: string; name: string }[] | null }>;
};

export default function PublicTeamRoster({
  members,
  modsByCreator,
}: {
  members: PublicTeamMember[];
  modsByCreator: Record<string, PublicTeamMod[]>;
}) {
  const [selectedCreatorId, setSelectedCreatorId] = useState(members[0]?.creator_id ?? "");

  const selectedMember = members.find((member) => member.creator_id === selectedCreatorId) ?? members[0] ?? null;
  const selectedMods = selectedMember ? modsByCreator[selectedMember.creator_id] ?? [] : [];

  return (
    <section className="mx-auto mt-8 w-full max-w-[1450px] px-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.25em] text-purple-400">Team</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Active Members</h2>
        </div>
        {members.length === 0 ? (
          <p className="text-sm text-zinc-500">No active public members are listed.</p>
        ) : (
          <>
            <ul className="flex flex-wrap gap-3" aria-label="Select a team member">
            {members.map((member) => (
              <li key={member.creator_id} className="flex min-w-36 flex-col items-start">
                <button
                  type="button"
                  aria-pressed={selectedMember?.creator_id === member.creator_id}
                  onClick={() => setSelectedCreatorId(member.creator_id)}
                  className={`inline-flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${selectedMember?.creator_id === member.creator_id ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 bg-zinc-900/50 hover:border-purple-500/60"}`}
                >
                  {member.creator_avatar ? <Image src={member.creator_avatar} alt="" width={44} height={44} unoptimized className="h-11 w-11 shrink-0 rounded-full object-cover" /> : <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300">{member.creator_name.slice(0, 1).toUpperCase()}</span>}
                  <span className="min-w-0"><span className="block truncate font-semibold text-white">{member.creator_name}</span><span className="block text-xs capitalize text-zinc-500">{member.public_role}</span></span>
                </button>
                <Link href={`/creator/${member.creator_id}`} className="ml-4 mt-2 text-xs text-purple-300 underline-offset-4 hover:underline">Show profile</Link>
              </li>
            ))}
            </ul>
            {selectedMember && <section className="mt-8 space-y-4" aria-live="polite">
              <h3 className="text-lg font-semibold text-white">Mods by {selectedMember.creator_name}</h3>
              {selectedMods.length > 0 ? <CreatorModsGrid mods={selectedMods} /> : <p className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-8 text-center text-sm text-zinc-400">No mods published by this creator yet.</p>}
            </section>}
          </>
        )}
      </div>
    </section>
  );
}
