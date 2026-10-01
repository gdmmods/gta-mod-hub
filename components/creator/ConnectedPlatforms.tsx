"use client";

interface ConnectedPlatformsProps {
  identities: any[];
  loading: boolean;
}

export default function ConnectedPlatforms({
  identities,
  loading,
}: ConnectedPlatformsProps) {

  return (
    <div
      className="
        rounded-[32px]
        border
        border-zinc-800
        bg-zinc-950
        p-8
        mb-8
      "
    >

      <div className="mb-6">

        <p
          className="
            text-purple-400
            uppercase
            tracking-[0.2em]
            text-xs
            mb-3
          "
        >
          Connected Platforms
        </p>

        <h2
          className="
            text-2xl
            font-bold
            mb-2
          "
        >
          Your External Identities
        </h2>

        <p
          className="
            text-zinc-500
            text-sm
            max-w-2xl
          "
        >
          Platforms you have connected to your
          ModVault creator identity.
        </p>

      </div>

      {loading ? (

        <p className="text-zinc-500">
          Loading connected platforms...
        </p>

      ) : identities.length === 0 ? (

        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-zinc-800
            p-6
          "
        >

          <p className="text-zinc-500 text-sm">
            No platforms connected yet.
          </p>

        </div>

      ) : (

        <div className="space-y-3">

          {identities.map((identity) => (

            <div
              key={identity.id}
              className="
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-900
                p-5
                flex
                items-center
                justify-between
                gap-6
              "
            >

              <div>

                <div
                  className="
                    text-lg
                    font-semibold
                    mb-1
                  "
                >
                  {identity.platform?.name ||
                    "Platform"}
                </div>

                <div
                  className="
                    text-sm
                    text-zinc-400
                  "
                >
                  {identity.username}
                </div>

              </div>

              <div className="text-right">

                <div
                  className="
                    text-xs
                    uppercase
                    tracking-wider
                    text-zinc-500
                  "
                >
                  {identity.verification_status ||
                    "pending"}
                </div>

                {identity.profile_url && (

                  <a
                    href={identity.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      inline-block
                      mt-2
                      text-sm
                      text-purple-400
                      hover:text-purple-300
                      transition
                    "
                  >
                    View Profile →
                  </a>

                )}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}