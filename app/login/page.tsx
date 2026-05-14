"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

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

  async function handleRegister() {

    setLoading(true);
    setError("");

    const {
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {

      setError(error.message);
      return;

    }

    alert(
      "Account created. You can now sign in."
    );

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
            Login
          </h1>

        </div>

        <form
          onSubmit={handleLogin}
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
              : "Login"}
          </button>

        </form>

        <button
          onClick={handleRegister}
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
          Create Account
        </button>

      </div>

    </main>

  );

}