export default function ModQuickTags() {
  const tags = [
    "Add-On",
    "FiveM Ready",
    "Optimized",
    "High Quality",
  ];

  return (
    <div className="flex gap-3 flex-wrap mt-6">

      {tags.map((tag) => (
        <div
          key={tag}
          className="
            px-4
            py-2
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900/70
            text-sm
            text-zinc-300
            backdrop-blur-xl
          "
        >
          {tag}
        </div>
      ))}

    </div>
  );
}