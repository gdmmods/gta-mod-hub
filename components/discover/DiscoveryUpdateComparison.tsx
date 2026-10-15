"use client";

import { useState } from "react";

type Field = "title" | "description" | "category" | "creator" | "image" | "images" | "features" | "requirements" | "notes" | "credits" | "download_url";
export type Comparison = {
  current: Record<Field, string | null>;
  proposed: Partial<Record<Field, string>>;
  sourceDisplay?: Partial<Record<"requirements" | "notes", string>>;
};

const FIELDS: Array<{ key: Field; label: string }> = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "category", label: "Category" },
  { key: "creator", label: "External author" },
  { key: "image", label: "Primary image" },
  { key: "images", label: "Screenshots" },
  { key: "features", label: "Features" },
  { key: "requirements", label: "Requirements" },
  { key: "notes", label: "Notes / Known Bugs" },
  { key: "credits", label: "Credits" },
  { key: "download_url", label: "Download link" },
];

function formatValue(field: Field, value: string | null | undefined): string {
  if (value == null || value.trim() === "") return "Empty";
  if (field === "images") {
    try {
      const images = JSON.parse(value);
      if (Array.isArray(images)) return images.join("\n");
    } catch {
      // Show the saved value as-is when it is not valid JSON.
    }
  }
  return value;
}

export default function DiscoveryUpdateComparison({
  comparison,
  onApply,
  applying,
}: {
  comparison: Comparison;
  onApply: (fields: Partial<Record<Field, string>>) => void;
  applying: boolean;
}) {
  const [selection, setSelection] = useState<{ comparison: Comparison; values: Partial<Record<Field, boolean>> }>({ comparison, values: {} });
  const selected = selection.comparison === comparison ? selection.values : {};

  const changed = FIELDS.filter(({ key }) =>
    comparison.proposed[key] !== undefined &&
    comparison.current[key] !== comparison.proposed[key]
  );
  const acceptedFields = Object.fromEntries(
    changed
      .filter(({ key }) => selected[key])
      .map(({ key }) => [key, comparison.proposed[key]!])
  ) as Partial<Record<Field, string>>;

  return (
    <section className="mt-4 rounded-2xl border border-purple-900/70 bg-zinc-950 p-5">
      <div className="mb-4">
        <h4 className="font-semibold text-white">Compare saved and source details</h4>
        <p className="mt-1 text-sm text-zinc-400">
          Nothing changes until you select fields and apply them. Empty source values are skipped.
        </p>
      </div>

      <div className="space-y-3">
        {FIELDS.map(({ key, label }) => {
          const hasProposal = comparison.proposed[key] !== undefined;
          const isChanged = hasProposal && comparison.current[key] !== comparison.proposed[key];
          return (
            <div key={key} className={`rounded-xl border p-4 ${isChanged ? "border-amber-700/70 bg-amber-950/20" : "border-zinc-800 bg-black/40"}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h5 className="text-sm font-medium text-zinc-200">{label}</h5>
                {isChanged ? (
                  <label className="flex items-center gap-2 text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      checked={!!selected[key]}
                      onChange={(event) => setSelection({ comparison, values: { ...selected, [key]: event.target.checked } })}
                      aria-label={`Accept proposed ${label.toLowerCase()}`}
                    />
                    Accept source value
                  </label>
                ) : (
                  <span className="text-xs text-zinc-500">
                    {hasProposal ? "No change" : "Source value unavailable; saved value kept"}
                  </span>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Value label="Saved" value={formatValue(key, comparison.current[key])} />
                <Value label="Source" value={hasProposal ? formatValue(key, comparison.proposed[key]) : comparison.sourceDisplay?.[key as "requirements" | "notes"] ?? "Not available — current value will be kept"} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Requirements and Notes / Known Bugs update the matching saved fields. Placeholder text only describes what the source contained and cannot be applied.
      </p>

      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={applying || Object.keys(acceptedFields).length === 0}
          onClick={() => onApply(acceptedFields)}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {applying ? "Applying…" : `Apply ${Object.keys(acceptedFields).length || "selected"} field${Object.keys(acceptedFields).length === 1 ? "" : "s"}`}
        </button>
      </div>
    </section>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words font-sans text-sm text-zinc-200">{value}</pre>
    </div>
  );
}
