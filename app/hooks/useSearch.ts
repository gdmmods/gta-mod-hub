"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";

export default function useSearch(
  query: string
) {

  const [mods, setMods] =
    useState<any[]>([]);

  const [
    creators,
    setCreators,
  ] = useState<any[]>([]);

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
          status
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
        modData || []
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