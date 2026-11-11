/* eslint-disable @next/next/no-img-element -- Public avatars can use creator-provided hosts. */
import Link from "next/link";
import ModCard from "@/components/mod/ModCard";
import FollowButton from "@/components/following/FollowButton";
import { collaborationAvailability } from "@/components/profile/CollaborationEditor";
import { discussionHref } from "@/lib/discussions/types";
import type { SearchData, SearchPerson } from "@/app/hooks/useSearch";
import { searchCategories, searchPageSize, type SupportedSearchCategory } from "@/lib/search/navigation";

const kinds = { user: "User", creator: "Creator", team: "Team" };
const gridClass = "grid gap-6 md:grid-cols-2 xl:grid-cols-3";
const cardClass = "min-w-0 space-y-3 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 [overflow-wrap:anywhere]";

function PersonCard({ person }: { person: SearchPerson }) {
  return <article className={cardClass}>
    <div className="flex items-center gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
        {person.avatar ? <img src={person.avatar} alt="" className="size-full object-cover" /> : person.name[0].toUpperCase()}
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold"><Link href={person.href} className="hover:text-purple-300">{person.name}</Link></h3>
        {person.handle && <p className="text-sm text-purple-300">@{person.handle}</p>}
        <p className="text-xs text-zinc-400">{kinds[person.identity_type]}</p>
      </div>
    </div>
    {person.tags.length > 0 && <p className="text-sm text-zinc-400">{person.tags.join(" · ")}</p>}
    {person.skills && <p className="text-sm text-zinc-300">Skills · {person.skills}</p>}
    {person.interests && <p className="text-sm text-zinc-300">Creative interests · {person.interests}</p>}
    {person.looking_for && <p className="text-sm text-zinc-300">Looking for · {person.looking_for}</p>}
    {person.availability && <p className="text-sm text-purple-200">{collaborationAvailability[person.availability]}</p>}
    <FollowButton kind={person.kind} id={person.id}
      className="inline-block rounded-xl border border-purple-500/40 px-3 py-2 text-sm text-purple-200 hover:border-purple-400 disabled:opacity-50" />
  </article>;
}

export default function SearchResults({ data, active, setActive }: {
  data: SearchData; active: SupportedSearchCategory; setActive: (category: SupportedSearchCategory) => void;
}) {
  const limit = active === "all" ? 6 : searchPageSize;
  const groups = (["people", "creations", "contributions"] as const).filter(group =>
    active === "all" ? data[group].length > 0 : active === group);
  if (!groups.some(group => data[group].length)) return <p role="status" className="text-zinc-400">No matching results.</p>;
  return <div className="space-y-12">
    {groups.map(group => <section key={group}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{searchCategories[group]}</h2>
        {active === "all" && data[group].length > limit && <button type="button" onClick={() => setActive(group)}
          className="text-sm text-purple-300 hover:underline">View all {searchCategories[group].toLowerCase()}</button>}
      </div>
      <div className={gridClass}>
        {group === "people" && data.people.slice(0, limit).map(person => <PersonCard key={person.kind + person.id} person={person} />)}
        {group === "creations" && data.creations.slice(0, limit).map(mod => <ModCard key={mod.id}
          mod={{ ...mod, title: mod.title ?? "Untitled", image: mod.image ?? "/placeholder.jpg" }}
          likes={mod.likes ?? 0} downloads={mod.downloads ?? 0} />)}
        {group === "contributions" && data.contributions.slice(0, limit).map(item => <article key={item.id} className={cardClass}>
          <h3 className="font-semibold"><Link href={discussionHref(item)} className="hover:text-purple-300">{item.mod_title}</Link></h3>
          <p className="text-sm text-zinc-400">{item.author_href
            ? <Link href={item.author_href} className="hover:text-purple-300">{item.author_name}</Link> : item.author_name}</p>
          <p className="text-sm leading-relaxed text-zinc-200">{item.excerpt}</p>
          {item.recognized_by && <p className="text-xs text-purple-300">Recognized by {item.recognized_by}</p>}
          <Link href={discussionHref(item)} className="text-sm text-purple-300 hover:underline">View contribution</Link>
        </article>)}
      </div>
    </section>)}
  </div>;
}
