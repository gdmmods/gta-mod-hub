"use client";

import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { HeartHandshake } from "lucide-react";
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

  const { accountId, activeCreator, loading } = useCreatorContext();

  const [open, setOpen] =
    useState(false);

  const [session, setSession] =
    useState<Session | null>(null);
  const [personalProfile, setPersonalProfile] = useState<{ id: string; username: string | null } | null>(null);
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

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;

    let current = true;
    void (async () => {
      const { data } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
      if (current) setPersonalProfile({ id: userId, username: data?.username ?? null });
    })();
    return () => { current = false; };
  }, [userId]);

  const creator = userId === accountId ? activeCreator : null;
  const profileLoaded = personalProfile !== null && personalProfile.id === userId;
  const username = profileLoaded ? personalProfile.username : null;
  const profileLabel = creator
    ? (creator.owner_type === "team" ? "My Team Profile" : "My Creator Profile")
    : "My User Profile";
  const profileHref = creator ? `/creator/${creator.id}`
    : username ? `/profile/${encodeURIComponent(username)}` : "/settings";
  const profilePending = !creator && (loading || !profileLoaded);
  const profileClassName = "flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition text-sm";

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

              <Link href="/discussions" onClick={() => setOpen(false)} className="flex px-4 py-3 text-sm transition hover:bg-zinc-800">Discussions</Link>

              <Link href="/following" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-zinc-800">
                <HeartHandshake aria-hidden="true" className="size-4 text-purple-400" /> Following
              </Link>

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

              {profilePending ? (
                <span aria-disabled="true" className={profileClassName}>
                  👤 {profileLabel}
                </span>
              ) : (
                <Link href={profileHref} className={profileClassName} onClick={() => setOpen(false)}>
                  👤 {profileLabel}
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