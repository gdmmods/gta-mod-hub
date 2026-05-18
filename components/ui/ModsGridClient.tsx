"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

import ModCard from "@/components/mod/ModCard";
import { getCreators } from "@/lib/getCreators";

type Creator = {
  id: string;
  name: string;
};

type Mod = {
  id: string;
  title: string;
  image: string;
  category?: string;
  description?: string;
  likes?: number;
  downloads?: number;
  source_url?: string;
  verified?: boolean;

  mod_creators?: {
    creators: Creator;
  }[];
};

export default function ModsGridClient({
  mods,
  showSearch = true,
}: {
  mods: Mod[];
  showSearch?: boolean;
}) {

  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null);

  const [likesMap, setLikesMap] =
    useState<Record<string, number>>({});

  const [downloadsMap, setDownloadsMap] =
    useState<Record<string, number>>({});

  const [search, setSearch] =
    useState("");

  const touchStartX =
    useRef<number | null>(null);

  /* ---------------- SEARCH ---------------- */
  const filteredMods = mods.filter((mod) => {

    const query =
      search.toLowerCase();

    return (
      mod.title
        ?.toLowerCase()
        .includes(query) ||

      mod.category
        ?.toLowerCase()
        .includes(query) ||

      mod.description
        ?.toLowerCase()
        .includes(query)
    );
  });

  /* ---------------- SELECTED ---------------- */
  const selectedMod =
    selectedIndex !== null
      ? filteredMods[selectedIndex]
      : null;

  const selectedCreators: Creator[] =
    selectedMod
      ? getCreators(selectedMod)
      : [];

  /* ---------------- KEYBOARD ---------------- */
  useEffect(() => {

    const handleKey = (
      e: KeyboardEvent
    ) => {

      if (
        selectedIndex === null
      ) {
        return;
      }

      if (e.key === "Escape") {
        setSelectedIndex(null);
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

  }, [selectedIndex]);

  /* ---------------- SCROLL LOCK ---------------- */
  useEffect(() => {

    document.body.style.overflow =
      selectedIndex !== null
        ? "hidden"
        : "auto";

  }, [selectedIndex]);

  /* ---------------- NAVIGATION ---------------- */
  const goNext = () => {

    if (selectedIndex === null) {
      return;
    }

    setSelectedIndex((prev) =>
      prev !== null
        ? (prev + 1) %
          filteredMods.length
        : 0
    );
  };

  const goPrev = () => {

    if (selectedIndex === null) {
      return;
    }

    setSelectedIndex((prev) =>
      prev !== null
        ? (
            prev -
            1 +
            filteredMods.length
          ) %
            filteredMods.length
        : 0
    );
  };

  /* ---------------- SWIPE ---------------- */
  const handleTouchStart = (
    e: React.TouchEvent
  ) => {

    touchStartX.current =
      e.touches[0].clientX;

  };

  const handleTouchEnd = (
    e: React.TouchEvent
  ) => {

    if (
      touchStartX.current === null
    ) {
      return;
    }

    const delta =
      e.changedTouches[0].clientX -
      touchStartX.current;

    if (delta > 60) {
      goPrev();
    }

    if (delta < -60) {
      goNext();
    }

    touchStartX.current = null;
  };

  /* ---------------- LIKE ---------------- */
  const handleLike = async (
    id: string
  ) => {

    const current =
      likesMap[id] !== undefined
        ? likesMap[id]
        : mods.find(
            (m) => m.id === id
          )?.likes || 0;

    setLikesMap((prev) => ({
      ...prev,
      [id]: current + 1,
    }));

    try {

      await fetch("/api/like", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      });

    } catch {

      setLikesMap((prev) => ({
        ...prev,
        [id]: current,
      }));

    }
  };

  /* ---------------- DOWNLOAD ---------------- */
  const handleDownload = async (
    id: string,
    source_url?: string
  ) => {

    const current =
      downloadsMap[id] !== undefined
        ? downloadsMap[id]
        : mods.find(
            (m) => m.id === id
          )?.downloads || 0;

    setDownloadsMap((prev) => ({
      ...prev,
      [id]: current + 1,
    }));

    try {

      await fetch(
        "/api/download",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id,
          }),
        }
      );

    } catch {

      setDownloadsMap((prev) => ({
        ...prev,
        [id]: current,
      }));

    }

    if (source_url) {

      window.open(
        source_url,
        "_blank",
        "noopener,noreferrer"
      );

    }
  };

  /* ---------------- MODAL VALUES ---------------- */
  const selectedLikes =
    selectedMod
      ? likesMap[selectedMod.id] !==
        undefined
        ? likesMap[selectedMod.id]
        : selectedMod.likes || 0
      : 0;

  const selectedDownloads =
    selectedMod
      ? downloadsMap[
          selectedMod.id
        ] !== undefined
        ? downloadsMap[
            selectedMod.id
          ]
        : selectedMod.downloads ||
          0
      : 0;

  return (
    <>

      {/* SEARCH */}
      {showSearch && (

        <div className="max-w-6xl mx-auto px-6 mt-10">

          <div
            className="
              flex
              items-center
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-900/70
              overflow-hidden
            "
          >

            <div className="px-4 text-zinc-500">
              🔍
            </div>

            <input
              type="text"
              placeholder="Search mods, categories..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="
                w-full
                bg-transparent
                px-2
                py-4
                text-sm
                outline-none
                placeholder:text-zinc-500
              "
            />

          </div>

        </div>

      )}

      {/* GRID */}
      <div
        className="
          max-w-7xl
          mx-auto
          px-6
          mt-8
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-4
          gap-5
        "
      >

        {filteredMods.length === 0 ? (

          <div className="col-span-full text-center py-20 text-zinc-500">

            No matching mods found.

          </div>

        ) : (

          filteredMods
            .filter(
              (mod) =>
                mod && mod.id
            )
            .map((mod, index) => {

              const likes =
                likesMap[
                  mod.id
                ] !== undefined
                  ? likesMap[
                      mod.id
                    ]
                  : mod.likes || 0;

              const downloads =
                downloadsMap[
                  mod.id
                ] !== undefined
                  ? downloadsMap[
                      mod.id
                    ]
                  : mod.downloads ||
                    0;

              return (

                <ModCard
                  key={mod.id}
                  mod={mod}
                  likes={likes}
                  downloads={
                    downloads
                  }
                  onLike={() =>
                    handleLike(
                      mod.id
                    )
                  }
                  onOpen={() =>
                    setSelectedIndex(
                      index
                    )
                  }
                  onDownload={() =>
                    handleDownload(
                      mod.id,
                      mod.source_url
                    )
                  }
                />

              );
            })

        )}

      </div>

      {/* MODAL */}
      {selectedMod && (

        <div
          className="
            fixed
            inset-0
            bg-black/70
            backdrop-blur-sm
            flex
            items-center
            justify-center
            z-50
          "
          onClick={() =>
            setSelectedIndex(null)
          }
        >

          <div
            className="
              bg-neutral-900
              rounded-xl
              max-w-lg
              w-full
              p-6
              relative
            "
            onClick={(e) =>
              e.stopPropagation()
            }
            onTouchStart={
              handleTouchStart
            }
            onTouchEnd={
              handleTouchEnd
            }
          >

            <button
              onClick={() =>
                setSelectedIndex(null)
              }
              className="
                absolute
                top-3
                right-3
                text-gray-400
                hover:text-white
              "
            >
              ✕
            </button>

            <div className="relative mb-4">

              <img
                src={
                  selectedMod.image
                }
                className="w-full rounded-lg"
              />

            </div>

            <h2 className="text-lg font-semibold">
              {selectedMod.title}
            </h2>

            <p className="text-sm text-gray-400 mt-1">

              {selectedMod.category ||
                "Unknown"}{" "}
              •{" "}

              {selectedCreators.map(
                (c, i) => (

                  <span
                    key={
                      c.id ||
                      `${c.name}-${i}`
                    }
                  >

                    <Link
                      href={`/creator/${c.id}`}
                      className="
                        text-purple-400
                        hover:underline
                      "
                    >
                      {c.name}
                    </Link>

                    {i <
                      selectedCreators.length -
                        1 &&
                      " • "}

                  </span>

                )
              )}

            </p>

            <div className="mt-5 flex gap-3">

              <button
                onClick={() =>
                  handleLike(
                    selectedMod.id
                  )
                }
                className="
                  bg-pink-600
                  text-white
                  px-4
                  py-2
                  rounded-lg
                  text-sm
                "
              >
                ❤️ {selectedLikes}
              </button>

              <button
                onClick={() =>
                  handleDownload(
                    selectedMod.id,
                    selectedMod.source_url
                  )
                }
                className="
                  bg-white
                  text-black
                  px-4
                  py-2
                  rounded-lg
                  text-sm
                "
              >
                ⬇{" "}
                {
                  selectedDownloads
                }
              </button>

              <Link
                href={`/mods/${selectedMod.id}`}
                className="
                  bg-neutral-800
                  text-white
                  px-4
                  py-2
                  rounded-lg
                  text-sm
                "
              >
                Open Page
              </Link>

            </div>

          </div>

        </div>

      )}

    </>
  );
}