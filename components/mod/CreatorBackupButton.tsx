"use client";

import { parseCreatorBackupUrl } from "@/lib/server/creatorBackupUrl";
import { buildOutboundClickUrl } from "@/lib/server/click-analytics";

interface Props {
  url?: string | null;
  modId: string;
}

export default function CreatorBackupButton({ url, modId }: Props) {
  const parsed = parseCreatorBackupUrl(url);
  const className = `w-full flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-medium transition ${
    parsed.valid && parsed.url
      ? "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white"
      : "cursor-not-allowed border-zinc-900 bg-zinc-950 text-zinc-600"
  }`;

  if (!parsed.valid || !parsed.url) {
    return (
      <button type="button" disabled aria-disabled="true" className={className}>
        <span className="text-zinc-600" aria-hidden="true">↗</span>
        Creator Backup
      </button>
    );
  }

  return (
    <a
      href={parsed.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        event.preventDefault();
        window.open(buildOutboundClickUrl({
          origin: window.location.origin,
          modId,
          action: "creator_backup",
          targetUrl: parsed.url!,
          eventId: window.crypto.randomUUID(),
        }), "_blank", "noopener,noreferrer");
      }}
      className={className}
    >
      <span className="text-purple-400" aria-hidden="true">↗</span>
      Creator Backup
    </a>
  );
}
