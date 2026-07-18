import Link from "next/link";

import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";

import GlowCard from "@/components/ui/GlowCard";
import SectionTitle from "@/components/ui/SectionTitle";
import ProgressBar from "@/components/ui/ProgressBar";
import CheckboxItem from "@/components/ui/CheckboxItem";

import { roadmap } from "../../lib/roadmap/roadmapv1";

export default function RoadmapPreview() {
  const preview = roadmap.slice(0, 3);

  return (
    <Section>

      <PageContainer>

        <div
          className="
            flex
            flex-col
            gap-6
            md:flex-row
            md:items-end
            md:justify-between
          "
        >

          <SectionTitle
            eyebrow="ROADMAP"
            title="Building the Future"
            description="
              Transparent platform evolution focused on creators,
              discovery systems, automation and ecosystem expansion.
            "
          />

          <Link
            href="/roadmap"
            className="
              text-sm
              text-purple-400
              hover:text-purple-300
              transition
            "
          >
            View Full Roadmap →
          </Link>

        </div>

        {/* GRID */}
        <div
          className="
            mt-12
            grid
            gap-6
            lg:grid-cols-3
          "
        >

          {preview.map((phase) => (

            <GlowCard
              key={phase.phase}
              className="p-7"
            >

              {/* STATUS */}
              <div
                className="
                  inline-flex
                  rounded-full
                  border
                  border-white/10
                  bg-black/40
                  px-3
                  py-1
                  text-[10px]
                  uppercase
                  tracking-[0.18em]
                  text-zinc-300
                "
              >
                {phase.status}
              </div>

              {/* TITLE */}
              <p
                className="
                  mt-5
                  text-sm
                  uppercase
                  tracking-[0.18em]
                  text-zinc-500
                "
              >
                {phase.phase}
              </p>

              <h3
                className="
                  mt-2
                  text-3xl
                  font-black
                  tracking-tight
                "
              >
                {phase.title}
              </h3>

              {/* ITEMS */}
              <div className="mt-7 space-y-4">

                {phase.items.map((item) => (

                  <CheckboxItem
                    key={item.text}
                    text={item.text}
                    done={item.done}
                  />

                ))}

              </div>

              {/* PROGRESS */}
              <div className="mt-8">

                <ProgressBar
                  value={phase.progress}
                />

              </div>

            </GlowCard>

          ))}

        </div>

      </PageContainer>

    </Section>
  );
}