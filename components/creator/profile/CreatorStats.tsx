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

  const stats = [
    ["Mods", modsCount],
    ["Likes", totalLikes],
    ["Downloads", totalDownloads],
    ["Location", location || "Unknown"],
  ];

  return (

    <div
      className="
        grid
        grid-cols-2
        md:grid-cols-4
        gap-4
        mt-8
      "
    >

      {stats.map(([label, value]) => (

        <div
          key={String(label)}
          className="
            rounded-3xl
            border
            border-zinc-900
            bg-black/30
            p-6
          "
        >

          <p
            className="
              text-sm
              text-zinc-500
            "
          >
            {label}
          </p>

          <p
            className="
              text-3xl
              font-bold
              mt-2
            "
          >
            {value}
          </p>

        </div>

      ))}

    </div>

  );

}