"use client";

import { useState } from "react";

export default function ModTabs({
  mod,
}: any) {

  const tabs = [
    {
      title: "Overview",
      content:
        mod.description ||
        "No description provided.",
    },

    mod.features && {
      title: "Features",
      content: mod.features,
    },

    mod.requirements && {
      title: "Requirements",
      content: mod.requirements,
    },

    mod.notes && {
      title: "Changelog",
      content: mod.notes,
    },

    mod.credits && {
      title: "Credits",
      content: mod.credits,
    },

  ].filter(Boolean) as any[];

  const [activeTab, setActiveTab] =
    useState(0);

  return (
    <div
      className="
        mt-8
        rounded-3xl
        border
        border-zinc-800
        bg-zinc-900/50
        backdrop-blur-xl
        overflow-hidden
      "
    >

      {/* TAB NAV */}
      <div
        className="
          flex
          gap-2
          overflow-x-auto
          scrollbar-hide
          border-b
          border-zinc-800
          px-4
          pt-4
        "
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
                px-5
                py-3
                rounded-t-2xl
                whitespace-nowrap
                text-sm
                transition-all
                duration-200

                ${
                  active
                    ? `
                      bg-zinc-800
                      text-white
                      shadow-lg
                    `
                    : `
                      text-zinc-400
                      hover:text-white
                      hover:bg-zinc-800/70
                    `
                }
              `}
            >
              {tab.title}
            </button>
          );
        })}

      </div>

      {/* ACTIVE CONTENT */}
      <div className="p-8 min-h-[300px]">

        <div
          key={activeTab}
          className="
            animate-in
            fade-in
            duration-300
          "
        >

          <h2 className="text-3xl font-bold mb-7">
            {tabs[activeTab].title}
          </h2>

          <div className="text-zinc-300 whitespace-pre-line leading-relaxed">

            {tabs[activeTab].title ===
            "Features" ? (

              <ul className="space-y-4">

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
                        className="flex gap-4"
                      >
                        <span className="text-emerald-400">
                          ✔
                        </span>

                        <span>
                          {feature}
                        </span>
                      </li>
                    )
                  )}

              </ul>

            ) : (
              tabs[activeTab].content
            )}

          </div>

        </div>

      </div>

    </div>
  );
}