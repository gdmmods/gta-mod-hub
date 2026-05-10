"use client";

import { useEffect, useState } from "react";

export default function ModTabs({
  mod,
}: any) {

  const tabs = [
    {
      title: "Overview",
      icon: "◈",
      content:
        mod.description ||
        "No description provided.",
    },

    mod.features && {
      title: "Features",
      icon: "✔",
      content: mod.features,
    },

    mod.requirements && {
      title: "Requirements",
      icon: "⚡",
      content: mod.requirements,
    },

    mod.notes && {
      title: "Changelog",
      icon: "↺",
      content: mod.notes,
    },

    mod.credits && {
      title: "Credits",
      icon: "✦",
      content: mod.credits,
    },

  ].filter(Boolean) as any[];

  const [activeTab, setActiveTab] =
    useState(0);

  const [isSticky, setIsSticky] =
    useState(false);

  /* ---------------------------------
     STICKY DETECTION
  --------------------------------- */
  useEffect(() => {

    const handleScroll = () => {

      setIsSticky(
        window.scrollY > 620
      );

    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );

  }, []);

  return (
    <div
      className="
        overflow-hidden
        rounded-[30px]
        border
        border-zinc-900
        bg-gradient-to-b
        from-zinc-950/90
        to-black/60
        backdrop-blur-2xl
      "
    >

      {/* TOP NAV */}
      <div
        className={`
          z-20
          flex
          items-center
          gap-2
          overflow-x-auto
          border-b
          border-zinc-900
          px-4
          py-4
          transition-all
          duration-300

          ${
            isSticky
              ? `
                sticky
                top-0
                bg-black/90
                backdrop-blur-2xl
                shadow-[0_10px_40px_rgba(0,0,0,0.6)]
              `
              : `
                bg-black/30
                backdrop-blur-xl
              `
          }
        `}
      >

        {tabs.map((tab, i) => {

          const active =
            activeTab === i;

          return (

            <button
              key={i}
              onClick={() =>
                setActiveTab(i)
              }
              className={`
                group
                relative
                flex
                items-center
                gap-2
                whitespace-nowrap
                rounded-2xl
                px-5
                py-3
                text-sm
                transition-all
                duration-300

                ${
                  active
                    ? `
                      bg-white
                      text-black
                      shadow-[0_0_25px_rgba(255,255,255,0.08)]
                    `
                    : `
                      bg-zinc-900/40
                      text-zinc-500
                      hover:bg-zinc-800
                      hover:text-white
                    `
                }
              `}
            >

              <span
                className={`
                  text-xs
                  transition-opacity

                  ${
                    active
                      ? "opacity-100"
                      : "opacity-60 group-hover:opacity-100"
                  }
                `}
              >
                {tab.icon}
              </span>

              <span
                className={`
                  ${
                    active
                      ? "font-semibold"
                      : "font-medium"
                  }
                `}
              >
                {tab.title}
              </span>

            </button>

          );
        })}

      </div>

      {/* CONTENT */}
      <div
        className="
          p-6
          md:p-8
        "
      >

        <div
          key={activeTab}
          className="
            animate-in
            fade-in
            duration-300
          "
        >

          {/* HEADER */}
          <div
            className="
              flex
              items-center
              gap-3
              mb-6
            "
          >

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-900
                text-sm
                text-zinc-300
              "
            >
              {tabs[activeTab].icon}
            </div>

            <div>

              <h2
                className="
                  text-2xl
                  md:text-3xl
                  font-bold
                  tracking-tight
                "
              >
                {tabs[activeTab].title}
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-zinc-500
                "
              >
                Mod information and details
              </p>

            </div>

          </div>

          {/* CONTENT */}
          <div
            className="
              text-[15px]
              leading-8
              text-zinc-400
              whitespace-pre-line
            "
          >

            {tabs[activeTab].title ===
            "Features" ? (

              <ul
                className="
                  grid
                  gap-4
                "
              >

                {tabs[
                  activeTab
                ].content
                  .split("\n")
                  .filter(Boolean)
                  .map(
                    (
                      feature: string,
                      i: number
                    ) => (

                      <li
                        key={i}
                        className="
                          flex
                          items-start
                          gap-4
                          rounded-2xl
                          border
                          border-zinc-900
                          bg-zinc-950/70
                          p-4
                        "
                      >

                        <div
                          className="
                            mt-[2px]
                            flex
                            h-6
                            w-6
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-emerald-500/10
                            text-xs
                            text-emerald-400
                          "
                        >
                          ✔
                        </div>

                        <span className="text-zinc-300">
                          {feature}
                        </span>

                      </li>

                    )
                  )}

              </ul>

            ) : (

              <div
                className="
                  rounded-3xl
                  border
                  border-zinc-900
                  bg-zinc-950/50
                  p-6
                "
              >

                <div className="space-y-5">
                  {tabs[activeTab].content}
                </div>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}