"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "@/lib/supabase/client";

interface CreatorOwnershipGuardProps {
  creatorId: string;
  children: ReactNode;
}

export default function CreatorOwnershipGuard({
  creatorId,
  children,
}: CreatorOwnershipGuardProps) {

  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    authorized,
    setAuthorized,
  ] = useState(false);

  useEffect(() => {

    async function checkOwnership() {

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {

        router.replace("/login");

        return;

      }

      const { data: creator } = await supabase.from("creators")
        .select("id,owner_id,owner_type,team_id")
        .eq("id", creatorId).maybeSingle();
      if (!creator) {
        router.replace("/creators");
        return;
      }

      let authorized = creator.owner_type === "user" && creator.owner_id === user.id;
      if (creator.owner_type === "team" && creator.team_id) {
        const { data: team } = await supabase.from("teams").select("owner_id").eq("id", creator.team_id).maybeSingle();
        if (team?.owner_id) {
          const [{ data: ownerCreator }, { data: ownership }] = await Promise.all([
            supabase.from("creators").select("id").eq("id", team.owner_id).eq("owner_type", "user").eq("owner_id", user.id).maybeSingle(),
            supabase.from("creator_members").select("id").eq("creator_id", team.owner_id).eq("profile_id", user.id).eq("role", "owner").eq("status", "approved").maybeSingle(),
          ]);
          authorized = Boolean(ownerCreator && ownership);
        }
      }
      if (!authorized) {
        router.replace("/creators");
        return;
      }

      setAuthorized(true);

      setLoading(false);

    }

    checkOwnership();

  }, [
    creatorId,
    router,
  ]);

  if (loading) {

    return (

      <div
        className="
          flex
          items-center
          justify-center
          py-24
        "
      >

        <p
          className="
            text-sm
            text-zinc-400
          "
        >
          Verifying creator access...
        </p>

      </div>

    );

  }

  if (!authorized) {

    return null;

  }

  return <>{children}</>;

}
