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

  const [currentMods, setCurrentMods] =
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
         ACCOUNT-WIDE MODS
      ----------------------------- */

      const {
        data: allMods,
      } = await supabase
        .from("mod_creators")
        .select(`
          mod_id,

          mods (
            status,
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

      setMods(
        allMods || []
      );

      /* -----------------------------
         CURRENT CREATOR
      ----------------------------- */

      const {
        data: profile,
      } = await supabase
        .from("profiles")
        .select(`
          default_creator_id
        `)
        .eq(
          "id",
          session.user.id
        )
        .single();

      if (
        profile?.default_creator_id
      ) {

        const {
          data: creatorMods,
        } = await supabase
          .from("mod_creators")
          .select(`
            mod_id,

            mods (
              status,
              id,
              title,
              image,
              created_at
            )
          `)
          .eq(
            "creator_id",
            profile.default_creator_id
          );

        setCurrentMods(
          creatorMods || []
        );

      }

      setLoading(false);

    }

    loadDashboard();

  }, []);

  return {

    loading,

    mods,

    currentMods,

    creatorIds,

  };

}