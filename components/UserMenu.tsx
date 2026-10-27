"use client";

import Link from "next/link";
import { useCreatorContext } from "@/app/contexts/CreatorContext";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase/client";

export default function UserMenu() {

  const { activeCreatorId } = useCreatorContext();

  const [open, setOpen] =
    useState(false);

  const [session, setSession] =
    useState<any>(null);
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

    useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) setSession(session);
    }

    void loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* --------------------------------
     LOGOUT
  -------------------------------- */
  async function handleLogout() {

    await supabase.auth.signOut();

    setOpen(false);

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
        {session
          ? "Account"
          : "Login"}
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

          {session ? (

            <>

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
                📊 Mods Dashboard
              </Link>

              {/* PROFILE SETTINGS */}

              <Link
                href="/settings"
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
                ⚙️ Profile Settings
              </Link>

              {/* MY CREATOR PROFILE */}

              {activeCreatorId && (

                <Link
                  href={`/creator/${activeCreatorId}`}
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

            </>

          ) : (

            <Link
              href="/login"
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
              🔑 Login
            </Link>

          )}

        </div>

      )}

    </div>

  );

}