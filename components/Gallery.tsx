"use client";

import { useEffect, useState } from "react";

type GalleryProps = {
  main: string;
  images: string[];
};

export default function Gallery({
  main,
  images,
}: GalleryProps) {
  const allImages = [main, ...(images || [])];

  const [selected, setSelected] = useState(main);
  const [open, setOpen] = useState(false);

  const currentIndex = allImages.indexOf(selected);

  const next = () => {
    const nextIndex =
      (currentIndex + 1) % allImages.length;

    setSelected(allImages[nextIndex]);
  };

  const prev = () => {
    const prevIndex =
      (currentIndex - 1 + allImages.length) %
      allImages.length;

    setSelected(allImages[prevIndex]);
  };

  /* KEYBOARD CONTROLS */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowRight") {
        next();
      }

      if (e.key === "ArrowLeft") {
        prev();
      }

      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () =>
      window.removeEventListener(
        "keydown",
        handleKey
      );
  }, [open, currentIndex]);

  return (
    <div className="w-full">

      {/* MAIN IMAGE */}
      <div className="relative group">
        <img
          src={selected}
          alt="Main"
          onClick={() => setOpen(true)}
          className="
            rounded-2xl
            w-full
            h-[420px]
            object-cover
            cursor-pointer
            border
            border-zinc-800
            shadow-2xl
            transition
            duration-300
            group-hover:opacity-95
          "
        />

        {/* IMAGE COUNT */}
        <div
          className="
            absolute
            bottom-4
            right-4
            bg-black/70
            backdrop-blur-md
            border
            border-zinc-700
            px-3
            py-1
            rounded-full
            text-xs
            text-gray-300
          "
        >
          {currentIndex + 1} / {allImages.length}
        </div>
      </div>

      {/* THUMBNAILS */}
      <div
        className="
          flex
          gap-3
          overflow-x-auto
          scrollbar-hide
          mt-3
          pb-1
        "
      >
        {allImages.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelected(img)}
            className="
              relative
              flex-shrink-0
              outline-none
            "
          >
            <img
              src={img}
              alt={`Thumbnail ${i}`}
              className={`
                h-20
                w-36
                object-cover
                rounded-xl
                border-2
                transition
                duration-200
                ${
                  selected === img
                    ? "border-purple-500 scale-[1.02]"
                    : "border-zinc-800 hover:border-zinc-600"
                }
              `}
            />
          </button>
        ))}
      </div>

      {/* LIGHTBOX */}
      {open && (
        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/95
            backdrop-blur-md
            flex
            items-center
            justify-center
            p-6
          "
        >

          {/* CLOSE */}
          <button
            onClick={() => setOpen(false)}
            className="
              absolute
              top-6
              right-6
              w-12
              h-12
              rounded-full
              bg-black/60
              border
              border-zinc-700
              text-white
              text-xl
              hover:bg-zinc-900
              transition
              z-50
            "
          >
            ✕
          </button>

          {/* PREV */}
          <button
            onClick={prev}
            className="
              absolute
              left-6
              top-1/2
              -translate-y-1/2
              w-14
              h-14
              rounded-full
              bg-black/60
              backdrop-blur-md
              border
              border-zinc-700
              text-white
              text-2xl
              hover:bg-zinc-900
              transition
              z-50
            "
          >
            ←
          </button>

          {/* IMAGE */}
          <div className="relative max-w-[92vw]">
            <img
              src={selected}
              alt="Fullscreen"
              className="
                max-h-[88vh]
                max-w-full
                rounded-2xl
                shadow-2xl
                border
                border-zinc-800
                object-contain
              "
            />

            {/* COUNTER */}
            <div
              className="
                absolute
                bottom-4
                left-1/2
                -translate-x-1/2
                bg-black/70
                border
                border-zinc-700
                backdrop-blur-md
                px-4
                py-2
                rounded-full
                text-sm
                text-gray-300
              "
            >
              {currentIndex + 1} / {allImages.length}
            </div>
          </div>

          {/* NEXT */}
          <button
            onClick={next}
            className="
              absolute
              right-6
              top-1/2
              -translate-y-1/2
              w-14
              h-14
              rounded-full
              bg-black/60
              backdrop-blur-md
              border
              border-zinc-700
              text-white
              text-2xl
              hover:bg-zinc-900
              transition
              z-50
            "
          >
            →
          </button>

        </div>
      )}
    </div>
  );
}