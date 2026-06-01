"use client";

import CreatorActions from "./CreatorActions";
import CreatorAboutSection from "./CreatorAboutSection";
import CreatorBio from "./CreatorBio";
import CreatorHeader from "./CreatorHeader";
import CreatorSocialLinks from "./CreatorSocialLinks";
import CreatorStats from "./CreatorStats";

interface CreatorHeroProps {
  creator: any;

  bannerImage: string;

  socials: Record<string, string>;

  modsCount: number;
  totalLikes: number;
  totalDownloads: number;
  isManaged: boolean;
}

export default function CreatorHero({
  creator,
  bannerImage,
  socials,
  modsCount,
  totalLikes,
  totalDownloads,
  isManaged,
}: CreatorHeroProps) {

const supportUrl =
  creator.socials?.patreon ||
  creator.socials?.kofi ||
  creator.socials?.store ||
  creator.socials?.website;

  return (

    <section
      className="
        relative
        max-w-[1450px]
        mx-auto
        px-6
        pt-8
      "
    >

      <div
        className="
          relative
          overflow-hidden
          rounded-[40px]
          border
          border-zinc-800
          bg-black
          shadow-[0_0_80px_rgba(168,85,247,0.10)]
        "
      >

        {/* BANNER */}
        <div
          className="
            relative
            h-[240px]
            xl:h-[280px]
            overflow-hidden
          "
        >

          <img
            src={bannerImage}
            alt={creator.name}
            className="
              w-full
              h-full
              object-cover
              opacity-75
              scale-[1.02]
            "
          />

          {/* DARK OVERLAY */}
          <div
            className="
              absolute
              inset-0
              bg-black/35
            "
          />

          {/* CINEMATIC GRADIENT */}
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-b
              from-black/10
              via-black/30
              to-black
            "
          />

          {/* PURPLE ATMOSPHERIC GLOW */}
          <div
            className="
              absolute
              inset-0
              bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_45%)]
            "
          />

          {/* SIDE VIGNETTE */}
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-r
              from-black/50
              via-transparent
              to-black/30
            "
          />

        </div>

        {/* CONTENT */}
        <div
          className="
            relative
            z-10
            px-8
            xl:px-12
            pb-10
            xl:pb-12
            pt-2
            -mt-14
          "
        >

          <div
            className="
              flex
              flex-col
              xl:flex-row
              gap-10
            "
          >

            {/* LEFT */}
            <div
              className="
                flex
                flex-col
                items-start
                shrink-0
              "
            >

              {/* AVATAR */}
              <div
                className="
                  relative
                "
              >

                <div
                  className="
                    absolute
                    inset-0
                    rounded-[34px]
                    bg-purple-500/20
                    blur-2xl
                  "
                />

                <img
                  src={
                    creator.avatar ||
                    "https://placehold.co/200x200?text=👤"
                  }
                  alt={creator.name}
                  className="
                    relative
                    w-32
                    h-32
                    rounded-[32px]
                    object-cover
                    border
                    border-zinc-700
                    shadow-[0_0_40px_rgba(168,85,247,0.25)]
                    bg-black
                  "
                />

              </div>

              <div className="mt-6">
                
                

                <CreatorActions
                  creatorId={creator.id}
                  supportUrl={supportUrl}
                />
              </div>

            </div>

            {/* RIGHT */}
            <div className="flex-1">

              <CreatorHeader
                name={creator.name}
                verified={creator.verified}
                status={creator.status}
                isManaged={isManaged}
              />

              <div className="mt-6">

                <CreatorAboutSection
                  tagline={creator.tagline}
                  specialization={
                    creator.specialization
                  }
                />

              </div>

              <div className="mt-6">

                <CreatorBio
                  bio={creator.bio}
                />

              </div>

              <div className="mt-7">

                <CreatorSocialLinks
                  socials={socials}
                />

              </div>

              <div className="mt-10">

                <CreatorStats
                  modsCount={modsCount}
                  totalLikes={totalLikes}
                  totalDownloads={totalDownloads}
                  location={creator.location}
                />

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}