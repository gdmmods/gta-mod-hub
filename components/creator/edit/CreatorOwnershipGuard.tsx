"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";

interface CreatorOwnershipGuardProps {
  creatorId: string;
  children: ReactNode;
}

export default function CreatorOwnershipGuard({
  creatorId,
  children,
}: CreatorOwnershipGuardProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkOwnership() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("creator_members")
        .select("*")
        .eq("creator_id", creatorId)
        .eq("profile_id", user.id)
        .single();

      if (error || !data) {
        router.replace("/creators");
        return;
      }

      setAuthorized(true);
      setLoading(false);
    }

    checkOwnership();
  }, [creatorId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-zinc-400">
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