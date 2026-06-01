"use client";

import Navbar from "@/components/layout/Navbar";
import { useEffect, useState } from "react";

import { supabase }
from "@/lib/supabase/client";

export default function ClaimCreatorPage() {

  const [
    creators,
    setCreators,
  ] = useState<any[]>([]);

  const [
  ownershipMap,
  setOwnershipMap,
] = useState<
  Record<string, boolean>
>({});

  const [
  search,
  setSearch,
] = useState("");

  useEffect(() => {

    async function loadCreators() {

      const {
        data,
        error,
      } = await supabase
        .from("creators")
        .select(`
        id,
        name,
        specialization
        `)
        .order(
          "name",
          {
            ascending: true,
          }
        );

      if (error) {

        console.error(error);
        return;

      }

      setCreators(
        data || []
      );

      const {
  data: memberships,
  error: membershipError,
} = await supabase
  .from("creator_members")
  .select(`
    creator_id,
    role,
    status
  `)
  .eq(
    "status",
    "approved"
  )
  .eq(
    "role",
    "owner"
  );

if (membershipError) {

  console.error(
    membershipError
  );

} else {

  const map:
    Record<
      string,
      boolean
    > = {};

  memberships?.forEach(
    (member: any) => {

      map[
        member.creator_id
      ] = true;

    }
  );

  setOwnershipMap(
    map
  );

}

    }

    loadCreators();

  }, []);

  return (

            <main
            className="
                min-h-screen
                bg-black
                text-white
            "
            >

            <Navbar />

            <div
                className="
                max-w-5xl
                mx-auto
                px-6
                py-20
                "
            >

                <h1
                className="
                    text-5xl
                    font-black
                    mb-4
                "
                >
                Claim Existing Creator
                </h1>

                <p
                className="
                    text-zinc-400
                    text-lg
                "
                >
                Search creator profiles and
                open the profile you want to
                claim.
                </p>

                <div
                    className="
                        mt-10
                        mb-8
                    "
                    >

                    <input
                        type="text"
                        placeholder="
                        Search creator profiles...
                        "
                        value={search}
                        onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                        }
                        className="
                        w-full
                        rounded-2xl
                        border
                        border-zinc-800
                        bg-zinc-900/50
                        px-5
                        py-4
                        text-white
                        placeholder:text-zinc-500
                        focus:outline-none
                        focus:border-purple-500
                        "
                    />

                    </div>

                <div
                    className="
                        mt-12
                        space-y-4
                    "
                    >

        {creators
        .filter((creator) => {

            const query =
                search.toLowerCase();

            const nameMatch =
                creator.name
                ?.toLowerCase()
                .includes(query);

            const specializationMatch =
                Array.isArray(
                creator.specialization
                )
                ? creator.specialization
                    .join(" ")
                    .toLowerCase()
                    .includes(query)
                : false;

            return (
                nameMatch ||
                specializationMatch
            );

            })
        .map(

    (creator) => (

      <div
        key={creator.id}
        className="
          rounded-3xl
          border
          border-zinc-800
          bg-zinc-900/50
          p-6
        "
      >

        <div
            className="
                flex
                items-center
                gap-3
            "
            >

            <h2
                className="
                text-xl
                font-bold
                "
            >
                {creator.name}
            </h2>

            <span
                className={
                    ownershipMap[
                    creator.id
                    ]
                    ? `
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        bg-emerald-500/10
                        border
                        border-emerald-500/20
                        text-emerald-400
                    `
                    : `
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        bg-amber-500/10
                        border
                        border-amber-500/20
                        text-amber-400
                    `
                }
                >
                {
                    ownershipMap[
                    creator.id
                    ]
                    ? "Claimed"
                    : "Unclaimed"
                }
                </span>

            </div>

        <p
  className="
    text-zinc-400
    mt-2
  "
>
  {
    Array.isArray(
      creator.specialization
    ) &&
    creator.specialization.length > 0
      ? creator.specialization.join(
          " • "
        )
      : "No Specializations listed."
  }
</p>

<div
  className="
    mt-5
  "
>

  <a
    href={`/creator/${creator.id}`}
    className="
      inline-flex
      items-center
      rounded-2xl
      bg-purple-600
      hover:bg-purple-500
      transition
      px-4
      py-2
      text-sm
      font-semibold
    "
  >
    Review Profile
  </a>

</div>

      </div>

    )
  )}

</div>

      </div>

    </main>

  );

}