"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import SearchHero from "@/components/search/SearchHero";
import SearchTabs from "@/components/search/SearchTabs";
import SearchResults from "@/components/search/SearchResults";
import useSearch from "@/app/hooks/useSearch";
import { creationTabs, maxSearchOffset, peopleTabs, readSearchNavigation, searchCategories, searchPageSize, type SearchCategory } from "@/lib/search/navigation";

function SearchContent() {
  const { query, active, people, creations, page } = readSearchNavigation(useSearchParams());
  const supported = active !== "assets" && active !== "projects" ? active : null;
  const results = useSearch(query, supported, page, people);

  function update(values: Record<string, string | null>, replace = false) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(values)) {
      if (value === null || value === "") url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    if (url.href === window.location.href) return;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }

  function selectCategory(category: SearchCategory) {
    if (category !== active) update({ category: category === "all" ? null : category, type: null, page: null });
  }

  const hasNext = supported !== null && supported !== "all"
    && (results?.data?.[supported].length ?? 0) > searchPageSize
    && (page + 1) * searchPageSize <= maxSearchOffset;

  return <>
    <SearchHero query={query} setQuery={q => update({ q, page: null }, true)} />
    <div className="mb-10 space-y-4">
      <SearchTabs active={active} options={searchCategories} label="Search category" onSelect={selectCategory} />
      {active === "people" && <SearchTabs active={people} options={peopleTabs} label="People category" compact
        onSelect={type => { if (type !== people) update({ type: type === "all" ? null : type, page: null }); }} />}
      {active === "creations" && <SearchTabs active={creations} options={creationTabs} label="Creations category" compact
        onSelect={type => { if (type !== creations) update({ type: type === "all" ? null : type, page: null }); }} />}
    </div>
    {!supported ? <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="text-xl font-semibold">{searchCategories[active]}</h2>
      <p className="mt-2 text-sm text-zinc-400">{searchCategories[active]} discovery isn’t available yet.</p>
    </section> : !results ? <p role="status" className="text-zinc-400">Searching…</p>
      : results.error ? <p role="alert" className="text-rose-300">Search is currently unavailable.</p>
      : results.data && <SearchResults data={results.data} active={supported} setActive={selectCategory} />}
    {supported && results && !results.error && (page > 0 || hasNext) &&
      <nav aria-label="Search pages" className="mt-8 flex items-center gap-4 text-sm">
        <button type="button" disabled={page === 0} onClick={() => update({ page: page > 1 ? String(page) : null })}
          className="text-purple-300 hover:underline disabled:opacity-50">Previous</button>
        <span className="text-zinc-400">Page {page + 1}</span>
        <button type="button" disabled={!hasNext} onClick={() => update({ page: String(page + 2) })}
          className="text-purple-300 hover:underline disabled:opacity-50">Next</button>
      </nav>}
  </>;
}

export default function SearchPage() {
  return <main className="min-h-screen bg-[#040404] text-white">
    <Navbar />
    <div className="mx-auto max-w-7xl px-6 py-16">
      <Suspense fallback={<p role="status" className="text-zinc-400">Loading search…</p>}>
        <SearchContent />
      </Suspense>
    </div>
  </main>;
}
