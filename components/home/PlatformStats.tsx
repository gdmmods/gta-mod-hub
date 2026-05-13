import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import GlowCard from "@/components/ui/GlowCard";
import SectionTitle from "@/components/ui/SectionTitle";

export default function PlatformStats() {
  return (
    <Section>

      <PageContainer>

        <SectionTitle
          eyebrow="ECOSYSTEM"
          title="Built for the Future of Modding"
          description="
            ModVault is evolving into a scalable creator ecosystem
            focused on discovery, identity, automation and long-term
            platform intelligence.
          "
        />

        <div
          className="
            mt-12
            grid
            gap-6
            md:grid-cols-2
            xl:grid-cols-4
          "
        >

          {[
            [
              "10K+",
              "Mods Indexed",
              "Growing ecosystem of curated content.",
            ],
            [
              "2K+",
              "Creators",
              "Supporting creators across multiple categories.",
            ],
            [
              "500K+",
              "Downloads",
              "High engagement across the platform.",
            ],
            [
              "AI READY",
              "Infrastructure",
              "Preparing intelligent automation systems.",
            ],
          ].map(([value, title, text]) => (

            <GlowCard
              key={title}
              className="p-7"
            >

              <div
                className="
                  text-4xl
                  font-black
                  tracking-tight
                  text-white
                "
              >
                {value}
              </div>

              <h3
                className="
                  mt-5
                  text-xl
                  font-bold
                "
              >
                {title}
              </h3>

              <p
                className="
                  mt-3
                  text-sm
                  leading-relaxed
                  text-zinc-400
                "
              >
                {text}
              </p>

            </GlowCard>

          ))}

        </div>

      </PageContainer>

    </Section>
  );
}