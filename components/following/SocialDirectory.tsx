/* eslint-disable @next/next/no-img-element -- Public avatars can use creator-provided hosts. */
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ModCard, { type ModCardData } from "@/components/mod/ModCard";
import { supabase } from "@/lib/supabase/client";

type Section = "followers" | "creators" | "mods";
const sections: Record<Section, string> = {
  followers: "Followers",
  creators: "Following",
  mods: "Followed Creations",
};
const pageSize = 24;

type Identity = { id: string; name: string; specialization: string[] | null };
type Profile = { href: string; name: string; avatar: string | null; specialization: string[] | null; handle?: string | null };
type Mod = ModCardData & { likes: number | null; downloads: number | null };
type Result = { name: string; items: Profile[] | Mod[] };

export function SocialDirectoryLinks({ base }: { base: string }) {
  return <nav aria-label="Social discovery" className="flex flex-wrap gap-3">
    {(["creators", "mods"] as const).map(section =>
      <Link key={section} href={base + "/following?view=" + section}
        className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-purple-200 hover:border-purple-500">
        {sections[section]}
      </Link>)}
  </nav>;
}

function Avatar({ src }: { src: string | null }) {
  return src ? <img src={src} alt="" className="size-12 shrink-0 rounded-full object-cover" />
    : <span aria-hidden="true" className="size-12 shrink-0 rounded-full bg-zinc-800" />;
}

function Specialization({ values }: { values: Identity["specialization"] }) {
  return values?.length ? <p className="text-sm text-zinc-400">{values.join(" · ")}</p> : null;
}

export default async function SocialDirectory({ creator, username, query }: {
  creator?: string;
  username?: string;
  query: { view?: string | string[]; page?: string | string[] };
}) {
  if (creator && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(creator)) notFound();
  const section = query.view === "mods" || query.view === "creators" ? query.view : "followers";
  const parsedPage = typeof query.page === "string" ? Number(query.page) : 1;
  const page = Number.isSafeInteger(parsedPage) && parsedPage >= 1 && parsedPage <= Math.floor(2147483647 / pageSize) ? parsedPage : 1;
  const base = creator ? "/creator/" + creator : "/profile/" + encodeURIComponent(username ?? "");
  const { data, error } = await supabase.rpc("list_social_directory", {
    p_creator: creator ?? null,
    p_username: username ?? null,
    p_section: section,
    p_offset: (page - 1) * pageSize,
  });
  if (!error && !data) notFound();
  const result = data as Result | null;
  const items = result?.items.slice(0, pageSize) ?? [];
  const tabs: Section[] = ["followers", "creators", "mods"];
  const href = (view: Section, number = 1) => base + "/following?view=" + view + (number > 1 ? "&page=" + number : "");

  return <main className="min-h-screen bg-black text-white">
    <Navbar />
    <div className="mx-auto max-w-6xl space-y-6 px-5 py-12">
      <Link href={base} className="text-sm text-purple-300 hover:underline">{result?.name ?? "Back to profile"}</Link>
      <h1 className="text-3xl font-bold">{sections[section]}</h1>
      {tabs.length > 1 && <nav aria-label="Discovery directory" className="flex flex-wrap gap-3">
        {tabs.map(tab => <Link key={tab} href={href(tab)} aria-current={section === tab ? "page" : undefined}
          className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-purple-200 aria-[current=page]:border-purple-500">{sections[tab]}</Link>)}
      </nav>}
      {error ? <p role="status" className="text-zinc-400">This directory is currently unavailable.</p>
        : !items.length ? <p className="text-zinc-400">{page > 1 ? "No results on this page." : section === "followers" ? "No public followers yet." : section === "mods" ? "No public followed mods yet." : "No followed profiles yet."}</p> : null}
      {section !== "mods" && items.length > 0 && <ul className="grid gap-3 sm:grid-cols-2">
        {(items as Profile[]).map(item => <li key={item.href} className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <Avatar src={item.avatar} />
          <div className="min-w-0 break-words">
            <Link href={item.href} className="font-semibold hover:text-purple-300">{item.name}</Link>
            {item.handle && <p className="text-sm text-zinc-400">@{item.handle}</p>}
            <Specialization values={item.specialization} />
          </div>
        </li>)}
      </ul>}
      {section === "mods" && items.length > 0 && <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(items as Mod[]).map(item => <li key={item.id}>
          <ModCard mod={item} likes={item.likes ?? 0} downloads={item.downloads ?? 0} />
        </li>)}
      </ul>}
      {!error && (page > 1 || (result?.items.length ?? 0) > pageSize) &&
        <nav aria-label="Directory pages" className="flex items-center gap-4 text-sm">
          {page > 1 && <Link href={href(section, page - 1)} className="text-purple-300 hover:underline">Previous</Link>}
          <span className="text-zinc-400">Page {page}</span>
          {(result?.items.length ?? 0) > pageSize && <Link href={href(section, page + 1)} className="text-purple-300 hover:underline">Next</Link>}
        </nav>}
    </div>
  </main>;
}
