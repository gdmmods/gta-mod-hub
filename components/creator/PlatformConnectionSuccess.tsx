"use client";

interface PlatformConnectionSuccessProps {
  platformName: string;
  onConnectAnother: () => void;
  onContinue: () => void;
  onDashboard: () => void;
}

export default function PlatformConnectionSuccess({
  platformName,
  onConnectAnother,
  onContinue,
  onDashboard,
}: PlatformConnectionSuccessProps) {

  return (
    <div
      className="
        mt-8
        rounded-[32px]
        border
        border-zinc-800
        bg-zinc-950
        p-8
      "
    >

      <div className="max-w-2xl">

        <p
          className="
            text-purple-400
            uppercase
            tracking-[0.2em]
            text-xs
            mb-3
          "
        >
          Platform Connected
        </p>

        <h2
          className="
            text-2xl
            font-bold
            mb-2
          "
        >
          {platformName} connected
        </h2>

        <p
          className="
            text-zinc-500
            text-sm
            mb-8
          "
        >
          Your creator identity is now connected
          to ModVault.
        </p>

        <div className="flex flex-wrap items-center gap-3">

          <button
            onClick={onConnectAnother}
            className="
              px-5
              py-3
              rounded-xl
              bg-purple-600
              hover:bg-purple-500
              transition
              font-medium
            "
          >
            + Connect Another Platform
          </button>

          <button
            onClick={onContinue}
            className="
              px-5
              py-3
              rounded-xl
              border
              border-zinc-800
              text-zinc-300
              hover:border-zinc-600
              transition
            "
          >
            Continue to Your Mods
          </button>

        </div>

        <button
          onClick={onDashboard}
          className="
            mt-5
            text-sm
            text-zinc-500
            hover:text-zinc-300
            transition
          "
        >
          Back to Dashboard →
        </button>

      </div>

    </div>
  );
}