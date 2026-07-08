"use client";

import { useState } from "react";
import CreatorInviteSearch from "./CreatorInviteSearch";

interface InviteCreatorDialogProps {
  onInvite: (
    creator: any,
    message: string
  ) => Promise<void>;
}

export default function InviteCreatorDialog({
  onInvite,
}: InviteCreatorDialogProps) {
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    if (!selectedCreator) return;

    try {
      setLoading(true);

      await onInvite(
        selectedCreator,
        message.trim()
      );

      setSelectedCreator(null);
      setMessage("");

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

      <h2 className="text-xl font-bold mb-4">
        Invite Creator
      </h2>

      <CreatorInviteSearch
        onSelect={(creator) => {
          setSelectedCreator(creator);
        }}
      />

      {selectedCreator && (
        <div className="mt-4 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
          <p className="font-medium">
            {selectedCreator.name}
          </p>

          <p className="text-sm text-zinc-400">
            Creator selected
          </p>
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Optional message..."
        className="mt-4 w-full rounded-lg bg-zinc-950 border border-zinc-700 p-3 mb-4"
        rows={4}
      />

      <button
        onClick={handleInvite}
        disabled={loading || !selectedCreator}
        className="rounded-lg bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50"
      >
        {loading
          ? "Sending..."
          : "Send Invitation"}
      </button>

    </div>
  );
}