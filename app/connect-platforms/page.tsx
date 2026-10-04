"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

import Navbar from "@/components/layout/Navbar";
import PlatformPicker from "@/components/creator/PlatformPicker";
import ConnectIdentityForm from "@/components/creator/ConnectIdentityForm";
import ConnectedPlatforms from "@/components/creator/ConnectedPlatforms";
import PlatformConnectionSuccess
  from "@/components/creator/PlatformConnectionSuccess";

export default function ConnectPlatformsPage() {

  const [platforms, setPlatforms] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showPicker, setShowPicker] =
    useState(false);

    const [selectedPlatform, setSelectedPlatform] =
    useState<any | null>(null);

    const [username, setUsername] =
    useState("");

    const [profileUrl, setProfileUrl] =
    useState("");

    const [currentCreatorId, setCurrentCreatorId] =
    useState<string | null>(null);

    const [saving, setSaving] =
    useState(false);

    const [identities, setIdentities] =
    useState<any[]>([]);

    const [identitiesLoading, setIdentitiesLoading] =
    useState(true);

    const [connectedPlatformName, setConnectedPlatformName] =
    useState<string | null>(null);

    async function loadConnectedIdentities(
        creatorId: string
        ) {
        const {
            data,
            error,
        } = await supabase
            .from("external_identities")
            .select(`
            id,
            username,
            profile_url,
            verification_status,
            connected_at,
            metadata,
            platform:platforms (
                id,
                name,
                slug
            )
            `)
            .eq(
            "creator_id",
            creatorId
            )
            .order(
            "connected_at",
            {
                ascending: false,
            }
            );

        if (error) {

            console.error(
            "CONNECTED IDENTITIES ERROR:",
            error
            );

            return;

        }

        setIdentities(
            data || []
        );

        setIdentitiesLoading(false);
        }

  useEffect(() => {

    async function loadPlatforms() {


    const {
        data: {
        session,
        },
    } = await supabase.auth.getSession();

    if (!session) {
        setLoading(false);
        return;
    }

    const {
        data: profile,
        error: profileError,
    } = await supabase
        .from("profiles")
        .select("default_creator_id")
        .eq("id", session.user.id)
        .single();

    if (profileError) {
        console.error(
        "PROFILE LOAD ERROR:",
        profileError
        );

        setLoading(false);
        return;
    }

    setCurrentCreatorId(
        profile?.default_creator_id || null
    );

    if (profile?.default_creator_id) {

  await loadConnectedIdentities(
    profile.default_creator_id
  );

} else {

  setIdentities([]);
  setIdentitiesLoading(false);

}

    const {
        data,
        error,
    } = await supabase
            .from("platforms")
            .select(`
            id,
            name,
            slug,
            status
            `)
            .eq(
            "status",
            "active"
            )
            .order("name");

        if (error) {

            console.error(
            "PLATFORM LOAD ERROR:",
            error
            );

            setLoading(false);

            return;
        }

        setPlatforms(
            data || []
        );

        setLoading(false);
        }

        loadPlatforms();

    }, []);

  return (
    <>
      <Navbar />

      <main
        className="
          min-h-screen
          bg-black
          text-white
        "
      >

        <div
          className="
            max-w-5xl
            mx-auto
            px-6
            py-24
          "
        >

          <p
            className="
              text-purple-400
              uppercase
              tracking-[0.3em]
              text-sm
              mb-4
            "
          >
            Creator Onboarding
          </p>

          <h1
            className="
              text-5xl
              font-bold
              mb-6
            "
          >
            Connect Your Platforms
          </h1>

          <p
            className="
              text-zinc-400
              max-w-2xl
              mb-10
            "
          >
            Connect the platforms where your
            creative work already exists.
            Your external identities can then
            become part of your ModVault creator
            history.
          </p>

            <ConnectedPlatforms
                identities={identities}
                loading={identitiesLoading}
                />

        {connectedPlatformName && (

            <PlatformConnectionSuccess
                platformName={
                connectedPlatformName
                }

                onConnectAnother={() => {
                setConnectedPlatformName(null);
                setShowPicker(true);
                }}

                onContinue={() => {
                console.log(
                    "Continue to Your Mods"
                );
                }}

                onDashboard={() => {
                window.location.href =
                    "/dashboard";
                }}
            />

            )}

          {/* CONNECT ACTION */}

            {!connectedPlatformName && (

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

            <div
              className="
                flex
                items-center
                justify-between
                gap-6
              "
            >

              <div>

                <h2
                  className="
                    text-xl
                    font-bold
                    mb-2
                  "
                >
                  External Platforms
                </h2>

                <p
                  className="
                    text-zinc-500
                    text-sm
                  "
                >
                  Add a platform identity to
                  your creator profile.
                </p>

              </div>

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <a
                  href="/discover-mods"
                  className="
                    inline-flex
                    px-5
                    py-3
                    rounded-xl
                    border
                    border-zinc-700
                    hover:border-purple-500
                    hover:text-purple-300
                    transition
                    font-medium
                  "
                >
                  Discover Your Mods →
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setShowPicker(true);
                    setSelectedPlatform(null);
                    setUsername("");
                    setProfileUrl("");
                  }}
                  className="
                    shrink-0
                    px-5
                    py-3
                    rounded-xl
                    bg-purple-600
                    hover:bg-purple-500
                    transition
                    font-medium
                  "
                >
                  + Connect Platform
                </button>
              </div>

            </div>

          </div>

        )}

        {showPicker && (

        <PlatformPicker
            platforms={platforms}
            loading={loading}
            onSelect={(platform) => {
            setSelectedPlatform(platform);
            setUsername("");
            setProfileUrl("");
            }}
        />

        )}

        {!connectedPlatformName && showPicker && (

        <ConnectIdentityForm
            platform={selectedPlatform}
            username={username}
            profileUrl={profileUrl}
            saving={saving}

            onUsernameChange={setUsername}

            onProfileUrlChange={setProfileUrl}

            onCancel={() => {
            setSelectedPlatform(null);
            setUsername("");
            setProfileUrl("");
            }}

            onConnect={async () => {

                if (
                    !currentCreatorId ||
                    !selectedPlatform ||
                    !username.trim()
                ) {
                    return;
                }

                setSaving(true);

                const {
                    error,
                } = await supabase
                    .from("external_identities")
                    .insert({
                    creator_id:
                        currentCreatorId,

                    platform_id:
                        selectedPlatform.id,

                    username:
                        username.trim(),

                    profile_url:
                        profileUrl.trim() || null,
                    });

                if (error) {

                    console.error(
                    "EXTERNAL IDENTITY ERROR:",
                    error
                    );

                    setSaving(false);

                    return;
                }

                const {
                  error: eventError,
                } = await supabase
                  .from("activity_events")
                  .insert({
                    event_type:
                      "creator_connected_platform",

                    target_type:
                      "creator",

                    target_id:
                      currentCreatorId,

                    visibility:
                      "public",

                    title:
                      `${selectedPlatform.name} connected`,

                    summary:
                      `Connected ${username.trim()} on ${selectedPlatform.name}.`,

                    metadata: {
                      platform_id:
                        selectedPlatform.id,

                      platform_name:
                        selectedPlatform.name,

                      username:
                        username.trim(),

                      profile_url:
                        profileUrl.trim() || null,
                    },

                    actor_type:
                      "creator",

                    actor_id:
                      currentCreatorId,
                  });

                if (eventError) {

                  console.error(
                    "ACTIVITY EVENT ERROR:",
                    eventError
                  );

                }

                await loadConnectedIdentities(
                    currentCreatorId
                );

                setConnectedPlatformName(
                    selectedPlatform.name
                );

                setShowPicker(false);

                setSaving(false);

                setSelectedPlatform(null);
                setUsername("");
                setProfileUrl("");

                }}
        />

        

        )}

        </div>



      </main>
    </>
  );
}