import MetaItem from "./MetaItem";

export default function ModMetaGrid({
  mod,
  creators = [],
  images = [],
}: any) {

  const mediaCount =
    Array.isArray(images)
      ? images.length + 1
      : 1;

  return (
    <div
      className="
        rounded-[28px]
        border
        border-zinc-900
        bg-zinc-950/70
        backdrop-blur-xl
        overflow-hidden
      "
    >

      <div className="divide-y divide-zinc-900">

        <MetaItem
          label="Category"
          value={
            mod.category || "Vehicle"
          }
        />

        <MetaItem
          label="Status"
          value={
            mod.verified
              ? "Verified"
              : "Community"
          }
        />

        <MetaItem
          label="Media"
          value={`${mediaCount} Images`}
        />

        <MetaItem
          label="Creators"
          value={`${creators.length}`}
        />

      </div>

    </div>
  );
}