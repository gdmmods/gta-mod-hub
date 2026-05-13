import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionTitle from "@/components/ui/SectionTitle";

type FeaturedModsProps = {
  featured: any;
  featuredCreators: string;
};

export default function FeaturedMods({
  featured,
  featuredCreators,
}: FeaturedModsProps) {
  if (!featured) return null;

  return (
    <Section className="pt-4">

      <PageContainer>

        <SectionTitle
          eyebrow="FEATURED"
          title="Trending Right Now"
          description="
            Discover standout creations from the ModVault ecosystem.
          "
        />

        <div className="mt-10">

          <Link
            href={`/mods/${featured.id}`}
            className="group block"
          >

            <div
              className="
                relative
                overflow-hidden
                rounded-[32px]
                border
                border-zinc-800
              "
            >

              {/* IMAGE */}
              <img
                src={featured.image}
                alt={featured.title}
                className="
                  h-[420px]
                  w-full
                  object-cover
                  transition
                  duration-700
                  group-hover:scale-[1.03]
                "
              />

              {/* OVERLAY */}
              <div
                className="
                  absolute
                  inset-0
                  bg-gradient-to-t
                  from-black
                  via-black/30
                  to-transparent
                "
              />

              {/* GLOW */}
              <div
                className="
                  absolute
                  right-0
                  top-0
                  h-[240px]
                  w-[240px]
                  bg-purple-500/20
                  blur-[120px]
                "
              />

              {/* CONTENT */}
              <div
                className="
                  absolute
                  bottom-0
                  left-0
                  z-10
                  p-8
                "
              >

                <p
                  className="
                    text-sm
                    uppercase
                    tracking-[0.18em]
                    text-purple-400
                  "
                >
                  Featured Mod
                </p>

                <h2
                  className="
                    mt-3
                    text-4xl
                    font-black
                    tracking-tight
                  "
                >
                  {featured.title}
                </h2>

                <p
                  className="
                    mt-3
                    text-zinc-300
                  "
                >
                  by {featuredCreators}
                </p>

                {featured.description && (
                  <p
                    className="
                      mt-5
                      max-w-2xl
                      text-zinc-400
                      leading-relaxed
                    "
                  >
                    {featured.description}
                  </p>
                )}

                {/* STATS */}
                <div className="mt-6 flex gap-6 text-sm">

                  <div className="text-zinc-300">
                    ❤ {featured.likes}
                  </div>

                  <div className="text-zinc-300">
                    ↓ {featured.downloads}
                  </div>

                  <div className="text-zinc-300">
                    ★ {featured.favorites}
                  </div>

                </div>

              </div>

            </div>

          </Link>

        </div>

      </PageContainer>

    </Section>
  );
}