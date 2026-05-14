interface Props {
  form: any;
}

export default function UploadPreviewCard({
  form,
}: Props) {

  if (!form.image)
    return null;

  return (

    <div
      className="
        bg-zinc-900
        border
        border-zinc-800
        rounded-3xl
        p-4
      "
    >

      <div
        className="
          flex
          items-center
          justify-between
          mb-3
        "
      >

        <p
          className="
            text-sm
            text-gray-400
          "
        >
          Live Preview
        </p>

        <span
          className="
            text-xs
            text-green-400
          "
        >
          LIVE
        </span>

      </div>

      <img
        src={form.image}
        alt="Preview"
        className="
          w-full
          h-44
          object-cover
          rounded-2xl
          border
          border-zinc-800
        "
      />

      <div className="mt-4">

        <p
          className="
            font-semibold
            line-clamp-1
          "
        >
          {form.title ||
            "Your mod title"}
        </p>

        <p
          className="
            text-sm
            text-gray-500
            mt-1
          "
        >
          by{" "}
          {form.creator ||
            "Creator"}
        </p>

      </div>

    </div>

  );

}