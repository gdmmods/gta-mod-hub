"use client";

import {
  useEffect,
  useState,
} from "react";

import { createPortal } from "react-dom";

type Props = {
  url: string;
  id: string;
};

export default function DownloadButton({
  url,
  id,
}: Props) {

  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownload =
    async () => {

      setLoading(true);

      try {

        await fetch("/api/download", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id,
          }),
        });

      } catch (err) {

        console.error(
          "Download tracking failed",
          err
        );

      }

      window.open(
        url,
        "_blank"
      );

      setLoading(false);
      setOpen(false);

    };

  return (
    <>
      {/* BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="
          w-full
          flex
          items-center
          justify-center
          gap-2
          bg-gradient-to-r
          from-purple-600
          to-purple-500
          hover:opacity-90
          transition
          text-white
          font-semibold
          py-4
          rounded-2xl
          shadow-lg
        "
      >
        ⬇ Download
      </button>

      {/* MODAL */}
      {mounted &&
        open &&
        createPortal(

          <div
            className="
              fixed
              inset-0
              z-[999999]
              flex
              items-center
              justify-center
              bg-black/80
              backdrop-blur-md
              p-4
            "
          >

            {/* PANEL */}
            <div
              className="
                relative
                w-full
                max-w-3xl
                rounded-[32px]
                border
                border-zinc-800
                bg-gradient-to-b
                from-zinc-950
                to-black
                p-6
                shadow-[0_0_60px_rgba(168,85,247,0.15)]
              "
            >

              {/* CLOSE */}
              <button
                onClick={() =>
                  setOpen(false)
                }
                className="
                  absolute
                  top-5
                  right-5
                  w-10
                  h-10
                  rounded-full
                  border
                  border-zinc-800
                  bg-zinc-900
                  hover:bg-zinc-800
                  transition
                  text-zinc-400
                "
              >
                ✕
              </button>

              {/* HEADER */}
              <div className="pr-14">

                <p
                  className="
                    text-[11px]
                    uppercase
                    tracking-[0.25em]
                    text-purple-400
                  "
                >
                  Download Center
                </p>

                <h2
                  className="
                    text-3xl
                    font-bold
                    mt-3
                  "
                >
                  Prepare Download
                </h2>

                <p
                  className="
                    mt-3
                    text-zinc-400
                    leading-relaxed
                  "
                >
                  Review installation
                  details and compatibility
                  information before
                  continuing to the
                  original creator source.
                </p>

              </div>

              {/* GRID */}
              <div
                className="
                  mt-8
                  grid
                  md:grid-cols-2
                  gap-5
                "
              >

                {/* INSTALL */}
                <div
                  className="
                    rounded-3xl
                    border
                    border-zinc-900
                    bg-zinc-950/70
                    p-5
                  "
                >

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-white
                    "
                  >
                    Installation Notes
                  </p>

                  <div className="mt-5 space-y-4">

                    {[
                      "Download the archive",
                      "Extract files",
                      "Move files into GTA V / FiveM directory",
                      "Read included documentation",
                    ].map((item, i) => (

                      <div
                        key={item}
                        className="
                          flex
                          items-start
                          gap-3
                        "
                      >

                        <div
                          className="
                            mt-[2px]
                            flex
                            h-6
                            w-6
                            items-center
                            justify-center
                            rounded-full
                            bg-purple-500/10
                            text-xs
                            text-purple-300
                          "
                        >
                          {i + 1}
                        </div>

                        <span
                          className="
                            text-sm
                            text-zinc-400
                          "
                        >
                          {item}
                        </span>

                      </div>

                    ))}

                  </div>

                </div>

                {/* COMPATIBILITY */}
                <div
                  className="
                    rounded-3xl
                    border
                    border-zinc-900
                    bg-zinc-950/70
                    p-5
                  "
                >

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-white
                    "
                  >
                    Compatibility
                  </p>

                  <div className="mt-5 space-y-3">

                    {[
                      {
                        label:
                          "Game",
                        value:
                          "Grand Theft Auto V",
                      },
                      {
                        label:
                          "Platform",
                        value:
                          "PC / FiveM",
                      },
                      {
                        label:
                          "Install Type",
                        value:
                          "Add-On",
                      },
                      {
                        label:
                          "Status",
                        value:
                          "Verified Compatible",
                      },
                    ].map((item) => (

                      <div
                        key={item.label}
                        className="
                          flex
                          items-center
                          justify-between
                          rounded-2xl
                          border
                          border-zinc-900
                          bg-black/30
                          px-4
                          py-3
                        "
                      >

                        <span
                          className="
                            text-sm
                            text-zinc-500
                          "
                        >
                          {item.label}
                        </span>

                        <span
                          className="
                            text-sm
                            font-medium
                            text-zinc-200
                          "
                        >
                          {item.value}
                        </span>

                      </div>

                    ))}

                  </div>

                </div>

              </div>

              {/* NOTICE */}
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-purple-500/10
                  bg-purple-500/5
                  px-5
                  py-4
                "
              >

                <p
                  className="
                    text-sm
                    text-purple-200
                  "
                >
                  You are about to visit
                  the original creator
                  source to download this
                  mod.
                </p>

              </div>

              {/* ACTIONS */}
              <div
                className="
                  mt-8
                  flex
                  flex-col-reverse
                  sm:flex-row
                  items-center
                  justify-between
                  gap-4
                "
              >

                <button
                  onClick={() =>
                    setOpen(false)
                  }
                  className="
                    w-full
                    sm:w-auto
                    px-5
                    py-3
                    rounded-2xl
                    border
                    border-zinc-800
                    bg-zinc-900
                    hover:bg-zinc-800
                    transition
                    text-zinc-300
                  "
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleDownload
                  }
                  disabled={loading}
                  className="
                    w-full
                    sm:w-auto
                    px-6
                    py-3
                    rounded-2xl
                    bg-gradient-to-r
                    from-purple-600
                    to-purple-500
                    hover:opacity-90
                    transition
                    font-semibold
                    text-white
                    shadow-lg
                  "
                >
                  {loading
                    ? "Preparing..."
                    : "Continue to Download"}
                </button>

              </div>

            </div>

          </div>,

          document.body
        )}
    </>
  );
}