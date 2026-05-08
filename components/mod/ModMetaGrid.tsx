import MetaItem from "./MetaItem";

export default function ModMetaGrid({
  mod,
  creators,
  images,
}: any) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4">

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
        value={`${images.length + 1} Images`}
      />

      <MetaItem
        label="Creators"
        value={`${creators.length}`}
      />

    </div>
  );
}