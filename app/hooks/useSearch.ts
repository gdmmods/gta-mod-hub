"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase }
from "@/lib/supabase/client";

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

      const {
        data: modData,
      } = await supabase
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
        )
        query.trim()
  ? supabase
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
      )
      .ilike(
        "title",
        `%${query}%`
      )
  : supabase
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

      /* -----------------------------
         CREATOR SEARCH
      ----------------------------- */

      const {
        data: creatorData,
      } = await supabase
        .from("creators")
        .select(`
          id,
          name
        `)
        query.trim()
  ? supabase
      .from("creators")
      .select(`
        id,
        name,
        avatar
      `)
      .ilike(
        "name",
        `%${query}%`
      )
  : supabase
      .from("creators")
      .select(`
        id,
        name,
        avatar
      `);

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