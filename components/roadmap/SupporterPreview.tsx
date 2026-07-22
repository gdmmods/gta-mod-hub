export default function SupporterPreview() {

    return (
        <>
            {/* FOOTER CTA */}
      <section
        className="
          max-w-[1600px]
          mx-auto
          px-6
          pb-10
        "
      >

        <div
          className="
            rounded-[34px]
            border
            border-zinc-800
            bg-gradient-to-r
            from-[#12071e]
            via-black
            to-[#12071e]
            p-8
          "
        >

          <div
            className="
              flex
              flex-col
              xl:flex-row
              justify-between
              items-center
              gap-8
            "
          >

            <div>

              <p className="text-3xl font-bold">
                🔒 Behind the Build
              </p>

              <p
                className="
                  text-zinc-400
                  mt-3
                  max-w-2xl
                "
              >
                Follow the development of ModVault through design
                discussions, development journals and early previews.
              </p>

            </div>

            <button
              className="
                rounded-2xl
                bg-gradient-to-r
                from-purple-600
                to-purple-500
                px-8
                py-4
                font-medium
                shadow-[0_0_35px_rgba(168,85,247,0.35)]
                hover:scale-[1.03]
                transition
              "
            >
              Supporter access coming soon. →
            </button>

          </div>

          {/* STATS */}
          <div
            className="
              grid
              grid-cols-2
              md:grid-cols-4
              gap-6
              mt-12
            "
          >

            {[
              ["10K+", "Mods"],
              ["2K+", "Creators"],
              ["45K+", "Users"],
              ["500K+", "Downloads"],
            ].map(([value, label]) => (

              <div
                key={label}
                className="
                  rounded-2xl
                  border
                  border-zinc-800
                  bg-black/30
                  p-5
                "
              >

                <p className="text-3xl font-bold">
                  {value}
                </p>

                <p className="text-zinc-500 mt-2">
                  {label}
                </p>

              </div>

            ))}

          </div>

        </div>

        <p
          className="
            text-center
            text-zinc-600
            text-sm
            mt-8
          "
        >
          💜 Thank you for being part of ModVault.
          The best is yet to come.
        </p>

      </section>
        </>
    );
}