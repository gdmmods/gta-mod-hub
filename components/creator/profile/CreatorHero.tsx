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
}

export default function CreatorHero({
  creator,
  bannerImage,
  socials,
  modsCount,
  totalLikes,
  totalDownloads,
}: CreatorHeroProps) {

  return (

    <section className="relative">

      {/* BANNER */}
      <div
        className="
          relative
          h-[420px]
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
            opacity-70
          "
        />

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-black/30
            via-black/50
            to-black
          "
        />

      </div>

      {/* PROFILE */}
      <div
        className="
          relative
          z-10
          max-w-[1450px]
          mx-auto
          px-6
          -mt-36
        "
      >

        <div
          className="
            rounded-[36px]
            border
            border-zinc-800
            bg-zinc-950/75
            shadow-[0_0_80px_rgba(168,85,247,0.12)]
            backdrop-blur-2xl
            overflow-hidden
            shadow-[0_0_60px_rgba(168,85,247,0.08)]
          "
        >

          <div className="p-10 xl:p-12">

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
                "
              >

                <img
                  src={
                    creator.avatar ||
                    "https://placehold.co/200x200?text=👤"
                  }
                  alt={creator.name}
                  className="
                    w-36
                    h-36
                    rounded-[32px]
                    object-cover
                    border
                    border-zinc-800
                    shadow-2xl
                  "
                />

                <CreatorActions
                  creatorId={creator.id}
                />

              </div>

              {/* RIGHT */}
              <div className="flex-1">

                <CreatorHeader
                  name={creator.name}
                  verified={creator.verified}
                  status={creator.status}
                />

                <CreatorAboutSection
                  tagline={creator.tagline}
                  specialization={
                    creator.specialization
                  }
                />

                <CreatorBio
                  bio={creator.bio}
                />

                <CreatorSocialLinks
                  socials={socials}
                />

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