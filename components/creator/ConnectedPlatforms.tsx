"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase/client";

import {
  createVerificationChallenge,
} from "@/lib/connectors/gta5modsVerification";

import {
  getPlatformConnector,
} from "@/lib/connectors";

interface ConnectedPlatformsProps {
  identities: any[];
  loading: boolean;
}

export default function ConnectedPlatforms({
  identities,
  loading,
}: ConnectedPlatformsProps) {

  const [verifyingId, setVerifyingId] =
    useState<string | null>(null);

  const [verificationChallenge, setVerificationChallenge] =
    useState<any | null>(null);

  const [verificationInstructions, setVerificationInstructions] =
  useState<string | null>(null);

  async function beginVerification(
  identity: any
) {
  const challenge =
    createVerificationChallenge();

  const existingMetadata =
    identity.metadata || {};

  const metadata = {
    ...existingMetadata,
    verification: challenge,
  };

  const {
    error,
  } = await supabase
    .from("external_identities")
    .update({
      metadata,
      verification_status: "pending",
    })
    .eq("id", identity.id);

  if (error) {
    console.error(
      "VERIFICATION START ERROR:",
      error
    );
    return;
  }

  const connector =
  identity.platform?.slug
    ? getPlatformConnector(
        identity.platform.slug
      )
    : null;

let instructions:
  string | null = null;

if (
  connector?.verification?.instructions &&
  identity.profile_url
) {
  instructions =
    await connector.verification.instructions(
      identity.profile_url
    );
}

setVerificationInstructions(
  instructions
);

setVerificationChallenge(
  challenge
);

setVerifyingId(
  identity.id
);
}

  return (
    <div
      className="
        rounded-[32px]
        border
        border-zinc-800
        bg-zinc-950
        p-8
        mb-8
      "
    >

      <div className="mb-6">

        <p
          className="
            text-purple-400
            uppercase
            tracking-[0.2em]
            text-xs
            mb-3
          "
        >
          Connected Platforms
        </p>

        <h2
          className="
            text-2xl
            font-bold
            mb-2
          "
        >
          Your External Identities
        </h2>

        <p
          className="
            text-zinc-500
            text-sm
            max-w-2xl
          "
        >
          Platforms you have connected to your
          ModVault creator identity.
        </p>

      </div>

      {loading ? (

        <p className="text-zinc-500">
          Loading connected platforms...
        </p>

      ) : identities.length === 0 ? (

        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-zinc-800
            p-6
          "
        >

          <p className="text-zinc-500 text-sm">
            No platforms connected yet.
          </p>

        </div>

      ) : (

        <div className="space-y-3">

          {identities.map((identity) => (

            <div
              key={identity.id}
              className="
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-900
                p-5
                flex
                items-center
                justify-between
                gap-6
              "
            >

              <div>

                <div
                  className="
                    text-lg
                    font-semibold
                    mb-1
                  "
                >
                  {identity.platform?.name ||
                    "Platform"}
                </div>

                <div
                  className="
                    text-sm
                    text-zinc-400
                  "
                >
                  {identity.username}
                </div>

              </div>

                  <div className="text-right">

      <div
        className="
          text-xs
          uppercase
          tracking-wider
          text-zinc-500
        "
      >
        {identity.verification_status ||
          "pending"}
      </div>

      {identity.profile_url && (

        <a
          href={identity.profile_url}
          target="_blank"
          rel="noopener noreferrer"
          className="
            block
            mt-2
            text-sm
            text-purple-400
            hover:text-purple-300
            transition
          "
        >
          View Profile →
        </a>

      )}

      {identity.verification_status !== "verified" && (

        <button
          type="button"
          onClick={() =>
            setVerifyingId(
              verifyingId === identity.id
                ? null
                : identity.id
            )
          }
          className="
            mt-2
            text-sm
            text-zinc-300
            hover:text-white
            transition
          "
        >
          {verifyingId === identity.id
            ? "Cancel Verification"
            : "Verify Identity"}
        </button>

      )}

    </div>

    {verifyingId === identity.id && (

      <div
        className="
          mt-5
          rounded-2xl
          border
          border-zinc-800
          bg-black
          p-5
        "
      >

        <p
          className="
            text-xs
            uppercase
            tracking-[0.2em]
            text-purple-400
            mb-2
          "
        >
          Identity Verification
        </p>

        <p className="text-sm text-zinc-400">
          Verify that you control this
          {identity.platform?.name
            ? ` ${identity.platform.name}`
            : ""} identity before using it
          for project discovery.
        </p>

        {verificationChallenge &&
          verifyingId === identity.id && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                Your verification code
              </p>

              <div className="
                rounded-lg
                border
                border-zinc-700
                bg-zinc-900
                px-4
                py-3
                font-mono
                text-lg
                tracking-wider
              ">
                {verificationChallenge.code}
              </div>
            </div>
          )}

          {verificationInstructions &&
            verifyingId === identity.id && (
              <p
                className="
                  mt-4
                  text-sm
                  text-zinc-400
                "
              >
                {verificationInstructions}
              </p>
            )}

        <div className="mt-4">

          <button
            type="button"
              onClick={() =>
                beginVerification(identity)
              }
            className="
              px-4
              py-2
              rounded-lg
              bg-purple-600
              hover:bg-purple-500
              text-sm
              transition
            "
          >
            Begin Verification
          </button>

        </div>

      </div>

    )}

  </div>


          ))}

        </div>

      )}

    </div>
  );
}