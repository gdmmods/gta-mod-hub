"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  creator: any;
};

export default function CreatorEditForm({
  creator,
}: Props) {

  const router = useRouter();

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState({
      name:
        creator.name || "",

      bio:
        creator.bio || "",

      avatar:
        creator.avatar || "",

      banner:
        creator.banner || "",

      tagline:
        creator.tagline || "",

      location:
        creator.location || "",

      status:
        creator.status || "",

      specialization:
        creator.specialization || [],

      socials:
        creator.socials || {},
    });

  /* -----------------------------
     UPDATE FIELD
  ----------------------------- */
  const updateField = (
    key: string,
    value: any
  ) => {

    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));

  };

  /* -----------------------------
     IMAGE UPLOAD
  ----------------------------- */
  const uploadImage = async (
    file: File,
    folder: string
  ) => {

    const fileExt =
      file.name
        .split(".")
        .pop();

    const fileName =
      `${folder}/${Date.now()}.${fileExt}`;

    const { error } =
      await supabase.storage
        .from(
          "creator-assets"
        )
        .upload(
          fileName,
          file,
          {
            upsert: true,
          }
        );

    if (error) {

      console.error(
        "UPLOAD ERROR:",
        error
      );

      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(
        "creator-assets"
      )
      .getPublicUrl(
        fileName
      );

    return publicUrl;
  };

  /* -----------------------------
     SAVE
  ----------------------------- */
  const handleSave =
    async () => {

      setSaving(true);

      const { error } =
        await supabase
          .from("creators")
          .update(form)
          .eq(
            "id",
            creator.id
          );

      if (error) {

        console.error(
          "SAVE ERROR:",
          error
        );

        alert(
          "Failed to save creator."
        );

        setSaving(false);

        return;
      }

      router.push(
        `/creator/${creator.id}`
      );

      router.refresh();
    };

  return (

    <div className="space-y-10">

      {/* BASIC */}
      <section className="space-y-4">

        <h2 className="text-xl font-bold">
          Basic Information
        </h2>

        <input
          value={form.name}
          onChange={(e) =>
            updateField(
              "name",
              e.target.value
            )
          }
          placeholder="Creator Name"
          className="
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950
            px-5
            py-4
            outline-none
          "
        />

        <textarea
          value={form.bio}
          onChange={(e) =>
            updateField(
              "bio",
              e.target.value
            )
          }
          placeholder="Biography"
          rows={6}
          className="
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950
            px-5
            py-4
            outline-none
            resize-none
          "
        />

      </section>

      {/* BRANDING */}
      <section className="space-y-6">

        <h2 className="text-xl font-bold">
          Branding
        </h2>

        {/* AVATAR */}
        <div className="space-y-3">

          <p className="text-sm text-zinc-500">
            Avatar
          </p>

          {form.avatar && (

            <img
              src={form.avatar}
              alt="Avatar Preview"
              className="
                w-32
                h-32
                rounded-[28px]
                object-cover
                border
                border-zinc-800
              "
            />

          )}

          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {

              const file =
                e.target
                  .files?.[0];

              if (!file)
                return;

              const url =
                await uploadImage(
                  file,
                  "avatars"
                );

              if (url) {

                updateField(
                  "avatar",
                  url
                );

              }

            }}
            className="
              block
              w-full
              text-sm
              text-zinc-400
            "
          />

        </div>

        {/* BANNER */}
        <div className="space-y-3">

          <p className="text-sm text-zinc-500">
            Banner
          </p>

          {form.banner && (

            <img
              src={form.banner}
              alt="Banner Preview"
              className="
                w-full
                h-52
                rounded-[28px]
                object-cover
                border
                border-zinc-800
              "
            />

          )}

          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {

              const file =
                e.target
                  .files?.[0];

              if (!file)
                return;

              const url =
                await uploadImage(
                  file,
                  "banners"
                );

              if (url) {

                updateField(
                  "banner",
                  url
                );

              }

            }}
            className="
              block
              w-full
              text-sm
              text-zinc-400
            "
          />

        </div>

      </section>

      {/* PROFILE */}
      <section className="space-y-4">

        <h2 className="text-xl font-bold">
          Profile Details
        </h2>

        <input
          value={form.tagline}
          onChange={(e) =>
            updateField(
              "tagline",
              e.target.value
            )
          }
          placeholder="Tagline"
          className="
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950
            px-5
            py-4
          "
        />

        <input
          value={form.location}
          onChange={(e) =>
            updateField(
              "location",
              e.target.value
            )
          }
          placeholder="Location"
          className="
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950
            px-5
            py-4
          "
        />

        <input
          value={form.status}
          onChange={(e) =>
            updateField(
              "status",
              e.target.value
            )
          }
          placeholder="Current Status"
          className="
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950
            px-5
            py-4
          "
        />

      </section>

      {/* SPECIALIZATION */}
      <section className="space-y-4">

        <h2 className="text-xl font-bold">
          Specializations
        </h2>

        <input
          value={
            form.specialization.join(
              ", "
            )
          }
          onChange={(e) =>
            updateField(
              "specialization",
              e.target.value
                .split(",")
                .map((s) =>
                  s.trim()
                )
            )
          }
          placeholder="Vehicles, Physics, Graphics"
          className="
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950
            px-5
            py-4
          "
        />

      </section>

      {/* SOCIALS */}
      <section className="space-y-4">

        <h2 className="text-xl font-bold">
          Social Links
        </h2>

        {[
          "website",
          "discord",
          "youtube",
          "twitter",
          "instagram",
        ].map((platform) => (

          <input
            key={platform}
            value={
              form.socials[
                platform
              ] || ""
            }
            onChange={(e) =>
              updateField(
                "socials",
                {
                  ...form.socials,
                  [platform]:
                    e.target
                      .value,
                }
              )
            }
            placeholder={`${platform} URL`}
            className="
              w-full
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-950
              px-5
              py-4
            "
          />

        ))}

      </section>

      {/* SAVE */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="
          w-full
          rounded-2xl
          bg-gradient-to-r
          from-purple-600
          to-pink-500
          py-4
          font-semibold
          text-white
          transition
          hover:opacity-90
          disabled:opacity-50
        "
      >
        {saving
          ? "Saving..."
          : "Save Creator"}
      </button>

    </div>

  );
}