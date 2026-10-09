"use client";

import { useState } from "react";
import { getPlatformConnector } from "@/lib/connectors";

interface ConnectedPlatformsProps {
  identities: any[];
  loading: boolean;
}

interface VerificationChallenge {
  code: string;
  createdAt: string;
  expiresAt?: string;
  status: "pending" | "verified" | "expired";
  attempts?: number;
}

export default function ConnectedPlatforms({
  identities,
  loading,
}: ConnectedPlatformsProps) {
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const [verificationChallenge, setVerificationChallenge] =
    useState<VerificationChallenge | null>(null);

  const [verificationInstructions, setVerificationInstructions] =
    useState<string | null>(null);

  const [checkingVerification, setCheckingVerification] =
    useState(false);

  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(
    () => new Set()
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(
    null
  );

  async function openVerification(identity: any) {
    if (verifyingId === identity.id) {
      setVerifyingId(null);
      setVerificationChallenge(null);
      setVerificationInstructions(null);
      setErrorMessage(null);
      setSuccessMessage(null);
      return;
    }

    setVerifyingId(identity.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    const savedChallenge = identity.metadata?.verification;

    const challengeIsValid =
      savedChallenge?.code &&
      savedChallenge.status === "pending" &&
      (
        !savedChallenge.expiresAt ||
        Date.parse(savedChallenge.expiresAt) > Date.now()
      );

    setVerificationChallenge(
      challengeIsValid ? savedChallenge : null
    );

    const connector = identity.platform?.slug
      ? getPlatformConnector(identity.platform.slug)
      : null;

    let instructions: string | null = null;

    if (
      connector?.verification?.instructions &&
      identity.profile_url
    ) {
      try {
        instructions = await connector.verification.instructions(
          identity.profile_url
        );
      } catch (error) {
        console.error("VERIFICATION INSTRUCTIONS ERROR:", error);
      }
    }

    setVerificationInstructions(instructions);
  }

  async function beginVerification(identity: any) {
    setCheckingVerification(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/verify-platform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
          identityId: identity.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.error || "Could not start verification."
        );
        return;
      }

      if (result.verified) {
        setVerifiedIds((previous) => {
          const next = new Set(previous);
          next.add(identity.id);
          return next;
        });

        setVerificationChallenge(null);
        setSuccessMessage("This identity is already verified.");
        return;
      }

      if (!result.challenge?.code) {
        setErrorMessage("The server did not return a verification code.");
        return;
      }

      setVerificationChallenge(result.challenge);
      setSuccessMessage(
        "Verification code created. Add it to your public profile comments."
      );
    } catch (error) {
      console.error("VERIFICATION START ERROR:", error);
      setErrorMessage("Could not contact the verification service.");
    } finally {
      setCheckingVerification(false);
    }
  }

  async function checkVerification(identity: any) {
    setCheckingVerification(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/verify-platform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "check",
          identityId: identity.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.error || "Verification could not be completed."
        );

        if (
          typeof result.error === "string" &&
          result.error.toLowerCase().includes("expired")
        ) {
          setVerificationChallenge(null);
        }

        return;
      }

      if (!result.verified) {
        setErrorMessage(
          result.message ||
            "The verification code was not found. Make sure your comment is public and try again."
        );

        return;
      }

      setVerifiedIds((previous) => {
        const next = new Set(previous);
        next.add(identity.id);
        return next;
      });

      setVerificationChallenge(null);

      setSuccessMessage("Identity verified successfully.");
    } catch (error) {
      console.error("VERIFICATION CHECK ERROR:", error);
      setErrorMessage("Could not contact the verification service.");
    } finally {
      setCheckingVerification(false);
    }
  }

  return (
    <div
      className="
        mb-8
        rounded-[32px]
        border
        border-zinc-800
        bg-zinc-950
        p-8
      "
    >
      <div className="mb-6">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-purple-400">
          Connected Platforms
        </p>

        <h2 className="mb-2 text-2xl font-bold">
          Your External Identities
        </h2>

        <p className="max-w-2xl text-sm text-zinc-500">
          Platforms you have connected to your ModVault creator identity.
        </p>
      </div>

      {loading ? (
        <p className="text-zinc-500">
          Loading connected platforms...
        </p>
      ) : identities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-6">
          <p className="text-sm text-zinc-500">
            No platforms connected yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {identities.map((identity) => {
            const isVerified =
              identity.verification_status === "verified" ||
              verifiedIds.has(identity.id);

            const isOpen = verifyingId === identity.id;

            const challengeExpired =
              verificationChallenge?.expiresAt &&
              Date.parse(verificationChallenge.expiresAt) <= Date.now();

            const hasActiveChallenge =
              !!verificationChallenge?.code &&
              verificationChallenge.status === "pending" &&
              !challengeExpired;

            return (
              <div
                key={identity.id}
                className="
                  rounded-2xl
                  border
                  border-zinc-800
                  bg-zinc-900
                  p-5
                "
              >
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <div className="mb-1 text-lg font-semibold">
                      {identity.platform?.name || "Platform"}
                    </div>

                    <div className="text-sm text-zinc-400">
                      {identity.username}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider ${
                        isVerified
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {isVerified ? "✓ VERIFIED" : "◷ NOT VERIFIED"}
                    </div>

                    {identity.profile_url && (
                      <a
                        href={identity.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          mt-2
                          block
                          text-sm
                          text-purple-400
                          transition
                          hover:text-purple-300
                        "
                      >
                        View Profile →
                      </a>
                    )}

                    {!isVerified && (
                      <button
                        type="button"
                        onClick={() => openVerification(identity)}
                        className="
                          mt-2
                          text-sm
                          text-zinc-300
                          transition
                          hover:text-white
                        "
                      >
                        {isOpen
                          ? "Cancel Verification"
                          : "Verify Identity"}
                      </button>
                    )}
                  </div>
                </div>

                {isOpen && !isVerified && (
                  <div className="mt-5 rounded-2xl border border-zinc-800 bg-black p-5">
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-purple-400">
                      Identity Verification
                    </p>

                    <p className="text-sm text-zinc-400">
                      Verify that you control this
                      {identity.platform?.name
                        ? ` ${identity.platform.name}`
                        : ""}{" "}
                      identity before using it for project discovery.
                    </p>

                    {hasActiveChallenge && (
                      <div className="mt-5">
                        <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
                          Your verification code
                        </p>

                        <div
                          className="
                            rounded-lg
                            border
                            border-zinc-700
                            bg-zinc-900
                            px-4
                            py-3
                            font-mono
                            text-lg
                            tracking-wider
                          "
                        >
                          {verificationChallenge?.code}
                        </div>

                        {verificationChallenge?.expiresAt && (
                          <p className="mt-2 text-xs text-zinc-500">
                            Expires{" "}
                            {new Date(
                              verificationChallenge.expiresAt
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {verificationInstructions && (
                      <p className="mt-4 text-sm text-zinc-400">
                        {verificationInstructions}
                      </p>
                    )}

                    {errorMessage && (
                      <p
                        role="alert"
                        className="mt-4 text-sm text-red-400"
                      >
                        {errorMessage}
                      </p>
                    )}

                    {successMessage && (
                      <p
                        role="status"
                        className="mt-4 text-sm text-emerald-400"
                      >
                        {successMessage}
                      </p>
                    )}

                    <div className="mt-4">
                      <button
                        type="button"
                        disabled={checkingVerification}
                        onClick={() =>
                          hasActiveChallenge
                            ? checkVerification(identity)
                            : beginVerification(identity)
                        }
                        className="
                          rounded-lg
                          bg-purple-600
                          px-4
                          py-2
                          text-sm
                          transition
                          hover:bg-purple-500
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        {checkingVerification
                          ? "Please wait..."
                          : hasActiveChallenge
                            ? "Check Verification"
                            : "Begin Verification"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}