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

  const links = [
    {
      key: "website",
      label: "Website",
      icon: "🌐",
      href: socials.website,
    },
    {
      key: "discord",
      label: "Discord",
      icon: "💬",
      href: socials.discord,
    },
    {
      key: "youtube",
      label: "YouTube",
      icon: "▶",
      href: socials.youtube,
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: "✕",
      href: socials.instagram,
    },
  ].filter((item) => item.href);

  return (

    <div
      className="
        flex
        flex-wrap
        items-center
        gap-3
      "
    >

      {links.map((link) => (

        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="
            group
            relative
            overflow-hidden
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950/70
            px-4
            py-2.5
            text-sm
            text-zinc-300
            transition
            hover:border-purple-500/30
            hover:text-white
            backdrop-blur-xl
          "
        >

          {/* subtle atmosphere */}
          <div
            className="
              absolute
              inset-0
              opacity-0
              group-hover:opacity-100
              transition
              bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.10),transparent_65%)]
            "
          />

          <div
            className="
              relative
              flex
              items-center
              gap-2
            "
          >

            <span className="text-base">
              {link.icon}
            </span>

            <span className="font-medium">
              {link.label}
            </span>

          </div>

        </a>

      ))}

    </div>

  );

}