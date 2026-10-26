"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface CreatorProfile {
  id: string;
  name: string;
  avatar: string | null;
  status: string;
}

const STORAGE_KEY = "modvault-active-creator";

export default function CreatorProfileSwitcher() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [activeCreatorId, setActiveCreatorId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCreators() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          if (!cancelled) {
            setCreators([]);
            setActiveCreatorId(null);
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("default_creator_id")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        const { data: memberships, error: membershipError } = await supabase
          .from("creator_members")
          .select(`
            creator_id,
            status,
            creators (
              id,
              name,
              avatar,
              status
            )
          `)
          .eq("profile_id", user.id)
          .eq("status", "approved");

        if (membershipError) throw membershipError;

        const availableCreators: CreatorProfile[] = (memberships ?? [])
            .flatMap((membership: any) => {
                const relation = membership.creators;
                const creator = Array.isArray(relation)
                ? relation[0]
                : relation;

                if (!creator) return [];

                return [
                {
                    id: creator.id,
                    name: creator.name,
                    avatar: creator.avatar ?? null,
                    status: creator.status,
                } satisfies CreatorProfile,
                ];
            })
            .filter(
                (creator, index, all) =>
                all.findIndex((item) => item.id === creator.id) === index
            );

        const savedCreatorId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(STORAGE_KEY)
            : null;

        const selectedCreatorId =
          availableCreators.find((creator) => creator.id === savedCreatorId)?.id ??
          availableCreators.find(
            (creator) => creator.id === profile.default_creator_id
          )?.id ??
          availableCreators[0]?.id ??
          null;

        if (!cancelled) {
          setCreators(availableCreators);
          setActiveCreatorId(selectedCreatorId);
        }
      } catch (error) {
        console.error("Could not load creator profiles:", error);

        if (!cancelled) {
          setCreators([]);
          setActiveCreatorId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCreators();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function selectCreator(creatorId: string) {
    setActiveCreatorId(creatorId);
    window.localStorage.setItem(STORAGE_KEY, creatorId);
    window.dispatchEvent(
      new CustomEvent("modvault:creator-changed", {
        detail: { creatorId },
      })
    );
    setOpen(false);
  }

  const activeCreator = creators.find(
    (creator) => creator.id === activeCreatorId
  );

  if (loading) {
    return (
      <div
        className="h-11 w-11 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60"
        aria-label="Loading creator profiles"
      />
    );
  }

  if (creators.length === 0) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Switch creator profile"
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
          <span className="
            flex h-8 w-8 items-center justify-center
            rounded-lg border border-purple-500/20
            bg-purple-500/10
          ">
            <UserRound size={18} className="text-purple-300" />
          </span>
        )}

        <ChevronDown
          size={14}
          className={`
            text-zinc-500 transition-transform
            group-hover:text-purple-300
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="
            absolute right-0 top-full z-50 mt-3
            w-[min(320px,calc(100vw-24px))]
            overflow-hidden rounded-2xl
            border border-zinc-800
            bg-zinc-950 shadow-2xl
          ">
            <div className="border-b border-zinc-800 px-4 py-3">
              <p className="
                text-[10px] font-semibold uppercase
                tracking-[0.2em] text-zinc-500
              ">
                Creator profiles
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Switch your active creator
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {creators.map((creator) => {
                const selected = creator.id === activeCreatorId;

                return (
                  <button
                    key={creator.id}
                    type="button"
                    onClick={() => selectCreator(creator.id)}
                    aria-pressed={selected}
                    className={`
                      flex w-full items-center gap-3
                      rounded-xl px-3 py-3 text-left
                      transition
                      ${selected
                        ? "border border-purple-500/20 bg-purple-500/10"
                        : "border border-transparent hover:bg-zinc-900"
                      }
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
                      <span className="
                        flex h-10 w-10 shrink-0
                        items-center justify-center
                        rounded-xl border border-zinc-800
                        bg-zinc-900
                      ">
                        <UserRound size={19} className="text-zinc-400" />
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className={`
                        block truncate text-sm font-medium
                        ${selected ? "text-purple-200" : "text-zinc-200"}
                      `}>
                        {creator.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        Creator profile
                      </span>
                    </span>

                    {selected && (
                      <Check size={17} className="shrink-0 text-purple-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-zinc-800 p-3">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="
                  block rounded-lg px-3 py-2
                  text-sm text-zinc-400
                  transition hover:bg-zinc-900
                  hover:text-purple-300
                "
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
