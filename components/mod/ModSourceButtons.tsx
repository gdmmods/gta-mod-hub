"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Globe2, X } from "lucide-react";
import CreatorBackupButton from "@/components/mod/CreatorBackupButton";
import { getDisplayableModSources } from "@/lib/connectors/modSourceLinks";
import { buildOutboundClickUrl, type OutboundClickAction } from "@/lib/server/click-analytics";

export type ModAdditionalSource = {
  canonical_url: string;
  platform: {
    slug: string;
    name: string;
  } | null;
};

type Props = {
  modId: string;
  primarySourceUrl?: string | null;
  creatorBackupUrl?: string | null;
  sources: ModAdditionalSource[];
};

function openTrackedSource(modId: string, action: OutboundClickAction, targetUrl: string) {
  window.open(buildOutboundClickUrl({
    origin: window.location.origin,
    modId,
    action,
    targetUrl,
    eventId: window.crypto.randomUUID(),
  }), "_blank", "noopener,noreferrer");
}

const LINK_CLASS = "w-full flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white";
const DISABLED_CLASS = "w-full flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-zinc-900 bg-zinc-950 py-3 text-sm font-medium text-zinc-600";

function safeExternalUrl(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function platformMonogram(source: ModAdditionalSource): string {
  if (source.platform?.slug === "gta5mods") return "G5";
  if (source.platform?.slug === "gtainside") return "GI";
  return (source.platform?.name ?? "Web").replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "↗";
}

export default function ModSourceButtons({ modId, primarySourceUrl, creatorBackupUrl, sources }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const links = getDisplayableModSources(sources);
  const primaryUrl = safeExternalUrl(primarySourceUrl);

  useEffect(() => {
    void fetch("/api/click-session", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(352, Math.max(0, window.innerWidth - 24));
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      let top = rect.bottom + 8;
      if (window.innerHeight - top < 180) top = Math.max(12, rect.top - Math.min(320, rect.top - 24) - 8);
      setPosition({ top, left, width });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    function onPointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !popoverRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key === "Tab" && popoverRef.current) {
        const focusable = [...popoverRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
        if (!focusable.length) {
          event.preventDefault();
          popoverRef.current.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !popoverRef.current.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !popoverRef.current.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !position) return;
    popoverRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled])')?.focus();
  }, [open, position]);

  const popover = open && position && links.length > 0 && typeof document !== "undefined"
    ? createPortal(
        <div
          id="mod-other-sources"
          ref={popoverRef}
          role="dialog"
          aria-label="Other verified source links"
          tabIndex={-1}
          style={{ top: position.top, left: position.left, width: position.width, maxHeight: `calc(100dvh - ${position.top}px - 12px)` }}
          className="fixed z-[1000] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Other Sources</p>
            <button
              type="button"
              onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
              aria-label="Close other sources"
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
          <ul className="space-y-1">
            {links.map((source) => (
              <li key={`${source.platform?.slug}:${source.url}`}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => {
                    event.preventDefault();
                    openTrackedSource(modId, "other_source", source.url);
                  }}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-zinc-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-950 text-[10px] font-bold text-purple-300" aria-hidden="true">
                    {platformMonogram(source)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{source.platform?.name}</span>
                  <ExternalLink size={14} className="shrink-0 text-zinc-500" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="space-y-2">
      {primaryUrl ? (
        <a href={primaryUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => { event.preventDefault(); openTrackedSource(modId, "primary_source", primaryUrl); }} className={`${LINK_CLASS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400`}>
          <ExternalLink size={15} aria-hidden="true" />
          Primary Source
        </a>
      ) : (
        <button type="button" disabled aria-disabled="true" className={DISABLED_CLASS}>
          <ExternalLink size={15} aria-hidden="true" />
          Primary Source
        </button>
      )}

      <CreatorBackupButton url={creatorBackupUrl} modId={modId} />

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={links.length === 0}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="mod-other-sources"
          onClick={() => setOpen((current) => !current)}
          className={`${links.length ? LINK_CLASS : DISABLED_CLASS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950`}
        >
          <Globe2 size={15} aria-hidden="true" />
          Other Sources
          {links.length > 0 && <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{links.length}</span>}
        </button>

      </div>
      {popover}
    </div>
  );
}
