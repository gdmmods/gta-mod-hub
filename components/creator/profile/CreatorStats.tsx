interface CreatorStatsProps {
  modsCount: number;
  totalLikes: number;
  totalDownloads: number;
  location?: string | null;
}

export default function CreatorStats({
  modsCount,
  totalLikes,
  totalDownloads,
  location,
}: CreatorStatsProps) {

  const getFlagEmoji = (country?: string | null) => {

    if (!country) return "🌍";

    const flags: Record<string, string> = {
      Luxembourg: "🇱🇺",
      Germany: "🇩🇪",
      France: "🇫🇷",
      Belgium: "🇧🇪",
      Netherlands: "🇳🇱",
      UnitedStates: "🇺🇸",
      USA: "🇺🇸",
      Canada: "🇨🇦",
      UK: "🇬🇧",
      UnitedKingdom: "🇬🇧",
      Japan: "🇯🇵",
    };

    return flags[country.replace(/\s/g, "")] || "🌍";

  };

  const stats = [
    ["Mods", modsCount],
    ["Likes", totalLikes],
    ["Downloads", totalDownloads],
    [
      "Location",
      `${getFlagEmoji(location)} ${location || "Unknown"}`
    ],
  ];

  return (

    <div
      className="
        flex
        flex-wrap
        gap-3
      "
    >

      {stats.map(([label, value]) => (

        <div
          key={String(label)}
          className="
            relative
            overflow-hidden
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950/70
            px-4
            py-3
            backdrop-blur-xl
            min-w-[180px]
          "
        >

          {/* subtle atmosphere */}
          <div
            className="
              absolute
              inset-0
              bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.06),transparent_60%)]
              pointer-events-none
            "
          />

          <div
            className="
              relative
              flex
              items-center
              justify-between
              gap-4
            "
          >

            <p
              className="
                text-[11px]
                uppercase
                tracking-[0.16em]
                text-zinc-500
                whitespace-nowrap
              "
            >
              {label}
            </p>

            <p
              className="
                text-base
                xl:text-lg
                font-bold
                tracking-tight
                text-white
                whitespace-nowrap
              "
            >
              {value}
            </p>

          </div>

        </div>

      ))}

    </div>

  );

}