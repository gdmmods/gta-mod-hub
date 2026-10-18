import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionTitle from "@/components/ui/SectionTitle";

type FeaturedMod = {
  id: string;
  title: string;
  image: string;
  likes: number;
  downloads: number;
  mod_creators?: Array<{
    creators?: { name?: string | null } | null;
  }>;
};

type FeaturedModsProps = {
  featured: FeaturedMod[];
};

export default function FeaturedMods({
  featured,
}: FeaturedModsProps) {
  if (featured.length === 0) return null;

  return (
    <Section className="pt-4">

      <PageContainer>

        <SectionTitle
          eyebrow="FEATURED"
          title="Featured Creations"
          description="
            Discover standout creations from the ModVault ecosystem.
          "
        />

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {featured.map((mod) => {
            const creators = mod.mod_creators
              ?.map((relation) => relation.creators?.name)
              .filter(Boolean)
              .join(" • ");

            return (
              <Link
                key={mod.id}
                href={`/mods/${mod.id}`}
                className="group block"
              >
                <article className="relative h-[340px] overflow-hidden rounded-[34px] border border-zinc-800">
                  <img
                    src={mod.image || "/placeholder.jpg"}
                    alt={mod.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                    <p className="mb-3 text-sm uppercase tracking-[0.2em] text-purple-300">
                      Featured Creation
                    </p>
                    <h2 className="line-clamp-2 text-2xl font-black leading-tight sm:text-3xl">
                      {mod.title}
                    </h2>
                    {creators && (
                      <p className="mt-2 line-clamp-1 text-sm text-zinc-300">
                        by {creators}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-5 text-sm text-zinc-300">
                      <span>❤️ {mod.likes ?? 0}</span>
                      <span>⬇ {mod.downloads ?? 0}</span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

      </PageContainer>

    </Section>
  );
}
