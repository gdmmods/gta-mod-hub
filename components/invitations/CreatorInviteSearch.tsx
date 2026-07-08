"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Creator {
  id: string;
  name: string;
  avatar?: string | null;
  verified?: boolean;
  owner_id: string;
}

interface CreatorInviteSearchProps {
  onSelect: (creator: Creator) => void;
}

export default function CreatorInviteSearch({
  onSelect,
}: CreatorInviteSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function searchCreators() {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("creators")
        .select(`
          id,
          name,
          avatar,
          verified,
          owner_id
        `)
        .ilike("name", `%${query}%`)
        .limit(8);

      if (!error && data) {
        setResults(data);
      }

      setLoading(false);
    }

    const timeout = setTimeout(searchCreators, 250);

    return () => clearTimeout(timeout);

  }, [query]);

  return (
    <div className="space-y-4">

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search creators..."
        className="
          w-full
          rounded-xl
          border
          border-zinc-700
          bg-zinc-900
          p-3
        "
      />

      {loading && (
        <p className="text-zinc-500">
          Searching...
        </p>
      )}

      {!loading &&
        results.map((creator) => (

          <button
            key={creator.id}
            onClick={() => onSelect(creator)}
            className="
              w-full
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-zinc-800
              bg-zinc-900
              p-4
              hover:border-purple-500
              transition
            "
          >

            <div className="flex items-center gap-4">

              <div
                className="
                  h-10
                  w-10
                  rounded-full
                  bg-zinc-800
                  overflow-hidden
                "
              >
                {creator.avatar ? (
                    <img
                        src={creator.avatar}
                        alt={creator.name}
                        className="h-full w-full object-cover"
                    />
                    ) : (
                    <div className="h-full w-full bg-zinc-800 rounded-full" />
                    )}
              </div>

              <div className="text-left">

                <p className="font-medium">
                  {creator.name}
                </p>

                {creator.verified && (
                  <p className="text-xs text-purple-400">
                    Verified Creator
                  </p>
                )}

              </div>

            </div>

            <span className="text-sm text-zinc-500">
              Invite →
            </span>

          </button>

        ))}

    </div>
  );
}