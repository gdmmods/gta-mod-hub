"use client";

import { useEffect, useState } from "react";

export default function ModHero({
  mod,
  images,
}: {
  mod: any;
  images: string[];
}) {

  const galleryImages = [
    mod.image,
    ...(images || []),
  ].filter(Boolean);

  const uniqueImages = [
    ...new Set(galleryImages),
  ];

  const [selectedImage, setSelectedImage] =
    useState(
      uniqueImages[0] ||
        "/placeholder.jpg"
    );

  const [lightboxOpen, setLightboxOpen] =
    useState(false);

  const currentIndex =
    uniqueImages.indexOf(
      selectedImage
    );

  /* ---------------- NAVIGATION ---------------- */
  const goNext = () => {

    const next =
      (currentIndex + 1) %
      uniqueImages.length;

    setSelectedImage(
      uniqueImages[next]
    );
  };

  const goPrev = () => {

    const prev =
      (
        currentIndex -
        1 +
        uniqueImages.length
      ) %
      uniqueImages.length;

    setSelectedImage(
      uniqueImages[prev]
    );
  };

  /* ---------------- KEYBOARD ---------------- */
  useEffect(() => {

    const handleKey = (
      e: KeyboardEvent
    ) => {

      if (!lightboxOpen) {
        return;
      }

      if (e.key === "Escape") {
        setLightboxOpen(false);
      }

      if (e.key === "ArrowRight") {
        goNext();
      }

      if (e.key === "ArrowLeft") {
        goPrev();
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

  }, [
    lightboxOpen,
    currentIndex,
  ]);

  return (
    <div className="space-y-4">

      {/* HERO */}
      <div
        className="
          group
          relative
          overflow-hidden
          rounded-[32px]
          border
          border-zinc-900
          bg-black
          cursor-pointer
          shadow-[0_0_50px_rgba(168,85,247,0.05)]
        "
        onClick={() =>
          setLightboxOpen(true)
        }
      >

        {/* IMAGE */}
        <img
          src={selectedImage}
          alt={mod.title}
          className="
            w-full
            h-[340px]
            md:h-[420px]
            xl:h-[470px]
            object-cover
            transition-transform
            duration-700
            group-hover:scale-[1.02]
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
            to-black/10
          "
        />

        {/* TOP BAR */}
        <div
          className="
            absolute
            top-4
            left-4
            right-4
            flex
            items-center
            justify-between
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
              rounded-full
              border
              border-white/10
              bg-black/40
              px-3
              py-1.5
              text-[11px]
              uppercase
              tracking-[0.2em]
              text-zinc-300
              backdrop-blur-xl
            "
          >

            <div
              className="
                h-2
                w-2
                rounded-full
                bg-purple-500
              "
            />

            Gallery

          </div>

          <div
            className="
              rounded-full
              border
              border-white/10
              bg-black/40
              px-3
              py-1.5
              text-xs
              text-white
              backdrop-blur-xl
            "
          >
            Expand
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div
          className="
            absolute
            bottom-4
            left-4
            right-4
            flex
            items-center
            justify-between
          "
        >

          <div
            className="
              rounded-full
              border
              border-white/10
              bg-black/40
              px-3
              py-1.5
              text-xs
              text-zinc-300
              backdrop-blur-xl
            "
          >
            {currentIndex + 1} /{" "}
            {uniqueImages.length}
          </div>

          {uniqueImages.length > 1 && (

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <button
                onClick={(e) => {

                  e.stopPropagation();
                  goPrev();

                }}
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/10
                  bg-black/40
                  text-white
                  backdrop-blur-xl
                  transition
                  hover:bg-white/10
                "
              >
                ←
              </button>

              <button
                onClick={(e) => {

                  e.stopPropagation();
                  goNext();

                }}
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/10
                  bg-black/40
                  text-white
                  backdrop-blur-xl
                  transition
                  hover:bg-white/10
                "
              >
                →
              </button>

            </div>

          )}

        </div>

      </div>

      {/* THUMBNAILS */}
      {uniqueImages.length > 1 && (

        <div
          className="
            flex
            gap-3
            overflow-x-auto
            scrollbar-hide
            pb-1
          "
        >

          {uniqueImages.map(
            (image, index) => {

              const active =
                image ===
                selectedImage;

              return (

                <button
                  key={`${image}-${index}`}
                  onClick={() =>
                    setSelectedImage(
                      image
                    )
                  }
                  className={`
                    group/thumb
                    relative
                    shrink-0
                    overflow-hidden
                    rounded-2xl
                    border
                    transition-all
                    duration-300

                    ${
                      active
                        ? `
                          border-purple-500
                          shadow-[0_0_20px_rgba(168,85,247,0.2)]
                        `
                        : `
                          border-zinc-900
                          opacity-70
                          hover:opacity-100
                          hover:border-zinc-700
                        `
                    }
                  `}
                >

                  <img
                    src={image}
                    className="
                      h-[82px]
                      w-[140px]
                      object-cover
                      transition-transform
                      duration-500
                      group-hover/thumb:scale-[1.04]
                    "
                  />

                  <div
                    className={`
                      absolute
                      inset-0
                      transition

                      ${
                        active
                          ? "bg-purple-500/10"
                          : "bg-black/10"
                      }
                    `}
                  />

                </button>

              );
            }
          )}

        </div>

      )}

      {/* TAGS */}
      <div
        className="
          flex
          flex-wrap
          gap-2
        "
      >

        {[
          {
            label: "Add-On",
            icon: "◈",
          },
          {
            label: "FiveM Ready",
            icon: "⚡",
          },
          {
            label: "Optimized",
            icon: "✔",
          },
          {
            label: "High Quality",
            icon: "✦",
          },
        ].map((tag) => (

          <div
            key={tag.label}
            className="
              flex
              items-center
              gap-2
              rounded-full
              border
              border-zinc-800
              bg-zinc-900/70
              px-3
              py-2
              text-xs
              text-zinc-300
              backdrop-blur-xl
            "
          >

            <span className="text-zinc-500">
              {tag.icon}
            </span>

            {tag.label}

          </div>

        ))}

      </div>

      {/* LIGHTBOX */}
      {lightboxOpen && (

        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/95
            backdrop-blur-md
            p-6
          "
          onClick={() =>
            setLightboxOpen(false)
          }
        >

          {/* CLOSE */}
          <button
            className="
              absolute
              top-6
              right-6
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              border
              border-white/10
              bg-white/10
              text-lg
              text-white
              backdrop-blur-xl
              transition
              hover:bg-white/20
            "
          >
            ✕
          </button>

          {/* PREV */}
          {uniqueImages.length > 1 && (

            <button
              onClick={(e) => {

                e.stopPropagation();
                goPrev();

              }}
              className="
                absolute
                left-6
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                border
                border-white/10
                bg-white/10
                text-2xl
                text-white
                backdrop-blur-xl
                transition
                hover:bg-white/20
              "
            >
              ←
            </button>

          )}

          {/* IMAGE */}
          <img
            src={selectedImage}
            alt={mod.title}
            className="
              max-w-[94vw]
              max-h-[90vh]
              rounded-3xl
              object-contain
              shadow-[0_0_80px_rgba(0,0,0,0.5)]
            "
            onClick={(e) =>
              e.stopPropagation()
            }
          />

          {/* NEXT */}
          {uniqueImages.length > 1 && (

            <button
              onClick={(e) => {

                e.stopPropagation();
                goNext();

              }}
              className="
                absolute
                right-6
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                border
                border-white/10
                bg-white/10
                text-2xl
                text-white
                backdrop-blur-xl
                transition
                hover:bg-white/20
              "
            >
              →
            </button>

          )}

        </div>

      )}

    </div>
  );
}