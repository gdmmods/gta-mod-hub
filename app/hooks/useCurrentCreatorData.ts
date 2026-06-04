"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase }
from "@/lib/supabase/client";

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
  ] = useState<any>(null);

  const [
    modCount,
    setModCount,
  ] = useState(0);

  useEffect(() => {

    loadData();

  }, [refreshKey]);

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

    setLoading(false);

  }

  return {

    loading,

    creator,

    modCount,

  };

}