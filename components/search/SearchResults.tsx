"use client";

import ModCard, { type ModCardData } from "@/components/mod/ModCard";
import { useState } from "react";
import Link from "next/link";

type SearchMod = ModCardData & { likes: number; downloads: number };
type SearchCreator = { id: string; name: string; avatar: string | null; owner_type: string | null };

type Props = {
  mods: SearchMod[];
  creators: SearchCreator[];
  active: string;
};

export default function SearchResults({
  mods,
  creators,
  active,
}: Props) {

  const [profileFilter, setProfileFilter] = useState<"all" | "creator" | "team">("all");
  const visibleCreators = creators.filter((creator) => profileFilter === "all"
    || (profileFilter === "team" ? creator.owner_type === "team" : creator.owner_type !== "team"));

  return (

    <div className="space-y-14">

      {/* MODS */}

      {(active === "all" ||
        active === "mods") && (

        <div>

          <h2
            className="
              text-2xl
              font-bold
              mb-6
            "
          >
            Mods
          </h2>

          <div
            className="
              grid
              md:grid-cols-2
              xl:grid-cols-3
              gap-6
            "
          >

            {mods.map((mod) => (

              <ModCard key={mod.id} mod={mod} likes={mod.likes} downloads={mod.downloads} />

            ))}

          </div>

        </div>

      )}

      {/* CREATORS */}

      {(active === "all" ||
        active === "creators") && (

        <div>

          <h2
            className="
              text-2xl
              font-bold
              mb-6
            "
          >
            Creators
          </h2>

          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter profile results">
            {(["all", "creator", "team"] as const).map((filter) => <button
              key={filter}
              type="button"
              aria-pressed={profileFilter === filter}
              onClick={() => setProfileFilter(filter)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${profileFilter === filter ? "border-purple-500/60 bg-purple-500/15 text-purple-200" : "border-zinc-800 text-zinc-400 hover:border-zinc-600"}`}
            >{filter === "all" ? "All profiles" : filter === "team" ? "Teams" : "Creators"}</button>)}
          </div>

          <div
            className="
              grid
              md:grid-cols-2
              xl:grid-cols-3
              gap-6
            "
          >

            {visibleCreators.map((creator) => {

              const isTeam =
                creator.owner_type === "team";

              const label = isTeam ? "TEAM" : "CREATOR";

              const initial =
                creator.name
                  ?.charAt(0)
                  ?.toUpperCase() || "?";

              return (

                <Link
                  key={creator.id}
                  href={`/creator/${creator.id}`}
                  className="
                    p-6
                    rounded-3xl
                    border
                    border-zinc-800
                    bg-zinc-900
                    hover:border-purple-500
                    transition
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-4
                    "
                  >

                    {/* AVATAR */}

                    <div
                      className="
                        w-14
                        h-14
                        shrink-0
                        rounded-full
                        overflow-hidden
                        border
                        border-zinc-700
                        bg-zinc-950
                        flex
                        items-center
                        justify-center
                        text-lg
                        font-semibold
                        text-zinc-400
                      "
                    >

                      {creator.avatar ? (

                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="
                            w-full
                            h-full
                            object-cover
                          "
                          onError={(e) => {
                            e.currentTarget.style.display =
                              "none";

                            e.currentTarget.parentElement
                              ?.classList.add(
                                "avatar-fallback"
                              );
                          }}
                        />

                      ) : (

                        initial

                      )}

                    </div>

                    {/* IDENTITY */}

                    <div>

                      <h3
                        className="
                          text-lg
                          font-semibold
                        "
                      >
                        {creator.name}
                      </h3>

                      <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider ${isTeam ? "border-purple-500/40 bg-purple-500/10 text-purple-200" : "border-zinc-700 bg-zinc-800/80 text-zinc-300"}`}>
                        {label}
                      </span>

                    </div>

                  </div>

                </Link>

              );

            })}

          </div>

        </div>

      )}

    </div>

  );

}
