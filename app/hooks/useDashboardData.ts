"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function useDashboardData(activeCreatorId: string | null, refreshKey: number) {
  const [loading, setLoading] = useState(true);
  const [mods, setMods] = useState<any[]>([]);
  const [currentMods, setCurrentMods] = useState<any[]>([]);
  const [creatorIds, setCreatorIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setMods([]);
      setCurrentMods([]);
      setCreatorIds([]);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: memberships, error: membershipsError } = await supabase
          .from("creator_members")
          .select("creator_id")
          .eq("profile_id", user.id)
          .eq("status", "approved");
        if (membershipsError) throw membershipsError;

        const ids = [...new Set((memberships ?? []).map((membership) => membership.creator_id))];
        if (cancelled) return;
        setCreatorIds(ids);

        if (ids.length > 0) {
          const { data: allMods, error: modsError } = await supabase
            .from("mod_creators")
            .select(`
              mod_id,
              mods (
                status,
                id,
                title,
                image,
                created_at,
                added_at,
                updated_at
              )
            `)
            .in("creator_id", ids);
          if (modsError) throw modsError;
          if (cancelled) return;
          setMods(allMods ?? []);
        }

        if (activeCreatorId && ids.includes(activeCreatorId)) {
          const { data: creatorMods, error: creatorModsError } = await supabase
            .from("mod_creators")
            .select(`
              mod_id,
              mods (
                status,
                id,
                title,
                image,
                created_at,
                added_at,
                updated_at
              )
            `)
            .eq("creator_id", activeCreatorId);
          if (creatorModsError) throw creatorModsError;
          if (cancelled) return;
          setCurrentMods(creatorMods ?? []);
        }
      } catch (cause) {
        console.error("Could not load dashboard data:", cause);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();
    return () => { cancelled = true; };
  }, [activeCreatorId, refreshKey]);

  return { loading, mods, currentMods, creatorIds };
}
