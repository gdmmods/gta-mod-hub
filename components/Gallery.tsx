"use client";

import { useState } from "react";

type GalleryProps = {
  main: string;
  images: string[];
};

export default function Gallery({ main, images }: GalleryProps) {
  const allImages = [main, ...(images || [])];

  const [selected, setSelected] = useState(main);
  const [open, setOpen] = useState(false);

  const currentIndex = allImages.indexOf(selected);

  const next = () => {
    const nextIndex = (currentIndex + 1) % allImages.length;
    setSelected(allImages[nextIndex]);
  };

  const prev = () => {
    const prevIndex =
      (currentIndex - 1 + allImages.length) % allImages.length;
    setSelected(allImages[prevIndex]);
  };

  return (
    <div>
      {/* MAIN IMAGE */}
      <img
        src={selected}
        alt="Main"
        onClick={() => setOpen(true)}
        className="rounded-xl w-full mb-4 cursor-pointer"
      />

      {/* THUMBNAILS */}
      <div className="flex gap-3 overflow-x-auto">
        {allImages.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Thumbnail ${i}`}
            onClick={() => setSelected(img)}
            className={`h-20 rounded-lg cursor-pointer border-2 ${
              selected === img
                ? "border-purple-500"
                : "border-transparent"
            }`}
          />
        ))}
      </div>

      {/* LIGHTBOX */}
      {open && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 text-white text-2xl"
          >
            ✕
          </button>

          <button
            onClick={prev}
            className="absolute left-6 text-white text-3xl"
          >
            ←
          </button>

          <img
            src={selected}
            alt="Fullscreen"
            className="max-h-[80vh] rounded-xl"
          />

          <button
            onClick={next}
            className="absolute right-6 text-white text-3xl"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}