const primaryClass = "rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50";
const secondaryClass = "rounded-xl border border-zinc-700 px-6 py-4 font-semibold text-zinc-200 transition hover:border-zinc-500 disabled:opacity-50";

export default function UploadSubmitSection({ loading, status }: { loading: boolean; status?: string }) {
  const draft = status === undefined || status === "draft";
  return <div className="space-y-3 pt-2">
    {status === "pending" && <p className="text-sm text-zinc-400">Pending review. Saving keeps this mod private.</p>}
    {status === "archived" && <p className="text-sm text-zinc-400">Archived. Saving keeps this mod private.</p>}
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {draft ? <>
        <button type="submit" name="modAction" value="save" disabled={loading} className={secondaryClass}>Save Draft</button>
        <button type="submit" name="modAction" value="publish" disabled={loading} className={primaryClass}>Publish Mod</button>
      </> : <button type="submit" name="modAction" value="save" disabled={loading} className={primaryClass}>Save Changes</button>}
      {(status === "draft" || status === "published") && <button
        type="submit" name="modAction" value="archive" disabled={loading}
        className={secondaryClass}>Archive Mod</button>}
      {loading && <p role="status" className="self-center text-sm text-zinc-400">Saving…</p>}
    </div>
  </div>;
}
