"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";

type Props = {

  onCreatorChanged: () => void;

};

export default function
DashboardCreatorManager({

  onCreatorChanged,

}: Props){

  const [
    creator,
    setCreator,
  ] = useState<any>(null);

  const [
    creators,
    setCreators,
  ] = useState<any[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    showSwitcher,
    setShowSwitcher,
  ] = useState(false);

  useEffect(() => {

    loadCreatorData();

  }, []);

  async function loadCreatorData() {

    try {

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {

        setLoading(false);
        return;

      }

      const {
        data: profile,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          default_creator_id
        `)
        .eq(
          "id",
          user.id
        )
        .single();

      if (!profile) {

        setLoading(false);
        return;

      }

      const {
        data: memberships,
      } = await supabase
        .from("creator_members")
        .select(`
          creator_id,
          creators (
            id,
            name,
            specialization
          )
        `)
        .eq(
          "profile_id",
          profile.id
        )
        .eq(
          "status",
          "approved"
        );

      const ownedCreators =
        memberships || [];

      setCreators(
        ownedCreators
      );

      let creatorId =
        profile.default_creator_id;

      if (
        !creatorId &&
        ownedCreators.length > 0
      ) {

        creatorId =
          ownedCreators[0].creator_id;

        await supabase
          .from("profiles")
          .update({
            default_creator_id:
              creatorId,
          })
          .eq(
            "id",
            profile.id
          );

      }

      if (!creatorId) {

        setLoading(false);
        return;

      }

      const selectedCreator =
        ownedCreators.find(
          (m: any) =>
            m.creator_id ===
            creatorId
        );

      setCreator(
        selectedCreator?.creators ||
        null
      );

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  }

  async function setDefaultCreator(
  creatorId: string
) {

  const {
    data: {
      user,
    },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("profiles")
    .update({
      default_creator_id:
        creatorId,
    })
    .eq(
      "id",
      user.id
    );

  onCreatorChanged();

  await loadCreatorData();

  setShowSwitcher(false);

}

  return (

    <div
      className="
        mb-8
        rounded-3xl
        border
        border-zinc-800
        bg-zinc-900/60
        backdrop-blur-xl
        p-6
      "
    >

      <p
        className="
          text-[10px]
          uppercase
          tracking-[0.22em]
          text-purple-400
        "
      >
        Creator Management
      </p>

      <h2
        className="
          mt-2
          text-2xl
          font-bold
        "
      >
        Current Creator
      </h2>

      {loading ? (

        <p
          className="
            mt-4
            text-zinc-500
          "
        >
          Loading creator...
        </p>

      ) : creator ? (

        <>

          <div className="mt-4">

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <h3
                className="
                  text-xl
                  font-semibold
                "
              >
                {creator.name}
              </h3>

              <span
                className="
                  px-3
                  py-1
                  rounded-full
                  text-xs
                  bg-purple-500/10
                  border
                  border-purple-500/20
                  text-purple-400
                "
              >
                Default
              </span>

            </div>

            <p
              className="
                mt-2
                text-zinc-500
              "
            >
              {Array.isArray(
                creator.specialization
              )
                ? creator.specialization.join(
                    " • "
                  )
                : "Creator Profile"}
            </p>

          </div>

          {showSwitcher && (

            <div
              className="
                mt-6
                rounded-2xl
                border
                border-zinc-800
                bg-black/40
                p-4
                space-y-2
              "
            >

              {creators.map(
                (member: any) => {

                  const c =
                    member.creators;

                  const isCurrent =
                    c.id ===
                    creator.id;

                  return (

                    <button
                      key={c.id}
                      onClick={() =>
                        setDefaultCreator(
                          c.id
                        )
                      }
                      className="
                        w-full
                        flex
                        items-center
                        justify-between
                        rounded-xl
                        px-4
                        py-3
                        hover:bg-zinc-800
                        transition
                      "
                    >

                      <span>
                        {c.name}
                      </span>

                      {isCurrent && (

                        <span
                          className="
                            text-xs
                            text-purple-400
                          "
                        >
                          Default
                        </span>

                      )}

                    </button>

                  );

                }
              )}

            </div>

          )}

          <div
            className="
              mt-6
              flex
              flex-wrap
              gap-3
            "
          >

            <button
              onClick={() =>
                setShowSwitcher(
                  !showSwitcher
                )
              }
              className="
                rounded-2xl
                border
                border-zinc-700
                px-5
                py-3
              "
            >
              Switch Creator
            </button>

            <Link
              href={`/dashboard/creator/${creator.id}/settings`}
              className="
                rounded-2xl
                bg-purple-600
                px-5
                py-3
                font-semibold
              "
            >
              Edit Creator
            </Link>

            <Link
              href={`/creator/${creator.id}`}
              className="
                rounded-2xl
                border
                border-zinc-700
                px-5
                py-3
              "
            >
              View Creator
            </Link>

            <Link
              href="/become-creator"
              className="
                rounded-2xl
                border
                border-zinc-700
                px-5
                py-3
              "
            >
              Create Creator
            </Link>

            <Link
              href="/claim-creator"
              className="
                rounded-2xl
                border
                border-zinc-700
                px-5
                py-3
              "
            >
              Claim Creator
            </Link>

          </div>

        </>

      ) : (

        <div
          className="
            mt-6
            flex
            gap-3
          "
        >

          <Link
            href="/become-creator"
            className="
              rounded-2xl
              bg-purple-600
              px-5
              py-3
              font-semibold
            "
          >
            Create Creator
          </Link>

          <Link
            href="/claim-creator"
            className="
              rounded-2xl
              border
              border-zinc-700
              px-5
              py-3
            "
          >
            Claim Creator
          </Link>

        </div>

      )}

    </div>

  );

}