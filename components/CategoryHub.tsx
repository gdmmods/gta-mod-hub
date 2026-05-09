import Link from "next/link";

const categories = [
  {
    name: "Vehicles",
    slug: "vehicles",
    icon: "🚗",
    description: "Cars, bikes, emergency vehicles and more",
  },
  {
    name: "Scripts",
    slug: "scripts",
    icon: "💻",
    description: "Gameplay systems and server logic",
  },
  {
    name: "Maps",
    slug: "maps",
    icon: "🗺️",
    description: "Custom environments and locations",
  },
  {
    name: "Weapons",
    slug: "weapons",
    icon: "🔫",
    description: "Weapon packs and replacements",
  },
  {
    name: "Player",
    slug: "player",
    icon: "🧍",
    description: "Character customization and peds",
  },
  {
    name: "FiveM",
    slug: "fivem",
    icon: "🌐",
    description: "FiveM ready resources and content",
  },
  {
    name: "Tools",
    slug: "tools",
    icon: "🛠️",
    description: "Utilities and development tools",
  },
  {
    name: "Misc",
    slug: "misc",
    icon: "📦",
    description: "Other mods and experimental content",
  },
];

export default function CategoryHub() {
  return (
    <section className="max-w-6xl mx-auto px-6 mt-14">

      <div className="mb-4">

        <p className="text-purple-400 text-sm tracking-[0.2em] uppercase">
          Browse Categories
        </p>

        <h2 className="text-3xl font-bold mt-2">
          Explore the ecosystem
        </h2>

      </div>

      <div
        className="
          grid
          grid-cols-2
            md:grid-cols-4
            xl:grid-cols-8
            gap-4
        "
      >

        {categories.map((category) => (

          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="
              group
              rounded-3xl
              border
              border-zinc-800
              bg-gradient-to-br
              from-zinc-900
              to-black
              p-3
              hover:border-purple-500/40
              hover:-translate-y-1
              hover:shadow-[0_0_30px_rgba(168,85,247,0.12)]
              transition-all
              duration-300
              min-h-[170px]
            "
          >

            <div className="text-2xl">
              {category.icon}
            </div>

            <h3
              className="
                text-base
                font-semibold
                mt-4
                group-hover:text-purple-300
                transition
              "
            >
              {category.name}
            </h3>

            <p className="text-zinc-500 text-xs mt-2">
              {category.description}
            </p>

          </Link>

        ))}

      </div>

    </section>
  );
}