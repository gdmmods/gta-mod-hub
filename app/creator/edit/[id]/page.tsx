export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CreatorEditForm from "@/components/creator/CreatorEditForm";

export default async function EditCreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } =
    await params;

  const {
    data: creator,
    error,
  } = await supabase
    .from("creators")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !creator) {

    console.error(
      "LOAD ERROR:",
      error
    );

    return (
      <main
        className="
          min-h-screen
          bg-black
          text-white
          flex
          items-center
          justify-center
        "
      >
        Creator not found.
      </main>
    );

  }

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
          fixed
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
            max-w-[1400px]
            mx-auto
            px-6
            py-5
            flex
            items-center
            justify-between
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
            href={`/creator/${creator.id}`}
            className="
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-950
              px-5
              py-2.5
              text-sm
              text-zinc-300
              transition
              hover:bg-zinc-900
            "
          >
            View Profile
          </Link>

        </div>

      </div>

      {/* CONTENT */}
      <section
        className="
          relative
          z-10
          max-w-[1100px]
          mx-auto
          px-6
          py-14
        "
      >

        {/* HEADER */}
        <div className="mb-10">

          <p
            className="
              text-sm
              uppercase
              tracking-[0.25em]
              text-purple-400
            "
          >
            Creator Studio
          </p>

          <h1
            className="
              mt-3
              text-5xl
              font-black
              tracking-tight
            "
          >
            Edit Creator Profile
          </h1>

          <p
            className="
              mt-4
              max-w-2xl
              text-zinc-500
              text-lg
            "
          >
            Manage creator branding,
            socials, profile details,
            specialization tags,
            and public presence.
          </p>

        </div>

        {/* PANEL */}
        <div
          className="
            rounded-[36px]
            border
            border-zinc-800
            bg-zinc-950/70
            backdrop-blur-2xl
            p-8
            shadow-[0_0_60px_rgba(168,85,247,0.08)]
          "
        >

          <CreatorEditForm
            creator={creator}
          />

        </div>

      </section>

    </main>

  );
}