"use client";

import Link from "next/link";

import { supabase } from "@/lib/supabase/client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  mod: any;
  onModChanged?: () => void;
};

export default function DashboardModCard({
  mod,
  onModChanged,
}: Props) {

  const router = useRouter();
const [publishing, setPublishing] = useState(false);

const handlePublish = async () => {
  if (mod.status !== "draft") return;

  const confirmed = window.confirm(
    `Publish "${mod.title}"? It will become publicly visible.`
  );

  if (!confirmed) return;

  setPublishing(true);

  try {
    const { error } = await supabase
      .from("mods")
      .update({ status: "published" })
      .eq("id", mod.id)
      .eq("status", "draft");

    if (error) {
      window.alert(`Failed to publish mod: ${error.message}`);
      return;
    }

        onModChanged?.();
    router.refresh();
  } catch (error) {
    console.error("Publish error:", error);
    window.alert("Something went wrong while publishing the mod.");
  } finally {
    setPublishing(false);
  }
};

  const releaseDate =
  mod.created_at
    ? new Date(
        mod.created_at
      ).toLocaleDateString(
        "en-GB",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      )
    : "Unknown";

  return (

    <div
      className="
        rounded-3xl
        overflow-hidden
        border
        border-zinc-800
        bg-zinc-900
      "
    >

      <div className="relative">

        <img
          src={mod.image}
          alt={mod.title}
          className="
            w-full
            h-52
            object-cover
          "
        />

        <div
          className="
            absolute
            top-4
            left-4
            px-3
            py-1
            rounded-full
            text-xs
            border
            border-zinc-700
            bg-black/70
            backdrop-blur
          "
        >
          {mod.status
            ?.charAt(0)
            .toUpperCase() +
            mod.status?.slice(1)}
            
        </div>

      </div>

      <div
        className="
          p-5
          flex
          flex-col
          h-[260px]
        "
      >

        <h3
          className="
            text-lg
            font-semibold
          "
        >
          {mod.title}
        </h3>

        <p
          className="
            mt-2
            text-sm
            text-zinc-500
          "
        >
          Released {releaseDate}
        </p>

        <div
          className="
            mt-auto
            flex
            gap-3
          "
        >

          {mod.status === "draft" ? (
            <Link
              href={`/dashboard/mods/${mod.id}/edit?preview=true`}
              className="
                flex-1
                text-center
                px-4
                py-3
                rounded-xl
                border
                border-amber-500/40
                text-amber-300
                hover:bg-amber-500/10
                transition
                text-sm
              "
            >
              Draft Preview
            </Link>
          ) : (
            <Link
              href={`/mods/${mod.id}`}
              className="
                flex-1
                text-center
                px-4
                py-3
                rounded-xl
                border
                border-zinc-700
                hover:border-purple-500
                transition
                text-sm
              "
            >
              View
            </Link>
          )}

          <Link
            href={`/dashboard/mods/${mod.id}/edit`}
            className="
              flex-1
              text-center
              px-4
              py-3
              rounded-xl
              bg-purple-600
              hover:bg-purple-500
              transition
              text-sm
            "
          >
            Edit
          </Link>

          {mod.status === "draft" && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="
              flex-1
              rounded-xl
              border
              border-emerald-500/40
              bg-emerald-500/10
              px-4
              py-3
              text-sm
              text-emerald-300
              transition
              hover:bg-emerald-500/20
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        )}

        </div>

      </div>

    </div>

  );

}