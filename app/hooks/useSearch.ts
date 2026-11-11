"use client";

import { useEffect, useState } from "react";
import type { ModCardData } from "@/components/mod/ModCard";
import { supabase } from "@/lib/supabase/client";

import { collectPeoplePage, searchPageSize, type PeopleFilter, type SupportedSearchCategory } from "@/lib/search/navigation";

export type SearchPerson = {
  id: string; kind: "creator" | "user"; identity_type: "creator" | "user" | "team";
  name: string; avatar: string | null; handle: string | null; href: string;
  tags: string[]; skills: string | null; interests: string | null; looking_for: string | null;
  availability: "open" | "selective" | "unavailable" | null;
};
export type SearchContribution = {
  id: string; target_id: string; mod_title: string; excerpt: string; author_name: string;
  author_href: string | null; recognized_by: string | null;
};
export type SearchMod = ModCardData & { likes: number; downloads: number };
export type SearchData = { people: SearchPerson[]; creations: SearchMod[]; contributions: SearchContribution[] };
export default function useSearch(query: string, category: SupportedSearchCategory | null, page: number, people: PeopleFilter) {
  const term = query.trim();
  const key = JSON.stringify([term, category, page, people]);
  const [response, setResponse] = useState<{ key: string; data: SearchData | null; error: boolean } | null>(null);
  useEffect(() => {
    if (category === null) return;
    const controller = new AbortController();
    async function read(offset: number) {
      const { data, error } = await supabase.rpc("creative_discovery_search", {
        p_query: term, p_category: category, p_offset: offset,
      }).abortSignal(controller.signal);
      if (error || controller.signal.aborted) throw error ?? new Error("Search canceled");
      return data;
    }

    const timer = setTimeout(async () => {
      try {
        const groups: SearchData = { people: [], creations: [], contributions: [] };
        if (category === "people" && people !== "all") {
          groups.people = await collectPeoplePage<SearchPerson>(async offset => (await read(offset)).items, people, page);
        } else {
          const data = await read(page * searchPageSize);
          if (category === "all") Object.assign(groups, data);
          else groups[category] = data.items;
        }
        if (!controller.signal.aborted) setResponse({ key, data: groups, error: false });
      } catch {
        if (!controller.signal.aborted) setResponse({ key, data: null, error: true });
      }
    }, term ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, term, category, page, people]);
  return response?.key === key ? response : null;
}
