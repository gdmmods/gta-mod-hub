export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ModsGridClient from "@/components/ModsGridClient";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id: creatorId } =
    await params;

  if (
    !creatorId ||
    creatorId.startsWith(
      "legacy-"
    )
  ) {

    return (
      <div className="text-white p-10">
        Invalid creator
      </div>
    );

  }

  /* -----------------------------
     FETCH CREATOR
  ----------------------------- */
  const {
    data: creator,
    error: creatorError,
  } = await supabase
    .from("creators")
    .select(`
      id,
      name,
      avatar,
      bio,
      banner,
      tagline,
      location,
      specialization,
      socials,
      verified,
      status
    `)
    .eq("id", creatorId)
    .maybeSingle();

  if (
    creatorError ||
    !creator
  ) {

    console.error(
      "CREATOR ERROR:",
      creatorError
    );

    return (
      <div className="text-white p-10">
        Creator not found
      </div>
    );

  }

  /* -----------------------------
     FETCH RELATIONS
  ----------------------------- */
  const {
    data: relations,
    error: relationError,
  } = await supabase
    .from("mod_creators")
    .select("mod_id")
    .eq(
      "creator_id",
      creatorId
    );

  if (relationError) {

    console.error(
      "RELATION ERROR:",
      relationError
    );

  }

  const modIds =
    relations
      ?.map(
        (r) => r.mod_id
      )
      .filter(Boolean) || [];

  /* -----------------------------
     FETCH MODS
  ----------------------------- */
  let modsData: any[] = [];

  if (modIds.length > 0) {

    const {
      data,
      error,
    } = await supabase
      .from("mods")
      .select(`
        id,
        title,
        image,
        category,
        description,
        likes,
        downloads,
        source_url,
        tags,
        mod_creators (
          creators (
            id,
            name
          )
        )
      `)
      .in("id", modIds);

    if (error) {

      console.error(
        "MOD FETCH ERROR:",
        error
      );

    }

    modsData =
      data || [];

  }

  /* -----------------------------
     NORMALIZE MODS
  ----------------------------- */
  const mods =
    modsData.map(
      (m: any) => ({
        id: m.id,
        title:
          m.title ??
          "Untitled",
        image:
          m.image ??
          "/placeholder.jpg",
        category:
          m.category ??
          null,
        description:
          m.description ??
          "",
        likes:
          m.likes ?? 0,
        downloads:
          m.downloads ?? 0,
        source_url:
          m.source_url ??
          "#",
        tags:
          m.tags ?? [],
        mod_creators:
          m.mod_creators ?? [],
      })
    ) || [];

  /* -----------------------------
     STATS
  ----------------------------- */
  const totalLikes =
    mods.reduce(
      (s, m) =>
        s + (m.likes || 0),
      0
    );

  const totalDownloads =
    mods.reduce(
      (s, m) =>
        s +
        (m.downloads || 0),
      0
    );

  /* -----------------------------
     FEATURED MOD
  ----------------------------- */
  const featured =
    mods.length > 0
      ? [...mods].sort(
          (a, b) =>
            b.downloads -
            a.downloads
        )[0]
      : null;

  const bannerImage =
    creator.banner ||
    featured?.image ||
    "/placeholder.jpg";

  const socials =
  typeof creator.socials === "string"
    ? JSON.parse(creator.socials)
    : creator.socials || {};

  return (
    <main
      className="
        min-h-screen
        bg-black
        text-white
        overflow-hidden
      "
    >

      {/* BACKGROUND */}
      <div
        className="
          absolute
          inset-0
          pointer-events-none
          overflow-hidden
        "
      >

        <div
          className="
            absolute
            top-0
            left-1/2
            -translate-x-1/2
            w-[1000px]
            h-[500px]
            bg-purple-600/10
            blur-[180px]
          "
        />

      </div>

      {/* NAV */}
      <div
        className="
          relative
          z-20
          border-b
          border-zinc-900
          backdrop-blur-xl
          bg-black/50
        "
      >

        <div
          className="
            max-w-[1500px]
            mx-auto
            px-6
            py-5
            flex
            justify-between
            items-center
          "
        >

          <Link
            href="/"
            className="
              text-2xl
              font-black
              tracking-tight
            "
          >
            <span className="text-purple-500">
              M
            </span>{" "}
            ModVault
          </Link>

          <Link
            href={`/creator/edit/${creator.id}`}
            className="
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-950
              hover:bg-zinc-900
              transition
              px-5
              py-2.5
              text-sm
              text-zinc-300
            "
          >
            Edit Profile
          </Link>

        </div>

      </div>

      {/* HERO */}
      <section className="relative">

        {/* BANNER */}
        <div
          className="
            relative
            h-[420px]
            overflow-hidden
          "
        >

          <img
            src={bannerImage}
            alt={creator.name}
            className="
              w-full
              h-full
              object-cover
              opacity-70
            "
          />

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-b
              from-black/30
              via-black/50
              to-black
            "
          />

        </div>

        {/* PROFILE */}
        <div
          className="
            relative
            z-10
            max-w-[1450px]
            mx-auto
            px-6
            -mt-32
          "
        >

          <div
            className="
              rounded-[36px]
              border
              border-zinc-800
              bg-zinc-950/70
              backdrop-blur-2xl
              overflow-hidden
              shadow-[0_0_60px_rgba(168,85,247,0.08)]
            "
          >

            <div className="p-8">

              <div
                className="
                  flex
                  flex-col
                  xl:flex-row
                  gap-8
                "
              >

                {/* LEFT */}
                <div
                  className="
                    flex
                    flex-col
                    items-start
                  "
                >

                  <img
                    src={
                      creator.avatar ||
                      "https://placehold.co/200x200?text=👤"
                    }
                    alt={creator.name}
                    className="
                      w-36
                      h-36
                      rounded-[32px]
                      object-cover
                      border
                      border-zinc-800
                      shadow-2xl
                    "
                  />

                  <button
                    className="
                      mt-5
                      w-full
                      rounded-2xl
                      bg-gradient-to-r
                      from-purple-600
                      to-purple-500
                      py-3
                      font-medium
                      shadow-lg
                      hover:opacity-90
                      transition
                    "
                  >
                    Follow Creator
                  </button>

                </div>

                {/* RIGHT */}
                <div className="flex-1">

                  {/* TOP */}
                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      gap-3
                    "
                  >

                    <h1
                      className="
                        text-5xl
                        md:text-6xl
                        font-black
                        tracking-tight
                        leading-none
                      "
                    >
                      {creator.name}
                    </h1>

                    {creator.verified && (

                      <div
                        className="
                          px-3
                          py-1.5
                          rounded-xl
                          bg-blue-500/20
                          border
                          border-blue-500/30
                          text-sm
                          text-blue-300
                        "
                      >
                        ✔ Verified
                      </div>

                    )}

                    {creator.status && (

                      <div
                        className="
                          px-3
                          py-1.5
                          rounded-xl
                          bg-emerald-500/10
                          border
                          border-emerald-500/20
                          text-sm
                          text-emerald-300
                        "
                      >
                        {creator.status}
                      </div>

                    )}

                  </div>

                  {/* TAGLINE */}
                  {creator.tagline && (

                    <p
                      className="
                        mt-5
                        text-xl
                        text-purple-300
                      "
                    >
                      {creator.tagline}
                    </p>

                  )}

                  {/* BIO */}
                  <p
                    className="
                      mt-6
                      max-w-4xl
                      text-zinc-400
                      leading-relaxed
                      text-lg
                    "
                  >
                    {creator.bio ||
                      "No creator biography added yet."}
                  </p>

                  {/* SPECIALIZATION */}
{creator.specialization?.length > 0 && (

  <div
    className="
      mt-6
      flex
      flex-wrap
      gap-3
    "
  >

    {creator.specialization.map(
      (
        item: string
      ) => (

        <div
          key={item}
          className="
            rounded-2xl
            border
            border-purple-500/20
            bg-purple-500/10
            px-4
            py-2
            text-sm
            text-purple-300
          "
        >
          {item}
        </div>

      )
    )}

  </div>

)}

{/* SOCIALS */}
{Object.keys(socials).length > 0 && (

  <div
    className="
      mt-6
      flex
      flex-wrap
      gap-3
    "
  >

    {socials.website && (

      <a
        href={socials.website}
        target="_blank"
        rel="noopener noreferrer"
        className="
          rounded-2xl
          border
          border-zinc-800
          bg-black/30
          px-4
          py-2
          text-sm
          text-zinc-300
          hover:border-purple-500/30
          hover:text-white
          transition
        "
      >
        🌐 Website
      </a>

    )}

    {socials.discord && (

      <a
        href={socials.discord}
        target="_blank"
        rel="noopener noreferrer"
        className="
          rounded-2xl
          border
          border-zinc-800
          bg-black/30
          px-4
          py-2
          text-sm
          text-zinc-300
          hover:border-purple-500/30
          hover:text-white
          transition
        "
      >
        💬 Discord
      </a>

    )}

    {socials.youtube && (

      <a
        href={socials.youtube}
        target="_blank"
        rel="noopener noreferrer"
        className="
          rounded-2xl
          border
          border-zinc-800
          bg-black/30
          px-4
          py-2
          text-sm
          text-zinc-300
          hover:border-purple-500/30
          hover:text-white
          transition
        "
      >
        ▶ YouTube
      </a>

    )}

    {socials.instagram && (

      <a
        href={socials.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="
          rounded-2xl
          border
          border-zinc-800
          bg-black/30
          px-4
          py-2
          text-sm
          text-zinc-300
          hover:border-purple-500/30
          hover:text-white
          transition
        "
      >
        ✕ Instagram
      </a>

    )}

  </div>

)}

<div
  className="
    grid
    grid-cols-2
    md:grid-cols-4
    gap-4
    mt-8
  "
>

                    {[
                      [
                        "Mods",
                        mods.length,
                      ],
                      [
                        "Likes",
                        totalLikes,
                      ],
                      [
                        "Downloads",
                        totalDownloads,
                      ],
                      [
                        "Location",
                        creator.location ||
                          "Unknown",
                      ],
                    ].map(
                      ([label, value]) => (

                        <div
                          key={label}
                          className="
                            rounded-3xl
                            border
                            border-zinc-900
                            bg-black/30
                            p-5
                          "
                        >

                          <p
                            className="
                              text-sm
                              text-zinc-500
                            "
                          >
                            {label}
                          </p>

                          <p
                            className="
                              text-2xl
                              font-bold
                              mt-2
                            "
                          >
                            {value}
                          </p>

                        </div>

                      )
                    )}

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

{/* CREATOR ACTIVITY */}
<section
  className="
    max-w-[1450px]
    mx-auto
    px-6
    mt-14
  "
>

  <div
    className="
      grid
      grid-cols-1
      xl:grid-cols-[1.2fr_0.8fr]
      gap-6
    "
  >

    {/* DEVLOG */}
    <div
      className="
        rounded-[34px]
        border
        border-zinc-800
        bg-zinc-950/60
        backdrop-blur-xl
        p-7
      "
    >

      <div
        className="
          flex
          items-center
          justify-between
          mb-8
        "
      >

        <div>

          <p
            className="
              text-sm
              uppercase
              tracking-[0.2em]
              text-purple-400
            "
          >
            Development
          </p>

          <h2
            className="
              text-3xl
              font-black
              mt-2
            "
          >
            Creator Activity
          </h2>

        </div>

        <div
          className="
            rounded-2xl
            border
            border-emerald-500/20
            bg-emerald-500/10
            px-4
            py-2
            text-sm
            text-emerald-300
          "
        >
          Active
        </div>

      </div>

      <div className="space-y-5">

        {[
          {
            title:
              "New cinematic screenshots uploaded",
            date:
              "2 days ago",
          },
          {
            title:
              "Physics overhaul in progress",
            date:
              "5 days ago",
          },
          {
            title:
              "Optimization pass for next update",
            date:
              "1 week ago",
          },
        ].map((item) => (

          <div
            key={item.title}
            className="
              rounded-3xl
              border
              border-zinc-900
              bg-black/30
              p-5
            "
          >

            <div
              className="
                flex
                items-start
                gap-4
              "
            >

              <div
                className="
                  mt-1
                  w-3
                  h-3
                  rounded-full
                  bg-purple-500
                  shadow-[0_0_15px_rgba(168,85,247,0.8)]
                "
              />

              <div className="flex-1">

                <h3
                  className="
                    text-lg
                    font-semibold
                  "
                >
                  {item.title}
                </h3>

                <p
                  className="
                    text-sm
                    text-zinc-500
                    mt-2
                  "
                >
                  {item.date}
                </p>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

    {/* PROGRESS */}
    <div
      className="
  rounded-[34px]
  border
  border-purple-500/10
  bg-gradient-to-b
  from-purple-500/5
  to-zinc-950/70
  backdrop-blur-xl
  p-6
  h-fit
"
    >

      <p
        className="
          text-sm
          uppercase
          tracking-[0.2em]
          text-purple-400
        "
      >
        Progress
      </p>

      <h2
        className="
          text-3xl
          font-black
          mt-2
        "
      >
        Current Focus
      </h2>

      <div className="mt-6 space-y-5">

        {[
          [
            "Vehicle Optimization",
            "82%",
          ],
          [
            "Interior Rework",
            "65%",
          ],
          [
            "LOD Improvements",
            "91%",
          ],
          [
            "Sound Design",
            "40%",
          ],
        ].map(
          ([label, value]) => (

            <div key={label}>

              <div
                className="
                  flex
                  justify-between
                  mb-3
                  text-sm
                "
              >

                <span className="text-zinc-300">
                  {label}
                </span>

                <span className="text-zinc-500">
                  {value}
                </span>

              </div>

              <div
                className="
                  h-2
                  rounded-full
                  bg-black/40
                  overflow-hidden
                "
              >

                <div
                  className="
                    h-full
                    rounded-full
                    bg-gradient-to-r
                    from-purple-500
                    to-pink-500
                  "
                  style={{
                    width: value,
                  }}
                />

              </div>

            </div>

          )
        )}

      </div>

      <div
        className="
          mt-7
          rounded-3xl
          border
          border-zinc-900
          bg-black/30
          p-5
        "
      >

        <p
          className="
            text-sm
            text-zinc-500
          "
        >
          Next Planned Release
        </p>

        <h3
          className="
            text-xl
            font-bold
            mt-2
          "
        >
          Ultra Realistic Vehicle Pack V2
        </h3>

        <p
          className="
            text-sm
            text-zinc-400
            mt-3
            leading-relaxed
          "
        >
          Massive visual overhaul with
          improved interiors, optimized
          handling and cinematic tuning.
        </p>

      </div>

    </div>

  </div>

</section>

      {/* FEATURED MOD */}
      {featured && (

        <section
          className="
            max-w-[1450px]
            mx-auto
            px-6
            mt-14
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              mb-6
            "
          >

            <div>

              <p
                className="
                  text-sm
                  uppercase
                  tracking-[0.2em]
                  text-purple-400
                "
              >
                Highlight
              </p>

              <h2
                className="
                  text-3xl
                  font-bold
                  mt-2
                "
              >
                Featured Creation
              </h2>

            </div>

          </div>

          <Link
            href={`/mods/${featured.id}`}
          >

            <div
              className="
                relative
                rounded-[36px]
                overflow-hidden
                border
                border-zinc-800
                group
              "
            >

              <img
                src={featured.image}
                alt={featured.title}
                className="
                  w-full
                  h-[420px]
                  object-cover
                  group-hover:scale-[1.03]
                  transition
                  duration-700
                "
              />

              <div
                className="
                  absolute
                  inset-0
                  bg-gradient-to-t
                  from-black
                  via-black/40
                  to-transparent
                "
              />

              <div
                className="
                  absolute
                  bottom-0
                  left-0
                  p-8
                "
              >

                <h3
                  className="
                    text-4xl
                    font-black
                  "
                >
                  {featured.title}
                </h3>

                <div
                  className="
                    flex
                    gap-5
                    mt-3
                    text-zinc-300
                  "
                >

                  <span>
                    ⬇{" "}
                    {featured.downloads}
                  </span>

                  <span>
                    ❤️{" "}
                    {featured.likes}
                  </span>

                </div>

              </div>

            </div>

          </Link>

        </section>

      )}

      {/* MOD GRID */}
      <section
        className="
          max-w-[1450px]
          mx-auto
          px-6
          mt-14
          pb-20
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            mb-8
          "
        >

          <div>

            <p
              className="
                text-sm
                uppercase
                tracking-[0.2em]
                text-zinc-500
              "
            >
              Collection
            </p>

            <h2
              className="
                text-4xl
                font-black
                mt-2
              "
            >
              Creator Mods
            </h2>

          </div>

        </div>

        {mods.length > 0 ? (

          <ModsGridClient mods={mods} />

        ) : (

          <div
            className="
              rounded-[30px]
              border
              border-zinc-900
              bg-zinc-950/50
              py-24
              text-center
              text-zinc-500
            "
          >
            No mods published yet.
          </div>

        )}

      </section>

    </main>
  );
}