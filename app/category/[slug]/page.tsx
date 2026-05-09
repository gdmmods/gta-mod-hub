import { supabase } from "@/lib/supabase";

import CategoryGridClient from "@/components/category/CategoryGridClient";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {

  const { slug } = await params;

  /* FETCH MODS */
  const { data: mods, error } =
    await supabase
      .from("mods")
      .select("*")
      .eq("category", slug)
      .order("likes", {
        ascending: false,
      });

  if (error) {
    console.log(error);
  }

  const formattedTitle =
    slug.charAt(0).toUpperCase() +
    slug.slice(1);

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HERO */}
      <div
        className="
          border-b
          border-zinc-800
          bg-gradient-to-b
          from-zinc-900
          to-black
        "
      >

        <div className="max-w-[1600px] mx-auto px-6 py-16">

          <p className="text-purple-400 text-sm tracking-[0.25em] uppercase">
            Category
          </p>

          <h1 className="text-6xl font-black mt-4">
            {formattedTitle}
          </h1>

          <p className="text-zinc-500 mt-4 text-lg">
            Explore {formattedTitle.toLowerCase()} mods
            from the community.
          </p>

          <div className="mt-6 flex gap-4 flex-wrap">

            <div
              className="
                px-4
                py-3
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-900/70
              "
            >
              <p className="text-zinc-500 text-sm">
                Total Mods
              </p>

              <p className="text-2xl font-bold mt-1">
                {mods?.length || 0}
              </p>
            </div>

            <div
              className="
                px-4
                py-3
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-900/70
              "
            >
              <p className="text-zinc-500 text-sm">
                Sort
              </p>

              <p className="text-lg font-medium mt-1">
                Most Liked
              </p>
            </div>

          </div>

        </div>

      </div>

      <CategoryGridClient mods={mods || []} />
      
    </main>
  );
}