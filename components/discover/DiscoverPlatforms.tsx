"use client";

interface Identity {
  id: string;
  username: string;
  profile_url: string | null;
  verification_status: string;
  connected_at: string;
  platform: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface DiscoverPlatformsProps {
  identities: Identity[];
  loading: boolean;
  selectedIdentityIds: string[];
  discovering: boolean;
  hasVerifiedIdentity: boolean;
  message: string | null;
  onToggleIdentity: (
    identityId: string
  ) => void;
  onDiscover: () => void;
}

export default function DiscoverPlatforms({
  identities,
  loading,
  selectedIdentityIds,
  discovering,
  hasVerifiedIdentity,
  message,
  onToggleIdentity,
  onDiscover,
}: DiscoverPlatformsProps) {
  return (
    <>
      <section
        className="
          rounded-[32px]
          border
          border-zinc-800
          bg-zinc-950
          p-8
          mb-8
        "
      >
        <div className="mb-8">

          <p
            className="
              text-purple-400
              uppercase
              tracking-[0.2em]
              text-xs
              mb-3
            "
          >
            Connected Sources
          </p>

          <h2
            className="
              text-2xl
              font-bold
              mb-2
            "
          >
            Your Platforms
          </h2>

          <p
            className="
              text-zinc-500
              text-sm
            "
          >
            These are the external identities
            ModVault can use for discovery.
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
              border-zinc-800
              bg-black
              p-6
            "
          >
            <p
              className="
                text-zinc-400
                mb-4
              "
            >
              You haven't connected any
              external platforms yet.
            </p>

            <a
              href="/connect-platforms"
              className="
                inline-flex
                px-5
                py-3
                rounded-xl
                bg-purple-600
                hover:bg-purple-500
                transition
                font-medium
              "
            >
              Connect a Platform
            </a>
          </div>

        ) : (

          <div
            className="
              space-y-3
            "
          >
            {identities.map(
              (identity) => {

                const verified =
                  identity.verification_status ===
                  "verified";

                const selected =
                  selectedIdentityIds.includes(
                    identity.id
                  );

                return (
                  <div
                    key={identity.id}
                    onClick={() => {
                      if (!verified) {
                        return;
                      }

                      onToggleIdentity(
                        identity.id
                      );
                    }}
                    className={`
                      flex
                      items-center
                      justify-between
                      gap-6
                      rounded-2xl
                      border
                      p-5
                      transition
                      ${
                        verified
                          ? "cursor-pointer"
                          : "cursor-not-allowed"
                      }
                      ${
                        selected
                          ? "border-purple-500 bg-purple-950/20"
                          : "border-zinc-800 bg-zinc-900"
                      }
                      ${
                        !verified
                          ? "opacity-60"
                          : ""
                      }
                    `}
                  >
                    <div>

                      <h3
                        className="
                          font-semibold
                          text-lg
                        "
                      >
                        {identity.platform?.name ||
                          "Unknown Platform"}
                      </h3>

                      <p
                        className="
                          text-sm
                          text-zinc-500
                          mt-1
                        "
                      >
                        {identity.username}
                      </p>

                    </div>

                    <div
                      className={`
                        inline-flex
                        items-center
                        gap-1.5
                        text-xs
                        font-medium
                        uppercase
                        tracking-wider
                        ${
                          verified
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      `}
                    >
                      {verified
                        ? "✓ VERIFIED"
                        : "◷ PENDING"}
                    </div>

                  </div>
                );
              }
            )}
          </div>

        )}

      </section>

      {identities.length > 0 && (

        <section
          className="
            rounded-[32px]
            border
            border-zinc-800
            bg-zinc-950
            p-8
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-6
            "
          >

            <div>

              <h2
                className="
                  text-xl
                  font-bold
                  mb-2
                "
              >
                Find Your Existing Work
              </h2>

              <p
                className="
                  text-amber-400
                  text-sm
                  max-w-xl
                "
              >
                ModVault will discover projects
                from your verified platforms.
                Nothing will be imported automatically.
              </p>

              {!hasVerifiedIdentity && (
                <p
                  className="
                    mt-3
                    text-sm
                    text-amber-400
                  "
                >
                  Verify at least one connected platform
                  before discovering your work.
                </p>
              )}

            </div>

            <button
              type="button"
              onClick={onDiscover}
              disabled={
                discovering ||
                !hasVerifiedIdentity
              }
              className="
                shrink-0
                px-5
                py-3
                rounded-xl
                bg-purple-600
                hover:bg-purple-500
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition
                font-medium
              "
            >
              {discovering
                ? "Discovering..."
                : hasVerifiedIdentity
                  ? "Discover Mods"
                  : "Verify a Platform First"}
            </button>

          </div>

          {message && (

            <div
              className="
                mt-6
                rounded-2xl
                border
                border-zinc-800
                bg-black
                p-5
                text-sm
                text-zinc-400
              "
            >
              {message}
            </div>

          )}

        </section>

      )}

    </>
  );
}