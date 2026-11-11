"use client";

import { useEffect, useState } from "react";
import { useCreatorContext } from "@/app/contexts/CreatorContext";
import { supabase } from "@/lib/supabase/client";

import { filterOperationalCreators } from '@/lib/team/operational-creators';

export default function useUploadCreators() {
  const { creators: approvedCreators, activeCreatorId, loading } = useCreatorContext();
  const [allCreators, setAllCreators] = useState<any[]>([]);
  const [selectedCreator, setSelectedCreator] = useState("");

  useEffect(() => {
    if (loading) return;
    setSelectedCreator((current) =>
      approvedCreators.some((creator) => creator.id === current) ? current : activeCreatorId ?? ""
    );
  }, [activeCreatorId, approvedCreators, loading]);

  useEffect(() => {
    let cancelled = false;
    async function loadAllCreators() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase.from("creators").select("id,name,owner_type,team_id").order("name", { ascending: true });
      if (cancelled) return;
      if (error) console.error("CREATOR SEARCH LOAD ERROR:", error);
      setAllCreators(error ? [] : await filterOperationalCreators(supabase, data ?? []));
    }
    void loadAllCreators();
    return () => { cancelled = true; };
  }, []);

  return {
    creators: approvedCreators.map(({ id, name }) => ({ id, name })),
    allCreators,
    selectedCreator,
    setSelectedCreator,
    activeCreatorId,
  };
}
