"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";

export default function useDashboardData() {

  const [loading, setLoading] =
    useState(true);

  const [mods, setMods] =
    useState<any[]>([]);

  const [creatorIds, setCreatorIds] =
    useState<string[]>([]);

  useEffect(() => {

    async function loadDashboard() {

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session) {

        setLoading(false);

        return;

      }

      /* -----------------------------
         CREATOR MEMBERSHIPS
      ----------------------------- */

      const {
        data: memberships,
      } = await supabase
        .from("creator_members")
        .select(`
          creator_id
        `)
        .eq(
          "profile_id",
          session.user.id
        )
        .eq(
          "status",
          "approved"
        );

      const ids =
        memberships?.map(
          (m: any) =>
            m.creator_id
        ) || [];

      setCreatorIds(ids);

      /* -----------------------------
         MODS
      ----------------------------- */

      const {
        data,
      } = await supabase
        .from("mod_creators")
        .select(`
          mod_id,

          mods (
            id,
            title,
            image,
            created_at
          )
        `)
        .in(
          "creator_id",
          ids
        );

      setMods(data || []);

      setLoading(false);

    }

    loadDashboard();

  }, []);

  return {

    loading,

    mods,

    creatorIds,

  };

}