import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import GradientButton from "@/components/ui/GradientButton";
import AuthenticatedUploadLink from "@/components/auth/AuthenticatedUploadLink";

export default function CTASection() {
  return (
    <Section className="pb-24">

      <PageContainer>

        <div
          className="
            relative
            overflow-hidden
            rounded-[36px]
            border
            border-zinc-800
            bg-gradient-to-r
            from-[#12071e]
            via-black
            to-[#12071e]
            p-10
            md:p-14
          "
        >

          {/* GLOW */}
          <div
            className="
              absolute
              right-0
              top-0
              h-[300px]
              w-[300px]
              bg-purple-500/10
              blur-[140px]
              pointer-events-none
            "
          />

          <div
            className="
              relative
              z-10
              flex
              flex-col
              gap-10
              xl:flex-row
              xl:items-center
              xl:justify-between
            "
          >

            {/* LEFT */}
            <div>

              <p
                className="
                  text-sm
                  uppercase
                  tracking-[0.2em]
                  text-purple-400
                "
              >
                JOIN THE ECOSYSTEM
              </p>

              <h2
                className="
                  mt-5
                  max-w-3xl
                  text-4xl
                  font-black
                  leading-tight
                  tracking-tight
                  md:text-5xl
                "
              >
                Build the Future of Modding Together
              </h2>

              <p
                className="
                  mt-6
                  max-w-2xl
                  text-lg
                  leading-relaxed
                  text-zinc-400
                "
              >
                Upload creations, support creators, discover
                immersive experiences and help shape the next
                generation creator ecosystem.
              </p>

            </div>

            {/* RIGHT */}
            <div className="flex flex-wrap gap-4">

              <AuthenticatedUploadLink className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-3 text-sm font-medium text-white shadow-[0_0_30px_rgba(168,85,247,0.35)] transition duration-300 hover:scale-[1.03]">
                Upload Mod
              </AuthenticatedUploadLink>

              <GradientButton
                href="/roadmap"
                className="
                  border
                  border-zinc-800
                  bg-zinc-950
                  shadow-none
                  hover:border-purple-500/40
                "
              >
                Explore Roadmap
              </GradientButton>

            </div>

          </div>

        </div>

      </PageContainer>

    </Section>
  );
}