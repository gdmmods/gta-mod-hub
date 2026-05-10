import { supabase } from "@/lib/supabase";

import ModHero from "@/components/mod/ModHero";
import ModSidebar from "@/components/mod/ModSidebar";
import ModTabs from "@/components/mod/ModTabs";
import RelatedMods from "@/components/mod/RelatedMods";
import ModMetaGrid from "@/components/mod/ModMetaGrid";

export const dynamic = "force-dynamic";

export default async function ModPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params;

  /* ---------------------------------
     FETCH MOD
  --------------------------------- */
  const { data: mod, error } =
    await supabase
      .from("mods")
      .select(`
        *,
        favorites(count)
      `)
      .eq("id", id)
      .single();

  if (!mod || error) {

    console.log(error);

    return (
      <div
        className="
          min-h-screen
          bg-black
          text-white
          flex
          items-center
          justify-center
        "
      >
        Mod not found
      </div>
    );
  }

  /* ---------------------------------
     FAVORITES
  --------------------------------- */
  const favoritesCount =
    mod.favorites?.[0]?.count || 0;

  /* ---------------------------------
     FETCH CREATORS
  --------------------------------- */
  const { data: creatorsData } =
    await supabase
      .from("mod_creators")
      .select(`
        creators (
          id,
          name
        )
      `)
      .eq("mod_id", id);

  const creators =
    creatorsData
      ?.map((c: any) => c.creators)
      .filter(Boolean) || [];

  /* ---------------------------------
     IMAGES
  --------------------------------- */
  let images: string[] = [];

  try {

    if (Array.isArray(mod.images)) {

      images = mod.images;

    } else if (
      typeof mod.images === "string" &&
      mod.images.length > 0
    ) {

      images = JSON.parse(mod.images);

    }

  } catch {

    images = [];

  }

  /* ---------------------------------
     RELATED MODS
  --------------------------------- */
  const { data: relatedMods } =
    await supabase
      .from("mods")
      .select("*")
      .neq("id", mod.id)
      .eq("category", mod.category)
      .limit(10);

  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-black
        text-white
      "
    >

      {/* BACKGROUND */}
      <div
        className="
          absolute
          inset-0
          overflow-hidden
          pointer-events-none
        "
      >

        {/* TOP GLOW */}
        <div
          className="
            absolute
            top-0
            left-1/2
            -translate-x-1/2
            w-[900px]
            h-[260px]
            opacity-10
            blur-[120px]
          "
        >

          <img
            src={mod.image}
            alt={mod.title}
            className="
              w-full
              h-full
              object-cover
            "
          />

        </div>

        {/* OVERLAY */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-black/20
            via-black/80
            to-black
          "
        />

      </div>

      {/* PAGE */}
      <div
        className="
          relative
          z-10
          max-w-[1450px]
          mx-auto
          px-4
          md:px-6
          py-6
        "
      >

        {/* TOP SECTION */}
        <div
          className="
            grid
            grid-cols-1
            xl:grid-cols-[minmax(0,1fr)_360px]
            gap-5
            items-start
          "
        >

          {/* HERO */}
          <div className="min-w-0">

            <ModHero
              mod={mod}
              images={images}
            />

          </div>

          {/* SIDEBAR */}
          <div
            className="
              xl:sticky
              xl:top-5
              self-start
            "
          >

            <ModSidebar
              mod={mod}
              creators={creators}
              favoritesCount={favoritesCount}
            />

          </div>

        </div>

        {/* CONTENT SECTION */}
        <div
          className="
            mt-6
            grid
            grid-cols-1
            xl:grid-cols-[minmax(0,1fr)_360px]
            gap-5
            items-start
          "
        >

          {/* LEFT CONTENT */}
          <div className="min-w-0">

            <ModTabs mod={mod} />

          </div>

          {/* RIGHT ECOSYSTEM */}
<div className="space-y-5">

  {/* META */}
  <div
    className="
      rounded-[30px]
      border
      border-zinc-900
      bg-zinc-950/75
      backdrop-blur-xl
      p-5
    "
  >

    <div className="mb-5">

      <p
        className="
          text-[11px]
          uppercase
          tracking-[0.2em]
          text-zinc-500
        "
      >
        Mod Information
      </p>

      <h3
        className="
          text-xl
          font-semibold
          mt-2
        "
      >
        Details
      </h3>

    </div>

    <ModMetaGrid
      mod={mod}
      creators={creators}
      images={images}
    />

  </div>

  {/* TECHNICAL DETAILS */}
  <div
    className="
      rounded-[30px]
      border
      border-zinc-900
      bg-zinc-950/60
      backdrop-blur-xl
      p-5
    "
  >

    <div className="mb-5">

      <p
        className="
          text-[11px]
          uppercase
          tracking-[0.2em]
          text-zinc-500
        "
      >
        Technical
      </p>

      <h3
        className="
          text-xl
          font-semibold
          mt-2
        "
      >
        Compatibility
      </h3>

    </div>

    <div className="space-y-3">

      {[
  {
    label: "Game",
    value: "Grand Theft Auto V",
  },
  {
    label: "Compatibility",
    value:
      mod.compatibility ||
      "Unknown",
  },
  {
    label: "Version",
    value:
      mod.version ||
      "N/A",
  },
  {
    label: "Installation",
    value:
      mod.install_type ||
      "Unknown",
  },
  {
    label: "Game Build",
    value:
      mod.game_build ||
      "Unknown",
  },
  {
    label: "File Size",
    value:
      mod.file_size ||
      "Unknown",
  },
].map((item) => (

        <div
          key={item.label}
          className="
            flex
            items-center
            justify-between
            rounded-2xl
            border
            border-zinc-900
            bg-black/30
            px-4
            py-3
          "
        >

          <span
            className="
              text-sm
              text-zinc-500
            "
          >
            {item.label}
          </span>

          <span
            className="
              text-sm
              font-medium
              text-zinc-200
            "
          >
            {item.value}
          </span>

        </div>

      ))}

    </div>

  </div>

  {/* CREATOR ACTIVITY */}
  <div
    className="
      rounded-[30px]
      border
      border-purple-500/10
      bg-gradient-to-b
      from-purple-500/5
      to-zinc-950/70
      backdrop-blur-xl
      p-5
    "
  >

    <div className="mb-5">

      <p
        className="
          text-[11px]
          uppercase
          tracking-[0.2em]
          text-purple-400
        "
      >
        Creator Activity
      </p>

      <h3
        className="
          text-xl
          font-semibold
          mt-2
        "
      >
        Development Status
      </h3>

    </div>

    {/* STATUS */}
    <div
      className="
        flex
        items-center
        justify-between
        rounded-2xl
        border
        border-zinc-900
        bg-black/30
        px-4
        py-4
      "
    >

      <div className="flex items-center gap-3">

        <div
          className="
            w-2
            h-2
            rounded-full
            bg-emerald-400
            shadow-[0_0_10px_rgba(74,222,128,0.8)]
          "
        />

        <span className="text-sm text-zinc-300">
          {mod.development_status ||
           "Active Development"}
        </span>

      </div>

      <span
        className="
          text-xs
          text-zinc-500
        "
      >
        Live
      </span>

    </div>

    {/* TIMELINE */}
    <div className="mt-4 space-y-3">

      {[
  {
    label: "Last Updated",
    value:
      mod.last_updated
        ? new Date(
            mod.last_updated
          ).toLocaleDateString()
        : "Unknown",
  },
  {
    label: "Current Version",
    value:
      mod.version || "N/A",
  },
  {
    label: "Planned Updates",
    value: `${
      mod.planned_updates ?? 0
    } pending`,
  },
].map((item) => (

        <div
          key={item.label}
          className="
            flex
            items-center
            justify-between
            rounded-2xl
            border
            border-zinc-900
            bg-black/20
            px-4
            py-3
          "
        >

          <span
            className="
              text-sm
              text-zinc-500
            "
          >
            {item.label}
          </span>

          <span
            className="
              text-sm
              font-medium
              text-zinc-200
            "
          >
            {item.value}
          </span>

        </div>

      ))}

    </div>

    {/* FOLLOW */}
    <button
      className="
        mt-5
        w-full
        rounded-2xl
        border
        border-purple-500/20
        bg-purple-500/10
        hover:bg-purple-500/20
        transition-all
        py-3
        text-sm
        font-medium
        text-purple-300
      "
    >
      Follow Creator
    </button>

  </div>

  {/* FUTURE WIDGETS */}
  <div
    className="
      rounded-[30px]
      border
      border-dashed
      border-zinc-800
      bg-zinc-950/40
      backdrop-blur-xl
      p-5
    "
  >

    <p
      className="
        text-[11px]
        uppercase
        tracking-[0.2em]
        text-zinc-600
      "
    >
      Future Expansion
    </p>

    <div className="mt-5 space-y-3">

      {[
        "Creator progress tracker",
        "Version compatibility",
        "Install instructions",
        "Update timeline",
        "AI-generated summaries",
        "Dependency manager",
      ].map((item) => (

        <div
          key={item}
          className="
            flex
            items-center
            gap-3
            text-sm
            text-zinc-500
          "
        >

          <div
            className="
              w-1.5
              h-1.5
              rounded-full
              bg-purple-500/70
            "
          />

          {item}

        </div>

      ))}

    </div>

  </div>

</div>

        </div>

        {/* RELATED */}
        <div className="mt-10">

          <RelatedMods
            mods={relatedMods || []}
          />

        </div>

      </div>

    </main>
  );
}