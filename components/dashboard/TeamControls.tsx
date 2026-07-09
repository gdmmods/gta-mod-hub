"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

import InviteCreatorDialog from "@/components/invitations/InviteCreatorDialog";
import { createInvitation } from "@/lib/invitations/createInvitation";
import TeamInvitesTab from "@/components/team/TeamInvitesTab";

type Props = {
  creator: any;
};

export default function TeamControls({
  creator,
}: Props) {

  const [
    activeTab,
    setActiveTab,
  ] = useState("members");

  const [
    members,
    setMembers,
  ] = useState<any[]>([]);

  const [
    loadingMembers,
    setLoadingMembers,
  ] = useState(false);

  useEffect(() => {

     setMembers([]);

    async function loadMembers() {

      if (!creator?.team_id) return;

      setLoadingMembers(true);

      const { data, error } = await supabase
        .from("team_members")
        .select(`
          *,
          creators!team_members_creator_id_fkey (
            id,
            name,
            avatar
          )
        `)
        .eq("team_id", creator.team_id)
        .is("left_at", null);

      if (!error && data) {
        setMembers(data);
      }

      setLoadingMembers(false);

    }

    loadMembers();

  }, [creator?.team_id]);

  

async function handleInvite(
  selectedCreator: any,
  message: string
) {
  try {

    await createInvitation({

      senderCreatorId: creator.id,

      recipientCreatorId: selectedCreator.id,

      recipientProfileId:
        selectedCreator.profile_id,

      teamId: creator.team_id,

      teamCreatorId: creator.id,

      message,

    });

    alert("Invitation sent!");

  } catch (err) {

    console.error(err);

    alert("Failed to send invitation.");

  }
}

  return (

    <section
      className="
        rounded-3xl
        border
        border-zinc-800
        bg-zinc-950
        p-8
      "
    >

      <p
        className="
          text-xs
          uppercase
          tracking-[0.3em]
          text-purple-400
          mb-3
        "
      >
        Team Management
      </p>

      <h2
        className="
          text-4xl
          font-bold
          mb-4
        "
      >
        Team Controls
      </h2>

      <p
        className="
          text-zinc-400
          mb-8
        "
      >
        Manage members, invitations and permissions.
      </p>

      <div
        className="
          flex
          gap-3
          mb-8
        "
      >

        {[
          "members",
          "invites",
          "permissions",
        ].map((tab) => (

          <button
            key={tab}
            type="button"
            onClick={() =>
              setActiveTab(tab)
            }
            className={`
              px-6
              py-3
              rounded-xl
              border
              transition

              ${
                activeTab === tab
                  ? "bg-purple-600 border-purple-600"
                  : "border-zinc-800 hover:border-purple-500"
              }
            `}
          >
            {tab.charAt(0).toUpperCase() +
              tab.slice(1)}
          </button>

        ))}

      </div>

     {activeTab === "members" && (

  <div className="space-y-4">

    {loadingMembers ? (

      <p className="text-zinc-500">
        Loading members...
      </p>

    ) : members.length === 0 ? (

      <p className="text-zinc-500">
        No team members found.
      </p>

    ) : (

      members.map((member) => (

        <div
          key={member.id}
          className="
            flex
            items-center
            justify-between
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900/50
            p-4
          "
        >

          <div className="flex items-center gap-4">

            <div
              className="
                h-12
                w-12
                rounded-full
                bg-zinc-800
                overflow-hidden
              "
            >

              {member.creators?.avatar ? (

                <img
                  src={member.creators.avatar}
                  alt={member.creators.name}
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />

              ) : null}

            </div>

            <div>

              <p className="font-medium">
                {member.creators?.name || "Unknown Creator"}
              </p>

              <p className="text-sm text-zinc-500">
                Joined {new Date(member.joined_at).toLocaleDateString()}
              </p>

            </div>

          </div>

          <div className="text-right">

            <p className="capitalize">
              {member.role}
            </p>

            <p className="text-sm text-green-400 capitalize">
              {member.membership_status}
            </p>

          </div>

        </div>

      ))

    )}

  </div>

)}

      {activeTab === "invites" && (

        <TeamInvitesTab
          creator={creator}
      />

      )}

      {activeTab === "permissions" && (

        <div>

          <p className="text-zinc-500">
            Team permissions panel coming next.
          </p>

        </div>

      )}

    </section>

  );

}