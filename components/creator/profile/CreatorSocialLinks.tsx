interface CreatorSocialLinksProps {
  socials: Record<string, string>;
}

export default function CreatorSocialLinks({
  socials,
}: CreatorSocialLinksProps) {

  if (
    !socials ||
    Object.keys(socials).length === 0
  ) {
    return null;
  }

  return (

    <div
      className="
        mt-6
        flex
        flex-wrap
        gap-3
      "
    >

      {socials.website && (

        <a
          href={socials.website}
          target="_blank"
          rel="noopener noreferrer"
          className="
            rounded-2xl
            border
            border-zinc-800
            bg-black/30
            px-4
            py-2
            text-sm
            text-zinc-300
            hover:border-purple-500/30
            hover:text-white
            transition
          "
        >
          🌐 Website
        </a>

      )}

      {socials.discord && (

        <a
          href={socials.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="
            rounded-2xl
            border
            border-zinc-800
            bg-black/30
            px-4
            py-2
            text-sm
            text-zinc-300
            hover:border-purple-500/30
            hover:text-white
            transition
          "
        >
          💬 Discord
        </a>

      )}

      {socials.youtube && (

        <a
          href={socials.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="
            rounded-2xl
            border
            border-zinc-800
            bg-black/30
            px-4
            py-2
            text-sm
            text-zinc-300
            hover:border-purple-500/30
            hover:text-white
            transition
          "
        >
          ▶ YouTube
        </a>

      )}

      {socials.instagram && (

        <a
          href={socials.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="
            rounded-2xl
            border
            border-zinc-800
            bg-black/30
            px-4
            py-2
            text-sm
            text-zinc-300
            hover:border-purple-500/30
            hover:text-white
            transition
          "
        >
          ✕ Instagram
        </a>

      )}

    </div>

  );

}