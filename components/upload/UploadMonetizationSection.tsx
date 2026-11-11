import type { ChangeEventHandler } from "react";

const releaseInformation = {
  supporters: [
    "Your creation is preserved privately in ModVault and is not included in public discovery, creator portfolios, or public contribution counts. Public visitors cannot access its ModVault page or downloads.",
    "You can change its availability to Early Access or Public later without losing its history or attribution.",
    "Restricted status does not establish intellectual-property ownership or grant distribution permission.",
  ],
  early_access: [
    "Your creation is publicly discoverable and accessible under ModVault's current Early Access policy. Early Access describes the release stage and does not create a platform-controlled access gate.",
    "You remain responsible for the rights and permissions associated with its publication.",
  ],
  public: [
    "Your creation is publicly discoverable and accessible through ModVault's supported distribution paths.",
    "Publication remains subject to creator authorization, applicable rights, and ModVault's content policies.",
  ],
};

export default function UploadMonetizationSection({ form, handleChange }: {
  form: { visibility?: string | null; release_state?: string | null };
  handleChange: ChangeEventHandler<HTMLSelectElement>;
}) {
  const release = form.visibility === "supporters" || form.release_state === "supporters"
    ? "supporters" : form.visibility === "early_access" ? "early_access" : "public";

  return <section className="space-y-6 rounded-[32px] border border-zinc-900 bg-zinc-950/50 p-5 sm:p-7">
    <div>
      <p className="text-sm uppercase tracking-[0.2em] text-purple-400">Documentation</p>
      <h2 className="mt-2 text-2xl font-black">Release Information</h2>
    </div>
    <div>
      <label htmlFor="release-availability" className="mb-2 block text-sm text-zinc-400">Release availability</label>
      <select id="release-availability" name="visibility" value={release} onChange={handleChange}
        aria-describedby="release-information" className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500">
        <option value="public">Public Release</option>
        <option value="early_access">Early Access</option>
        <option value="supporters">Restricted / Supporter Release</option>
      </select>
      <div id="release-information" aria-live="polite" className="mt-4 space-y-3 rounded-2xl border border-purple-500/10 bg-purple-500/5 px-4 py-5 text-sm leading-relaxed text-zinc-400 sm:px-6">
        {releaseInformation[release].map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </div>
  </section>;
}
