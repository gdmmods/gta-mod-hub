import Gallery from "@/components/Gallery";

export default function ModHero({
  mod,
  images,
}: any) {
  return (
    <div>
      <Gallery
        main={mod.image}
        images={images}
      />
    </div>
  );
}