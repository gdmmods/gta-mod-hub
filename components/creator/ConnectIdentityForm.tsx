"use client";

interface ConnectIdentityFormProps {
  platform: any;
  username: string;
  profileUrl: string;
  saving: boolean;
  onUsernameChange: (value: string) => void;
  onProfileUrlChange: (value: string) => void;
  onCancel: () => void;
  onConnect: () => void;
}

export default function ConnectIdentityForm({
  platform,
  username,
  profileUrl,
  saving,
  onUsernameChange,
  onProfileUrlChange,
  onCancel,
  onConnect,
}: ConnectIdentityFormProps) {

    if (!platform) {
    return null;
  }

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

      <p
        className="
          text-purple-400
          uppercase
          tracking-[0.2em]
          text-xs
          mb-3
        "
      >
        Connect Identity
      </p>

      <h2
        className="
          text-2xl
          font-bold
          mb-2
        "
      >
        {platform.name}
      </h2>

      <p
        className="
          text-zinc-500
          text-sm
          mb-8
        "
      >
        Add the identity you use on {platform.name}.
      </p>

      <div
        className="
          space-y-6
          max-w-2xl
        "
      >

        {/* USERNAME */}

        <div>

          <label
            className="
              block
              text-sm
              text-zinc-400
              mb-2
            "
          >
            Username
          </label>

          <input
            value={username}
            onChange={(e) =>
              onUsernameChange(e.target.value)
            }
            placeholder="Your username"
            className="
              w-full
              rounded-xl
              border
              border-zinc-800
              bg-black
              px-4
              py-3
              text-white
              outline-none
              focus:border-purple-500
            "
          />

        </div>

        {/* PROFILE URL */}

        <div>

          <label
            className="
              block
              text-sm
              text-zinc-400
              mb-2
            "
          >
            Profile URL
          </label>

          <input
            value={profileUrl}
            onChange={(e) =>
              onProfileUrlChange(e.target.value)
            }
            placeholder="https://..."
            className="
              w-full
              rounded-xl
              border
              border-zinc-800
              bg-black
              px-4
              py-3
              text-white
              outline-none
              focus:border-purple-500
            "
          />

        </div>

        {/* ACTIONS */}

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <button
            onClick={onCancel}
            disabled={saving}
            className="
              px-5
              py-3
              rounded-xl
              border
              border-zinc-800
              text-zinc-300
              hover:border-zinc-600
              transition
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
          >
            Cancel
          </button>

          <button
            disabled={
              !username.trim() ||
              saving
            }
            onClick={onConnect}
            className="
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
            {saving
              ? "Connecting..."
              : "Connect Identity"}
          </button>

        </div>

      </div>

    </div>

  );
}