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

  const allImages = [
    main,
    ...(images || []),
  ];

  const [selected, setSelected] =
    useState(main);

  const [open, setOpen] =
    useState(false);

  const currentIndex =
    allImages.indexOf(selected);

  /* -----------------------------
     NAVIGATION
  ----------------------------- */
  const next = () => {
    const nextIndex =
      (currentIndex + 1) %
      allImages.length;

    setSelected(
      allImages[nextIndex]
    );
  };

  const prev = () => {
    const prevIndex =
      (currentIndex -
        1 +
        allImages.length) %
      allImages.length;

    setSelected(
      allImages[prevIndex]
    );
  };

  /* -----------------------------
     KEYBOARD CONTROLS
  ----------------------------- */
  useEffect(() => {

    const handleKey = (
      e: KeyboardEvent
    ) => {

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

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKey
      );

  }, [open, currentIndex]);

  return (
    <div className="w-full">

      {/* MAIN IMAGE */}
      <div className="relative group overflow-hidden rounded-3xl">

        {/* IMAGE */}
        <img
          src={selected}
          alt="Main"
          onClick={() => setOpen(true)}
          className="
            rounded-3xl
            w-full
            h-[520px]
            object-cover
            cursor-pointer
            border
            border-zinc-800
            shadow-2xl
            transition-all
            duration-500
            group-hover:scale-[1.01]
            group-hover:opacity-95
          "
        />

        {/* OVERLAY */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-t
            from-black/40
            via-transparent
            to-transparent
            opacity-0
            group-hover:opacity-100
            transition
            duration-300
            pointer-events-none
          "
        />

        {/* EXPAND HINT */}
        <div
          className="
            absolute
            top-4
            right-4
            bg-black/60
            backdrop-blur-md
            border
            border-zinc-700
            px-4
            py-2
            rounded-full
            text-xs
            text-zinc-300
            opacity-0
            group-hover:opacity-100
            transition
            duration-300
          "
        >
          Click to expand
        </div>

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
            py-1.5
            rounded-full
            text-xs
            text-zinc-300
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
    mt-4
    pb-1
  "
>

        {allImages.map((img, i) => {

          const active =
            selected === img;

          return (
            <button
              key={i}
              onClick={() =>
                setSelected(img)
              }
              className="
                relative
                flex-shrink-0
                outline-none
                group
              "
            >

              <img
                src={img}
                alt={`Thumbnail ${i}`}
                className={`
                  h-24
                  w-40
                  object-cover
                  rounded-2xl
                  border-2
                  transition-all
                  duration-300

                  ${
                    active
                      ? `
                        border-purple-500
                        scale-[1.02]
                        shadow-lg
                      `
                      : `
                        border-zinc-800
                        hover:border-zinc-600
                        hover:scale-[1.01]
                      `
                  }
                `}
              />

              {/* ACTIVE GLOW */}
              {active && (
                <div
                  className="
                    absolute
                    inset-0
                    rounded-2xl
                    ring-2
                    ring-purple-500/40
                    pointer-events-none
                  "
                />
              )}

            </button>
          );
        })}

      </div>

      {/* LIGHTBOX */}
      {open && (
        <div
          className="
            fixed
            inset-0
            z-[999]
            bg-black/95
            backdrop-blur-xl
            flex
            items-center
            justify-center
            p-6
            animate-in
            fade-in
            duration-200
          "
        >

          {/* CLOSE */}
          <button
            onClick={() =>
              setOpen(false)
            }
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
          <div
            className="
              relative
              max-w-[94vw]
              animate-in
              zoom-in-95
              duration-300
            "
          >

            <img
              src={selected}
              alt="Fullscreen"
              className="
                max-h-[88vh]
                max-w-full
                rounded-3xl
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
                text-zinc-300
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