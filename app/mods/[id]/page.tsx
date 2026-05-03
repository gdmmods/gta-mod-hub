import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Gallery from "@/components/Gallery";
import DownloadButton from "@/components/DownloadButton";
import LikeButton from "@/components/LikeButton";

export const dynamic = "force-dynamic";

export default async function ModPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  console.log("PAGE ID:", id);

  // -----------------------------
  // FETCH MOD
  // -----------------------------
  const { data: mod, error } = await supabase
    .from("mods")
    .select("*")
    .eq("id", id)
    .single();

  if (!mod || error) {
    console.log("MOD FETCH ERROR:", error);
    return <div className="text-white p-10">Mod not found</div>;
  }

  // -----------------------------
  // FETCH CREATORS (RELIABLE)
  // -----------------------------
  const { data: creatorsData, error: creatorsError } = await supabase
    .from("mod_creators")
    .select(`
      creators (
        id,
        name
      )
    `)
    .eq("mod_id", id);

    console.log("CREATORS FETCH RESULT:", creatorsData);

  if (creatorsError) {
    console.log("CREATORS FETCH ERROR:", creatorsError);
  }

  const creators =
    creatorsData?.map((c: any) => c.creators).filter(Boolean) || [];

  console.log("CREATORS:", creators);

  // -----------------------------
  // IMAGES
  // -----------------------------
  let images: string[] = [];
  try {
    if (Array.isArray(mod.images)) {
      images = mod.images;
    } else if (typeof mod.images === "string" && mod.images.length > 0) {
      images = JSON.parse(mod.images);
    }
  } catch {
    images = [];
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* LEFT */}
        <div>
          <Gallery main={mod.image} images={images} />
        </div>

        {/* RIGHT */}
        <div>
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-4xl font-bold leading-tight max-w-[85%]">
              {mod.title}
            </h1>

            {mod.verified && (
              <div className="relative group shrink-0">
                <span className="bg-blue-600/90 text-white text-xs px-3 py-1.5 rounded-lg shadow transition duration-200 group-hover:bg-blue-500 group-hover:shadow-lg cursor-default">
                  ✔ Verified
                </span>

                <div className="absolute right-0 top-full mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition duration-200">
                  <div className="bg-neutral-800 text-white text-[11px] px-2 py-1 rounded shadow whitespace-nowrap">
                    Verified by ModVault
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ✅ CREATORS */}
          <p className="text-gray-400 mt-2">
            by{" "}
            {creators.length ? (
              creators.map((creator: any, i: number) => (
                <span key={creator.id}>
                  <Link
                    href={`/creator/${encodeURIComponent(creator.name)}`}
                    className="text-purple-400 hover:underline"
                  >
                    {creator.name}
                  </Link>
                  {i < creators.length - 1 && " • "}
                </span>
              ))
            ) : (
              <Link
                href={`/creator/${encodeURIComponent(mod.creator || "")}`}
                className="text-purple-400 hover:underline"
              >
                {mod.creator || "Unknown"}
              </Link>
            )}
          </p>

          <div className="flex gap-6 text-sm text-gray-400 mt-2">
            <span>⬇ {mod.downloads ?? 0} downloads</span>
            <span>❤️ {mod.likes ?? 0} likes</span>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-300">{mod.description}</p>
          </div>

          {mod.features && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Features</h2>
              <ul className="space-y-1">
                {mod.features.split("\n").map((f: string, i: number) => (
                  <li key={i} className="text-gray-300 flex gap-2">
                    <span className="text-green-500">✔</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mod.requirements && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Requirements</h2>
              <p className="text-gray-300 whitespace-pre-line">
                {mod.requirements}
              </p>
            </div>
          )}

          {mod.notes && (
            <div className="mt-6 p-4 border border-yellow-500 rounded-lg bg-yellow-500/10">
              <h2 className="text-lg font-semibold text-yellow-400 mb-1">
                Note
              </h2>
              <p className="text-gray-300 whitespace-pre-line">
                {mod.notes}
              </p>
            </div>
          )}

          {mod.credits && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Credits</h2>
              <p className="text-gray-400 whitespace-pre-line">
                {mod.credits}
              </p>
            </div>
          )}

          <div className="mt-8 flex gap-4 items-center">
            <DownloadButton url={mod.source_url} id={mod.id} />
            <LikeButton id={mod.id} initialLikes={mod.likes ?? 0} />

            <a
              href={mod.source_url}
              target="_blank"
              className="border border-gray-500 px-5 py-2 rounded-lg"
            >
              Source
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}