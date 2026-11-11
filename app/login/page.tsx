"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NewHandleField, { checkNewHandle } from "@/components/profile/NewHandleField";

import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [handle, setHandle] = useState("");
  const [registering, setRegistering] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleLogin(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setLoading(true);
    setError("");

    const {
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {

      setError(error.message);
      return;

    }

    router.push("/");

  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const candidate = handle.trim().toLowerCase();
      const unavailable = await checkNewHandle(candidate, true);
      if (unavailable) {
        setError(unavailable);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { handle: candidate } },
      });
      if (error) {
        setError((await checkNewHandle(candidate, true)) ?? error.message);
      } else if (data.session) {
        router.push("/");
      } else {
        alert("Check your email to confirm your account.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (

    <main
      className="
        min-h-screen
        bg-black
        text-white
        flex
        items-center
        justify-center
        px-6
      "
    >

      <div
        className="
          w-full
          max-w-md
          rounded-[32px]
          border
          border-zinc-800
          bg-zinc-950/70
          backdrop-blur-xl
          p-8
        "
      >

        <div className="mb-8">

          <p
            className="
              text-sm
              uppercase
              tracking-[0.2em]
              text-purple-400
            "
          >
            ModVault
          </p>

          <h1
            className="
              text-4xl
              font-black
              mt-3
            "
          >
            {registering ? "Create Account" : "Login"}
          </h1>

        </div>

        <form
          onSubmit={registering ? handleRegister : handleLogin}
          className="space-y-5"
        >

          <div>

            <label
              className="
                text-sm
                text-zinc-400
              "
            >
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="
                mt-2
                w-full
                rounded-2xl
                border
                border-zinc-800
                bg-black/40
                px-4
                py-3
                outline-none
                focus:border-purple-500
              "
            />

          </div>

          <div>

            <label
              className="
                text-sm
                text-zinc-400
              "
            >
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              className="
                mt-2
                w-full
                rounded-2xl
                border
                border-zinc-800
                bg-black/40
                px-4
                py-3
                outline-none
                focus:border-purple-500
              "
            />

          </div>

          {registering && <NewHandleField value={handle} onChange={setHandle} />}

          {error && (

            <div
              className="
                text-sm
                text-red-400
              "
            >
              {error}
            </div>

          )}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              rounded-2xl
              bg-gradient-to-r
              from-purple-600
              to-pink-500
              py-3
              font-semibold
              hover:opacity-90
              transition
            "
          >
            {loading
              ? "Loading..."
              : registering ? "Create Account" : "Login"}
          </button>

        </form>

        <button
          type="button"
          disabled={loading}
          onClick={() => { setError(""); setRegistering(!registering); }}
          className="
            mt-5
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-black/30
            py-3
            text-zinc-300
            hover:bg-zinc-900
            transition
          "
        >
          {registering ? "Back to Login" : "Create Account"}
        </button>

      </div>

    </main>

  );

}