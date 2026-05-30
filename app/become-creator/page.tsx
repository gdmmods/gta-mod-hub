"use client";

import Navbar from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";

export default function BecomeCreatorPage() {
  const router = useRouter();

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black text-white">
        <div className="max-w-5xl mx-auto px-6 py-24">

          <p className="text-purple-400 uppercase tracking-[0.3em] text-sm mb-4">
            Creator Onboarding
          </p>

          <h1 className="text-5xl font-bold mb-4">
            Become a Creator
          </h1>

          <p className="text-zinc-400 mb-12">
            Choose how you want to join ModVault.
          </p>

          <div className="grid md:grid-cols-2 gap-6">

            <button
              onClick={() => router.push("/create-creator")}
              className="
                rounded-[32px]
                border
                border-zinc-800
                bg-zinc-950
                p-8
                text-left
                hover:border-purple-500
                transition
              "
            >
              <h2 className="text-2xl font-bold mb-3">
                Create New Creator
              </h2>

              <p className="text-zinc-400">
                Start a brand new creator profile and begin publishing mods.
              </p>
            </button>

            <button
              onClick={() => router.push("/claim-creator")}
              className="
                rounded-[32px]
                border
                border-zinc-800
                bg-zinc-950
                p-8
                text-left
                hover:border-purple-500
                transition
              "
            >
              <h2 className="text-2xl font-bold mb-3">
                Claim Existing Creator
              </h2>

              <p className="text-zinc-400">
                Search for an existing creator profile and request ownership.
              </p>
            </button>

          </div>

        </div>
      </main>
    </>
  );
}