"use client";

interface PlatformPickerProps {
  platforms: any[];
  loading: boolean;
  onSelect: (platform: any) => void;
}

export default function PlatformPicker({
  platforms,
  loading,
  onSelect,
}: PlatformPickerProps) {

  return (

    <div
      className="
        rounded-[32px]
        border
        border-zinc-800
        bg-zinc-950
        p-8
      "
    >

      <h2
        className="
          text-xl
          font-bold
          mb-2
        "
      >
        Choose a Platform
      </h2>

      <p
        className="
          text-zinc-500
          text-sm
          mb-6
        "
      >
        Select where your creator identity exists.
      </p>

      {loading ? (

        <p className="text-zinc-500">
          Loading platforms...
        </p>

      ) : platforms.length === 0 ? (

        <p className="text-zinc-500">
          No platforms are currently available.
        </p>

      ) : (

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-4
          "
        >

          {platforms.map((platform) => (

            <button
              key={platform.id}
              onClick={() =>
                onSelect(platform)
              }
              className="
                text-left
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-900
                p-5
                hover:border-purple-500
                transition
              "
            >

              <div
                className="
                  text-lg
                  font-semibold
                  mb-1
                "
              >
                {platform.name}
              </div>

              <div
                className="
                  text-sm
                  text-zinc-500
                "
              >
                Connect your {platform.name} identity
              </div>

            </button>

          ))}

        </div>

      )}

    </div>

  );
}