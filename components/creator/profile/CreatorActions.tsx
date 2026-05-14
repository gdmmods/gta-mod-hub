interface CreatorActionsProps {
  creatorId: string;
}

export default function CreatorActions({
  creatorId,
}: CreatorActionsProps) {

  return (

    <div className="mt-5 w-full">

      <button
        className="
          w-full
          rounded-2xl
          bg-gradient-to-r
          from-purple-600
          to-purple-500
          py-3
          font-medium
          shadow-lg
          hover:opacity-90
          transition
        "
      >
        Follow Creator
      </button>

    </div>

  );

}