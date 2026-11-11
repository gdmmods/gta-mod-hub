import Link from "next/link";

export type RelationshipCounts = {
  followers?: number;
  following?: number;
  followedCreations?: number;
};

const stats = [
  { key: "followers", label: "Followers", view: "followers" },
  { key: "following", label: "Following", view: "creators" },
  { key: "followedCreations", label: "Followed Creations", view: "mods" },
] as const;

export default function RelationshipStats({ base, counts, showFollowers = true }: { base: string; counts: RelationshipCounts; showFollowers?: boolean }) {
  return <nav aria-label="Profile relationships" className="flex flex-wrap gap-x-5 gap-y-2 sm:gap-x-7">
    {stats.filter(stat => showFollowers || stat.key !== "followers").map(({ key, label, view }) => {
      const count = counts[key];
      return <Link key={key} href={base + "/following?view=" + view}
        className="group inline-flex min-w-0 flex-wrap items-baseline gap-x-1.5 rounded text-sm text-zinc-300 transition hover:text-purple-300 focus-visible:outline-purple-400">
        {typeof count === "number" && <strong className="font-semibold tabular-nums text-white group-hover:text-purple-300">
          {count.toLocaleString("en-US")}
        </strong>}
        <span>{label}</span>
      </Link>;
    })}
  </nav>;
}
