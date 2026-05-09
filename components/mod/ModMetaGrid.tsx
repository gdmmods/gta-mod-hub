export default function ModMetaGrid({
  mod,
  creators,
  images,
}: any) {

  const items = [
    {
      label: "Category",
      value:
        mod.category ||
        "Vehicle",
    },

    {
      label: "Status",
      value:
        mod.verified
          ? "Verified"
          : "Community",
    },

    {
      label: "Media",
      value: `${
        images.length + 1
      } Images`,
    },

    {
      label: "Creators",
      value: `${creators.length}`,
    },

  ];

  return (
    <div
      className="
        mt-5
        rounded-2xl
        border
        border-zinc-900
        bg-black/20
        overflow-hidden
      "
    >

      {items.map(
        (item, index) => (

          <div
            key={item.label}
            className={`
              flex
              items-center
              justify-between
              gap-4
              px-4
              py-3

              ${
                index !==
                items.length - 1
                  ? "border-b border-zinc-900"
                  : ""
              }
            `}
          >

            {/* LABEL */}
            <div
              className="
                text-[11px]
                uppercase
                tracking-[0.18em]
                text-zinc-500
              "
            >
              {item.label}
            </div>

            {/* VALUE */}
            <div
              className="
                text-sm
                font-medium
                text-white
                text-right
              "
            >
              {item.value}
            </div>

          </div>

        )
      )}

    </div>
  );
}