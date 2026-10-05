"use client";

import CreatorVerificationBadge from "./CreatorVerificationBadge";

interface CreatorHeaderProps {
  name: string;
  verified?: boolean;
  status?: string | null;
  isManaged?: boolean;
  games?: any[];
}

export default function CreatorHeader({
  name,
  verified,
  status,
  isManaged,
  games,
}: CreatorHeaderProps) {

  return (

    <div
      className="
        flex
        flex-col
        gap-5
      "
    >

      {/* TOP ROW */}
      <div
        className="
          flex
          flex-wrap
          items-center
          gap-3
        "
      >

        <h1
          className="
            text-5xl
            md:text-6xl
            xl:text-7xl
            font-black
            tracking-[-0.04em]
            leading-none
            text-white
          "
        >
          {name}
        </h1>

        <div className="flex items-center gap-2">

          <CreatorVerificationBadge
            verified={verified}
          />

          {status && (

            <div
              className="
                px-3
                py-1.5
                rounded-2xl
                bg-emerald-500/10
                border
                border-emerald-500/20
                text-sm
                font-medium
                text-emerald-300
                backdrop-blur-xl
              "
            >
              {status}
            </div>

          )}

        </div>

      </div>

      {/* SUBTEXT */}
      <div
        className="
          flex
          flex-wrap
          items-center
          gap-3
          text-sm
          text-zinc-500
        "
      >

        <span
          className="
            uppercase
            tracking-[0.18em]
            text-zinc-600
          "
        >
          ModVault Creator
        </span>

        <div
          className="
            w-1
            h-1
            rounded-full
            bg-zinc-700
          "
        />

        {/* GAMES */}

        {games && games.length > 0 && (

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
              mt-1
            "
          >

            {games.map((game) => (

              <span
                key={game.id}
                className="
                  px-3
                  py-1.5
                  rounded-2xl
                  bg-zinc-900
                  border
                  border-zinc-800
                  text-sm
                  text-zinc-300
                "
              >
                {game.name}
              </span>

            ))}

          </div>

        )}

        {isManaged && (

            <span
              className="
                px-3
                py-1.5
                rounded-2xl
                text-sm
                text-amber-300
                hover:text-amber-200
              "
            >
              Creator Ecosystem Profile
            </span>

          )}

        {!isManaged && (

          <>

            <div
              className="
                w-1
                h-1
                rounded-full
                bg-zinc-700
              "
            />

            <button
              title="
                This creator profile has not yet been claimed by its creator.
              "
              onClick={() =>
                document
                  .getElementById(
                    "claim-profile"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="
                text-amber-300
                hover:text-amber-200
                transition
              "
            >
              ⚡ Unclaimed Creator Profile
            </button>

          </>

        )}

      </div>

    </div>

  );

}