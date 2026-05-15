"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";

export default function useUploadCreators() {

  const [creators, setCreators] =
    useState<any[]>([]);

  const [
    allCreators,
    setAllCreators,
  ] = useState<any[]>([]);

  const [
    selectedCreator,
    setSelectedCreator,
  ] = useState("");

  useEffect(() => {

    async function loadCreators() {

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session)
        return;

      /* -----------------------------
         OWNED CREATOR MEMBERSHIPS
      ----------------------------- */

      const {
        data: memberships,
        error,
      } = await supabase
        .from(
          "creator_members"
        )
        .select(`
          creator_id,
          role,
          status,
          creators (
            id,
            name
          )
        `)
        .eq(
          "profile_id",
          session.user.id
        )
        .eq(
          "status",
          "approved"
        );

      if (error) {

        console.error(
          "CREATOR LOAD ERROR:",
          error
        );

        return;

      }

      const mapped =
        memberships?.map(
          (m: any) => ({
            id:
              m.creators.id,
            name:
              m.creators.name,
          })
        ) || [];

      setCreators(mapped);

      if (
        mapped.length > 0
      ) {

        setSelectedCreator(
          mapped[0].id
        );

      }

      /* -----------------------------
         ALL CREATORS
      ----------------------------- */

      const {
        data: creatorData,
        error: creatorError,
      } = await supabase
        .from("creators")
        .select(`
          id,
          name
        `)
        .order(
          "name",
          {
            ascending: true,
          }
        );

      if (creatorError) {

        console.error(
          creatorError
        );

      } else {

        setAllCreators(
          creatorData || []
        );

      }

    }

    loadCreators();

  }, []);

  return {

    creators,
    allCreators,

    selectedCreator,
    setSelectedCreator,

  };

}