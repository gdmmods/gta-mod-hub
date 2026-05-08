export default function MetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">

      <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
        {label}
      </p>

      <p className="text-white font-medium">
        {value}
      </p>

    </div>
  );
}