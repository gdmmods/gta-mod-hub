"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, UserRound } from "lucide-react";
import { useState } from "react";

import { useCreatorContext } from "@/app/contexts/CreatorContext";

export default function CreatorProfileSwitcher() {
  const [open, setOpen] = useState(false);
  const {
    activeCreator,
    activeCreatorId,
    creators,
    loading,
    selecting,
    error,
    selectActiveCreator,
  } = useCreatorContext();

  async function handleSelect(creatorId: string) {
    if (await selectActiveCreator(creatorId)) setOpen(false);
  }

  if (loading) {
    return (
      <div
        className="h-11 w-11 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60"
        aria-label="Loading creator profiles"
      />
    );
  }

  if (creators.length === 0) {
    return error ? (
      <span role="status" title={error} className="max-w-40 text-xs text-amber-300">
        Creator selection unavailable
      </span>
    ) : null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label={activeCreator ? `Active Creator: ${activeCreator.name}` : "Choose an Active Creator"}
        aria-expanded={open}
        className="
          group flex h-11 items-center gap-2
          rounded-xl border border-zinc-800
          bg-zinc-900/60 px-2.5
          transition hover:border-purple-500/50
          hover:bg-zinc-800
        "
      >
        {activeCreator?.avatar ? (
          <Image
            src={activeCreator.avatar}
            alt=""
            width={32}
            height={32}
            unoptimized
            className="h-8 w-8 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
            <UserRound size={18} className="text-purple-300" />
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-zinc-500 transition-transform group-hover:text-purple-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close creator selector"
          />

          <div className="absolute right-0 top-full z-50 mt-3 w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="border-b border-zinc-800 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Active Creator
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Creator actions use this profile when permitted.
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {creators.map((creator) => {
                const selected = creator.id === activeCreatorId;

                return (
                  <button
                    key={creator.id}
                    type="button"
                    onClick={() => void handleSelect(creator.id)}
                    aria-pressed={selected}
                    disabled={selecting}
                    className={`
                      flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition disabled:cursor-wait disabled:opacity-60
                      ${selected ? "border-purple-500/20 bg-purple-500/10" : "border-transparent hover:bg-zinc-900"}
                    `}
                  >
                    {creator.avatar ? (
                      <Image
                        src={creator.avatar}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                        <UserRound size={19} className="text-zinc-400" />
                      </span>
                    )}

                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">
                      {creator.name}
                    </span>

                    {selected && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-purple-400/30 bg-purple-500/10 px-2 py-1 text-[10px] font-semibold text-purple-200">
                        <Check size={12} aria-hidden="true" />
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {error && (
              <p role="alert" className="border-t border-red-500/20 px-4 py-3 text-xs text-red-300">
                {error}
              </p>
            )}

            <div className="border-t border-zinc-800 p-3">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-purple-300"
              >
                Manage creator profiles →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
