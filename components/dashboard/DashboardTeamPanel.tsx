type Props = {
  creator: any;
};

export default function DashboardTeamPanel({
  creator,
}: Props) {

  if (
    !creator ||
    creator.owner_type !== "team"
  ) {
    return null;
  }

  return (

    <div
      className="
        mb-10
        rounded-3xl
        border
        border-zinc-800
        bg-zinc-900/50
        p-6
      "
    >

      <p
        className="
          text-[10px]
          uppercase
          tracking-[0.22em]
          text-purple-400
        "
      >
        Team Management
      </p>

      <h2
        className="
          mt-2
          text-2xl
          font-bold
        "
      >
        Team Controls
      </h2>

      <p
        className="
          mt-3
          text-zinc-400
        "
      >
        Manage members,
        invitations and
        permissions.
      </p>

      <div
        className="
          mt-6
          flex
          flex-wrap
          gap-3
        "
      >

        <button
          className="
            px-4
            py-3
            rounded-xl
            border
            border-zinc-700
          "
        >
          Members
        </button>

        <button
          className="
            px-4
            py-3
            rounded-xl
            border
            border-zinc-700
          "
        >
          Invites
        </button>

        <button
          className="
            px-4
            py-3
            rounded-xl
            border
            border-zinc-700
          "
        >
          Permissions
        </button>

      </div>

    </div>

  );

}