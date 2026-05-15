interface Props {

  handleDelete: any;

}

export default function EditDangerZone({
  handleDelete,
}: Props) {

  return (

    <div
      className="
        border-t
        border-zinc-800
        pt-8
      "
    >

      <button
        type="button"
        onClick={handleDelete}
        className="
          w-full
          px-6
          py-4
          rounded-xl
          bg-red-600
          hover:bg-red-500
          transition
          font-semibold
        "
      >
        Delete Mod
      </button>

      <p
        className="
          text-xs
          text-gray-500
          mt-3
          text-center
        "
      >
        This permanently removes the mod.
      </p>

    </div>

  );

}