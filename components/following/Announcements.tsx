"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";

type Item = {
  id: string; kind: "announcement" | "version"; title: string; body: string; version: string | null;
  author: string; published_at: string; edited_at: string | null; notified: boolean | null;
};
type Draft = { title: string; body: string; version: string; kind: Item["kind"]; notify: boolean };
const empty: Draft = { title: "", body: "", version: "", kind: "announcement", notify: false };
const field = "w-full rounded-xl border border-zinc-800 bg-black p-3 text-white";
const link = "text-sm text-purple-300 hover:underline disabled:opacity-50";
const uuid = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
const pageSize = 12;

export default function Announcements({ id, mod = false, compact = false }: { id: string; mod?: boolean; compact?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [canPublish, setCanPublish] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const requestId = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [openVersion, setOpenVersion] = useState(false);

  useEffect(() => {
    function readLocation() {
      const anchor = window.location.hash.slice(1);
      const key = anchor.startsWith("announcement-") ? anchor.slice(13) : "";
      setFocus(uuid.test(key) ? key : null);
      setOpenVersion(mod && new URLSearchParams(window.location.search).get("compose") === "version");
    }
    readLocation();
    window.addEventListener("hashchange", readLocation);
    window.addEventListener("popstate", readLocation);
    return () => {
      window.removeEventListener("hashchange", readLocation);
      window.removeEventListener("popstate", readLocation);
    };
  }, [mod]);

  const load = useCallback(async (offset: number, focusedId: string | null) => {
    const { data, error } = await supabase.rpc("list_announcements", {
      p_target: id, p_mod: mod, p_limit: pageSize + 1, p_offset: focusedId ? 0 : offset,
      ...(focusedId ? { p_focus: focusedId } : {}),
    });
    if (error) throw error;
    const entries = (data.items ?? []) as Item[];
    return { canPublish: Boolean(data.canPublish), items: entries.slice(0, pageSize), hasMore: entries.length > pageSize };
  }, [id, mod]);

  useEffect(() => {
    let current = true;
    void load(page * pageSize, focus).then(result => {
      if (!current) return;
      setItems(result.items);
      setHasMore(result.hasMore);
      setCanPublish(result.canPublish);
      setLoaded(true);
      setError("");
      if (result.canPublish && openVersion) setDraft(previous => previous ?? { ...empty, kind: "version" });
    }, () => {
      if (!current) return;
      setLoaded(true);
      setError("Updates are currently unavailable.");
    });
    return () => { current = false; };
  }, [load, page, focus, openVersion]);

  useEffect(() => {
    if (!focus || !items.some(item => item.id === focus)) return;
    document.getElementById("announcement-" + focus)?.scrollIntoView({ block: "start" });
  }, [focus, items]);

  function closeDraft() {
    setDraft(null);
    setEditing(null);
    requestId.current = null;
  }

  async function save(action: "publish" | "edit" | "archive", itemId?: string) {
    if (busy) return;
    requestId.current ??= crypto.randomUUID();
    setBusy(true);
    setError("");
    const { error } = await supabase.rpc("write_announcement", {
      p_action: action, p_target: id, p_mod: mod,
      p_id: itemId ?? editing ?? requestId.current,
      p_kind: draft?.kind, p_title: draft?.title, p_body: draft?.body,
      p_version: draft?.kind === "version" ? draft.version : null,
      p_notify: action === "publish" && Boolean(draft?.notify),
    });
    if (error) {
      setBusy(false);
      setError("Could not save this entry. Check your permissions and try again.");
      return;
    }
    closeDraft();
    try {
      const result = await load(page * pageSize, focus);
      setItems(result.items);
      setHasMore(result.hasMore);
    } catch {
      setError("Entry saved. Refresh to see the latest updates.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(editing ? "edit" : "publish");
  }

  return <section id="announcements" className={`min-w-0 space-y-4 rounded-[30px] border border-zinc-900 bg-zinc-950/75 p-5 ${compact ? "sm:p-6" : "mt-6 sm:p-8"}`}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">{mod ? "Updates & Announcements" : "Creator Announcements"}</h2>
      {canPublish && !draft && <button type="button" className={link} onClick={() => setDraft(empty)}>
        {mod ? "Post an update" : "New announcement"}
      </button>}
    </div>
    {error && <p role="status" className="text-sm text-rose-300">{error}</p>}
    {canPublish && draft && <form onSubmit={submit} className="space-y-3 rounded-2xl border border-zinc-800 p-4">
      {mod && !editing && <label className="block text-sm">Entry type
        <select className={field} value={draft.kind} onChange={event => setDraft({ ...draft, kind: event.target.value === "version" ? "version" : "announcement" })}>
          <option value="announcement">Mod announcement</option>
          <option value="version">Version update</option>
        </select>
      </label>}
      <label className="block text-sm">Title<input required maxLength={120} className={field} value={draft.title}
        onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
      {draft.kind === "version" && <label className="block text-sm">Version (optional)<input maxLength={40} className={field} value={draft.version}
        onChange={event => setDraft({ ...draft, version: event.target.value })} /></label>}
      <label className="block text-sm">{draft.kind === "version" ? "Update notes" : "Announcement"}
        <textarea required maxLength={5000} rows={5} className={field} value={draft.body}
          onChange={event => setDraft({ ...draft, body: event.target.value })} />
      </label>
      {!editing && <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.notify} onChange={event => setDraft({ ...draft, notify: event.target.checked })} />
        {mod ? "Notify followers about this update" : "Notify followers"}
      </label>}
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">{editing ? "Save changes" : "Publish"}</button>
        <button type="button" disabled={busy} className={link} onClick={closeDraft}>Cancel</button>
      </div>
    </form>}
    {focus && <a href="#announcements" className={link}>View all entries</a>}
    {loaded && !error && !items.length && <p className="text-sm text-zinc-400">{focus ? "This entry is unavailable." : mod ? "No updates or announcements yet." : "No announcements yet."}</p>}
    {items.map(item => <article key={item.id} id={"announcement-" + item.id}
      className="space-y-2 rounded-2xl border border-zinc-800 p-4 target:border-purple-500">
      {mod && <p className="text-xs font-medium text-purple-300">{item.kind === "version" ? "Version update" : "Mod announcement"}{item.version ? " · " + item.version : ""}</p>}
      <h3 className="break-words font-semibold">{item.title}</h3>
      <p className="text-xs text-zinc-400">
        {item.author} · <time dateTime={item.published_at}>{new Date(item.published_at).toLocaleDateString()}</time>
        {item.edited_at && <> · Edited <time dateTime={item.edited_at}>{new Date(item.edited_at).toLocaleDateString()}</time></>}
        {item.notified !== null && (item.notified ? " · Followers notified" : " · Published without notification")}
      </p>
      <p className="whitespace-pre-wrap break-words text-sm text-zinc-200">{item.body}</p>
      {canPublish && <div className="flex gap-4">
        <button type="button" className={link} disabled={busy} onClick={() => {
          setEditing(item.id);
          setDraft({ kind: item.kind, title: item.title, body: item.body, version: item.version ?? "", notify: false });
          document.getElementById("announcements")?.scrollIntoView();
        }}>Edit</button>
        <button type="button" className={link} disabled={busy} onClick={() => {
          if (window.confirm("Archive this entry? It will be removed from the public page.")) void save("archive", item.id);
        }}>Archive</button>
      </div>}
    </article>)}
    {!focus && (page > 0 || hasMore) && <div className="flex gap-4">
      <button type="button" className={link} disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
      <button type="button" className={link} disabled={!hasMore} onClick={() => setPage(page + 1)}>Next</button>
    </div>}
  </section>;
}
