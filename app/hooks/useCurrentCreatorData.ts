"use client";

import { useEffect, useState } from "react";
import type { CreatorOption } from "@/app/contexts/CreatorContext";
import { supabase } from "@/lib/supabase/client";

export default function useCurrentCreatorData(activeCreator: CreatorOption | null, refreshKey: number) {
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<CreatorOption | null>(null);
  const [modCount, setModCount] = useState(0);
  const [hasConnectedPlatform, setHasConnectedPlatform] = useState(false);
  const [isTeamOwner, setIsTeamOwner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setCreator(activeCreator);
    setModCount(0);
    setHasConnectedPlatform(false);
    setIsTeamOwner(false);

    async function loadData() {
      try {
        if (!activeCreator) return;

        const [{ count }, { count: connectedPlatformCount }] = await Promise.all([
          supabase
            .from("mod_creators")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", activeCreator.id),
          supabase
            .from("external_identities")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", activeCreator.id),
        ]);

        if (cancelled) return;
        setModCount(count ?? 0);
        setHasConnectedPlatform((connectedPlatformCount ?? 0) > 0);

        if (activeCreator.owner_type === "team" && activeCreator.team_id) {
          const ownerCheck = await fetch(
            `/api/team-memberships?teamId=${encodeURIComponent(activeCreator.team_id)}`,
            { cache: "no-store" }
          );
          if (!cancelled) setIsTeamOwner(ownerCheck.ok);
        }
      } catch (cause) {
        console.error("Could not load Active Creator data:", cause);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();
    return () => { cancelled = true; };
  }, [activeCreator, refreshKey]);

  return { loading, creator, modCount, hasConnectedPlatform, isTeamOwner };
}
