"use client";

import { useEffect, useState } from "react";
import { getInvitations } from "@/lib/invitations/getInvitations";
import { acceptInvitation } from "@/lib/invitations/acceptInvitation";

interface Props {
  creatorId: string;
}

export default function InvitationInbox({
  creatorId,
}: Props) {

  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadInvitations() {

    setLoading(true);

    const data = await getInvitations({
      creatorId,
      direction: "received",
      status: "pending",
    });

    setInvitations(data);

    setLoading(false);
  }

  useEffect(() => {
    loadInvitations();
  }, []);

  async function handleAccept(id: string) {

    await acceptInvitation({
      invitationId: id,
    });

    await loadInvitations();
  }

  if (loading) {
    return <p>Loading invitations...</p>;
  }

  if (!invitations.length) {
    return <p>No pending invitations.</p>;
  }

  return (
    <div className="space-y-4">

      {invitations.map((invite) => (

        <div
          key={invite.id}
          className="rounded-2xl border border-zinc-800 p-5"
        >

          <h3 className="font-semibold">
            {invite.team?.name}
          </h3>

          <p className="text-sm text-zinc-400">

            Invited by {invite.sender?.name}

          </p>

          {invite.message && (

            <p className="mt-3 text-zinc-300">

              {invite.message}

            </p>

          )}

          <button
            onClick={() => handleAccept(invite.id)}
            className="mt-5 rounded-lg bg-purple-600 px-5 py-2"
          >
            Accept
          </button>

        </div>

      ))}

    </div>
  );
}