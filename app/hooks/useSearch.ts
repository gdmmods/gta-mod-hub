"use client";

import {
  useEffect,
  useState,
} from "react";

import type { ModCardData } from "@/components/mod/ModCard";
import { supabase } from "@/lib/supabase/client";

export default function useSearch(
  query: string
) {

  const [mods, setMods] =
    useState<(ModCardData & { likes: number; downloads: number })[]>([]);

  const [
    creators,
    setCreators,
  ] = useState<{ id: string; name: string; avatar: string | null; owner_type: string | null }[]>([]);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {

    async function runSearch() {

      setLoading(true);

      /* -----------------------------
         MOD SEARCH
      ----------------------------- */

      let modQuery = supabase
        .from("mods")
        .select(`
          id,
          title,
          image,
          description,
          category,
          likes,
          downloads,
          creator,
          mod_creators(creators(id,name))
        `)
        .eq(
          "status",
          "published"
        );

      if (query.trim()) {

        modQuery = modQuery.ilike(
          "title",
          `%${query}%`
        );

      }

      const {
        data: modData,
      } = await modQuery;


      /* -----------------------------
         CREATOR SEARCH
      ----------------------------- */

      let creatorQuery = supabase
        .from("creators")
        .select(`
          id,
          name,
          avatar,
          owner_type
        `);

      if (query.trim()) {

        creatorQuery =
          creatorQuery.ilike(
            "name",
            `%${query}%`
          );

      }

      const {
        data: creatorData,
      } = await creatorQuery;


      /* -----------------------------
         SET RESULTS
      ----------------------------- */

      setMods(
        (modData ?? []).map(mod => ({
          id: mod.id,
          title: mod.title ?? "Untitled",
          image: mod.image ?? "/placeholder.jpg",
          description: mod.description ?? undefined,
          category: mod.category ?? undefined,
          likes: mod.likes ?? 0,
          downloads: mod.downloads ?? 0,
          creator: mod.creator ?? undefined,
          mod_creators: (mod.mod_creators ?? []).flatMap(({ creators }) =>
            (Array.isArray(creators) ? creators : creators ? [creators] : []).map(creator => ({ creators: creator }))
          ),
        }))
      );

      setCreators(
        creatorData || []
      );

      setLoading(false);

    }

    runSearch();

  }, [query]);

  return {

    mods,

    creators,

    loading,

  };

}