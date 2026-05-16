"use client";

import { useState } from "react";

import Navbar from "@/components/layout/Navbar";

import SearchHero from "@/components/search/SearchHero";
import SearchTabs from "@/components/search/SearchTabs";
import SearchResults from "@/components/search/SearchResults";

import useSearch from "@/app/hooks/useSearch";

export default function SearchPage() {

  const [query, setQuery] =
    useState("");

  const [active, setActive] =
    useState("all");

  const {

    mods,
    creators,
    loading,

  } = useSearch(query);

  return (

    <main
      className="
        min-h-screen
        bg-[#040404]
        text-white
      "
    >

      <Navbar />

      <div
        className="
          max-w-7xl
          mx-auto
          px-6
          py-16
        "
      >

        {/* HERO */}
        <SearchHero
          query={query}
          setQuery={setQuery}
        />

        {/* TABS */}
        <SearchTabs
          active={active}
          setActive={setActive}
        />

        {/* LOADING */}
        {loading && (

          <div
            className="
              text-zinc-500
            "
          >
            Searching...
          </div>

        )}

        {/* RESULTS */}
        {!loading && (

          <SearchResults
            mods={mods}
            creators={creators}
            active={active}
          />

        )}

      </div>

    </main>

  );

}