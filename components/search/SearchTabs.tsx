export default function SearchTabs<T extends string>({ active, options, label, onSelect, compact = false }: {
  active: T;
  options: Record<T, string>;
  label: string;
  onSelect: (value: T) => void;
  compact?: boolean;
}) {
  return <div role="group" aria-label={label} className="flex flex-wrap gap-3">
    {(Object.keys(options) as T[]).map(category => (
      <button key={category} type="button" aria-pressed={active === category} onClick={() => onSelect(category)}
        className={`rounded-xl border px-4 text-sm transition ${compact ? "py-2" : "py-3"} ${active === category
          ? "border-purple-500 bg-purple-500/10 text-white"
          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"}`}>
        {options[category]}
      </button>
    ))}
  </div>;
}
