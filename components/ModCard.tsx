import Link from "next/link";

type ModCardProps = {
  id: string; //
  title: string;
  description: string;
  image: string;
  creator?: string;
  sourceUrl?: string;
};

export default function ModCard({ id, title, description, image, creator }: ModCardProps) {
console.log("CREATOR PROP:", creator);
  return (
  <Link
    href={`/mods/${id}`}
    className="block"
  >
    <div className="bg-zinc-900 p-4 rounded-xl hover:bg-zinc-800 transition cursor-pointer">
      <img
        src={image || "https://via.placeholder.com/400x200"}
        className="rounded-lg"
      />

      <h3 className="mt-3 font-semibold">{title}</h3>

      <p className="text-sm text-gray-400">{description}</p>

      <p className="text-xs text-gray-500 mt-1">
        by {creator || "Unknown"}
      </p>
    </div>
  </Link>
);
}