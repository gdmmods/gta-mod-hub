// components/roadmap/Pillars.tsx

import Image from "next/image";

const pillars = [
  {
    title: "Creator First",
    text: "Empowering creators and giving them the tools to succeed.",
    icon: "/images/pillars/creator-first.png",
  },
  {
    title: "Quality & Trust",
    text: "Curated content, verified systems and community trust.",
    icon: "/images/pillars/quality-trust.png",
  },
  {
    title: "Discovery",
    text: "Smart discovery that helps users find the best mods.",
    icon: "/images/pillars/discovery.png",
  },
  {
    title: "Innovation",
    text: "Using technology and AI to build the future of modding.",
    icon: "/images/pillars/innovation.png",
  },
  {
    title: "Community",
    text: "Built with the community, for the community.",
    icon: "/images/pillars/community.png",
  },
  {
    title: "Sustainability",
    text: "Long-term thinking for a platform that lasts.",
    icon: "/images/pillars/sustainability.png",
  },
];

export default function Pillars() {
  return (
    <section
      className="
        max-w-[1600px]
        mx-auto
        px-6
        mt-2
        py-6
      "
    >
      <div
        className="
          rounded-[34px]
          border
          border-zinc-800
          bg-gradient-to-br
          from-zinc-950
          to-black
          px-8
          py-12
        "
      >
        <div
          className="
            grid
            md:grid-cols-2
            xl:grid-cols-6
            gap-10
          "
        >
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="
                flex
                flex-col
                items-center
                text-center
              "
            >
              <div className="mb-2 flex h-36 w-36 items-center justify-center rounded-[28px] border border-white/5 bg-white/[0.02] hover:border-purple-500/20 hover:bg-purple-500/5 hover:-translate-y-1 transition-all duration-300">
                <Image
                  src={pillar.icon}
                  alt={pillar.title}
                  width={110}
                  height={110}
                  className="object-contain"
                />
              </div>

              <h3
                className="
                  mt-10
                  h-10
                  flex
                  items-center
                  justify-center
                  text-center
                  text-[20px]
                  font-bold
                  text-white
                "
              >
                {pillar.title}
              </h3>

              <p
                className="
                  mt-2
                  h-26
                  max-w-[220px]
                  text-center
                  text-[17px]
                  leading-9
                  text-zinc-400
                "
              >
                {pillar.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}