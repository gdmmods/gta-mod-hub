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

      const {
        data: creator,
        error,
      } = await supabase
        .from("creators")
        .select("owner_id")
        .eq(
          "id",
          creatorId
        )
        .maybeSingle();

      if (
        error ||
        !creator
      ) {

        router.replace(
          "/creators"
        );

        return;

      }

      if (
        creator.owner_id !==
        user.id
      ) {

        router.replace(
          "/creators"
        );

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