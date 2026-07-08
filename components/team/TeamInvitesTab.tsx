"use client";

import { useEffect, useState } from "react";

import InviteCreatorDialog from "@/components/invitations/InviteCreatorDialog";

import { createInvitation } from "@/lib/invitations/createInvitation";
import { getInvitations } from "@/lib/invitations/getInvitations";

interface Props {
  creator: any;
}

export default function TeamInvitesTab({
  creator,
}: Props) {

  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadInvitations() {

    try {

      setLoading(true);

      const data = await getInvitations({
        creatorId: creator.id,
      });

      setInvitations(data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {

    loadInvitations();

  }, []);

  async function handleInvite(
    selectedCreator: any,
    message: string
  ) {

    try {

      await createInvitation({

        senderCreatorId: creator.id,

        recipientCreatorId:
          selectedCreator.id,

        recipientProfileId:
            selectedCreator.owner_id,

        teamId: creator.team_id,

        teamCreatorId: creator.id,

        message,

      });

      await loadInvitations();

    } catch (err) {

      console.error(err);

    }

  }

  return (

    <div className="space-y-10">

      <InviteCreatorDialog
        onInvite={handleInvite}
      />

      <div>

        <h3 className="text-xl font-bold mb-4">
          Pending Invitations
        </h3>

        {loading ? (

          <p className="text-zinc-500">
            Loading...
          </p>

        ) : invitations.length === 0 ? (

          <p className="text-zinc-500">
            No pending invitations.
          </p>

        ) : (

          <div className="space-y-4">

            {invitations.map((invite) => (

              <div
                key={invite.id}
                className="
                  rounded-xl
                  border
                  border-zinc-800
                  bg-zinc-900
                  p-5
                "
              >

                <p className="font-semibold">

                  {invite.recipient?.name}

                </p>

                <p className="text-sm text-zinc-500 mt-2">

                  {invite.status}

                </p>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>

  );

}