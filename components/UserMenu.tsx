"use client";

import Link from "next/link";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase/client";

export default function UserMenu() {

  const [open, setOpen] =
    useState(false);

  const [
    creatorId,
    setCreatorId,
  ] = useState<string | null>(
    null
  );

  const menuRef =
    useRef<HTMLDivElement>(null);

  /* --------------------------------
     CLOSE ON OUTSIDE CLICK
  -------------------------------- */

  useEffect(() => {

    function handleClickOutside(
      event: MouseEvent
    ) {

      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {

        setOpen(false);

      }

    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, []);

  /* --------------------------------
     LOAD CREATOR ID
  -------------------------------- */

  useEffect(() => {

    async function loadCreator() {

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session)
        return;

      const {
        data,
        error,
      } = await supabase
        .from(
          "creator_members"
        )
        .select(`
          creator_id
        `)
        .eq(
          "profile_id",
          session.user.id
        )
        .eq(
          "status",
          "approved"
        )
        .maybeSingle();

      if (error) {

        console.error(
          "USER MENU CREATOR LOAD ERROR:",
          error
        );

        return;

      }

      if (
        data?.creator_id
      ) {

        setCreatorId(
          data.creator_id
        );

      }

    }

    loadCreator();

  }, []);

  /* --------------------------------
     LOGOUT
  -------------------------------- */

  async function handleLogout() {

    await supabase.auth.signOut();

    window.location.href = "/";

  }

  return (

    <div
      ref={menuRef}
      className="relative"
    >

      {/* BUTTON */}

      <button
        onClick={() =>
          setOpen(!open)
        }
        className="
          flex
          items-center
          justify-center

          h-11
          px-5

          rounded-xl

          border
          border-zinc-800

          bg-zinc-950

          text-sm
          text-white

          hover:border-zinc-700

          transition
        "
      >
        Account
      </button>

      {/* DROPDOWN */}

      {open && (

        <div
          className="
            absolute
            right-0
            top-full
            mt-6
            w-56

            bg-zinc-900/95
            backdrop-blur-xl

            border
            border-zinc-800

            rounded-2xl
            overflow-hidden

            shadow-2xl

            z-50
          "
        >

          {/* FAVORITES */}

          <Link
            href="/favorites"
            className="
              flex
              items-center
              gap-3

              px-4
              py-3

              hover:bg-zinc-800

              transition
              text-sm
            "
            onClick={() =>
              setOpen(false)
            }
          >
            ❤️ Favorites
          </Link>

          {/* DASHBOARD */}

          <Link
            href="/dashboard"
            className="
              flex
              items-center
              gap-3

              px-4
              py-3

              hover:bg-zinc-800

              transition
              text-sm
            "
            onClick={() =>
              setOpen(false)
            }
          >
            📊 Dashboard
          </Link>

          {/* MY CREATOR PROFILE */}

          {creatorId && (

            <Link
              href={`/creator/${creatorId}`}
              className="
                flex
                items-center
                gap-3

                px-4
                py-3

                hover:bg-zinc-800

                transition
                text-sm
              "
              onClick={() =>
                setOpen(false)
              }
            >
              👤 My Creator Profile
            </Link>

          )}

          <div
            className="
              h-px
              bg-zinc-800
            "
          />

          {/* LOGOUT */}

          <button
            onClick={
              handleLogout
            }
            className="
              w-full

              flex
              items-center
              gap-3

              px-4
              py-3

              hover:bg-red-500/10

              text-red-400
              text-sm

              transition
            "
          >
            🚪 Logout
          </button>

        </div>

      )}

    </div>

  );

}