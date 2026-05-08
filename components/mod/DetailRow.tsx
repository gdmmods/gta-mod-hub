export default function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">

      <span className="text-zinc-500">
        {label}
      </span>

      <span className="text-white">
        {value}
      </span>

    </div>
  );
}