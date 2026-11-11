import Link from "next/link";
import { Award } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { discussionHref, type PublicIdentity } from "@/lib/discussions/types";

type Contribution = { id: string; target_id: string; modTitle: string; excerpt: string; creatorName: string };
type Summary = { count: number; creators: number; recent: Contribution[] };

export default async function CommunityContributions({ identity, className = "", publishedMods, showModsLink = true }: {
  identity: PublicIdentity;
  className?: string;
  publishedMods?: number;
  showModsLink?: boolean;
}) {
  const { data, error } = await supabase.rpc("community_contributions", { p_kind: identity.type, p_identity: identity.id });
  const summary = error ? null : data as Summary | null;
  const showPublishing = publishedMods !== undefined;
  if (!summary && !showPublishing) return null;
  const title = showPublishing ? "Creative & Community Contributions" : "Community Contributions";

  return <div className={className}><section
    className={`min-w-0 rounded-[30px] border border-zinc-800 bg-zinc-950/75 p-5 ${showPublishing ? "sm:p-6" : "sm:p-8"}`}
    aria-label={title}>
    <h2 className="flex items-center gap-2 text-xl font-semibold"><Award size={21} className="shrink-0 text-purple-400" aria-hidden="true" /> {title}</h2>
    {showPublishing ? <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
      <li>{publishedMods > 0 && showModsLink ? <Link href="#published-mods" className="text-purple-200 hover:underline">{publishedMods} Published Mods</Link> : `${publishedMods} Published Mods`}</li>
      {summary && <>
        <li>{summary.count} Recognized Feedback</li>
        <li>{summary.creators} Creators Helped</li>
      </>}
    </ul> : summary && <p className="mt-2 text-sm text-zinc-400">
      {summary.count} recognized {summary.count === 1 ? "contribution" : "contributions"} · {summary.creators} {summary.creators === 1 ? "creator" : "creators"}
    </p>}
    {!summary && <p className="mt-3 text-sm text-zinc-500">Recognition history is currently unavailable.</p>}
    {!showPublishing && summary?.recent.length === 0 && <p className="mt-3 text-sm text-zinc-500">No recognized contributions yet.</p>}
    {!!summary?.recent.length && <ul className="mt-4 space-y-3">
      {summary.recent.map(item => <li key={item.id} className="rounded-2xl border border-zinc-800 p-4 [overflow-wrap:anywhere]">
        <Link href={discussionHref(item)} className="font-medium text-purple-200 hover:underline">{item.modTitle}</Link>
        <p className="mt-1 text-sm text-zinc-300">{item.excerpt}</p>
        <p className="mt-2 text-xs text-zinc-400">Recognized by {item.creatorName}</p>
      </li>)}
    </ul>}
  </section></div>;
}
