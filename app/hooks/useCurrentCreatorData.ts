"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase }
from "@/lib/supabase/client";

type CreatorSummary = { id: string; name: string; owner_type: string | null; team_id: string | null };

export default function useCurrentCreatorData(
  refreshKey: number
) {

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    creator,
    setCreator,
  ] = useState<CreatorSummary | null>(null);
  const [isTeamOwner, setIsTeamOwner] = useState(false);

  const [
    modCount,
    setModCount,
  ] = useState(0);

  const [
  hasConnectedPlatform,
  setHasConnectedPlatform,
] = useState(false);

  async function loadData() {

    const {
      data: {
        user,
      },
    } =
      await supabase.auth.getUser();

    if (!user) {

      setLoading(false);
      return;

    }

    const {
      data: profile,
    } = await supabase
      .from("profiles")
      .select(`
        default_creator_id
      `)
      .eq(
        "id",
        user.id
      )
      .single();

    if (
      !profile?.default_creator_id
    ) {

      setLoading(false);
      return;

    }

    const {
      data: creator,
    } = await supabase
      .from("creators")
      .select(`
            id,
            name,
            owner_type,
            team_id
          `)
      .eq(
        "id",
        profile.default_creator_id
      )
      .single();

    setCreator(
      creator
    );

    setIsTeamOwner(false);
    if (creator?.owner_type === "team" && creator.team_id) {
      const ownerCheck = await fetch(`/api/team-memberships?teamId=${encodeURIComponent(creator.team_id)}`, { cache: "no-store" });
      setIsTeamOwner(ownerCheck.ok);
    }

    const {
      count,
    } = await supabase
      .from("mod_creators")
      .select(
        "*",
        {
          count: "exact",
          head: true,
        }
      )
      .eq(
        "creator_id",
        profile.default_creator_id
      );

    setModCount(
      count || 0
    );

    const {
      count: connectedPlatformCount,
    } = await supabase
      .from("external_identities")
      .select(
        "*",
        {
          count: "exact",
          head: true,
        }
      )
      .eq(
        "creator_id",
        profile.default_creator_id
      );

    setHasConnectedPlatform(
      (connectedPlatformCount || 0) > 0
    );

    setLoading(false);

  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshKey]);

  return {

  loading,

  creator,
  isTeamOwner,

  modCount,

  hasConnectedPlatform,

};

}
