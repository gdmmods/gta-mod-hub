"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase/client";

interface Props {
  value: string;
  onUpload: (
    url: string
  ) => void;
}

export default function ImageUploader({
  value,
  onUpload,
}: Props) {

  const [uploading, setUploading] =
    useState(false);

  async function handleUpload(
    e: any
  ) {

    const file =
      e.target.files?.[0];

    if (!file)
      return;

    setUploading(true);

    const fileExt =
      file.name.split(".").pop();

    const fileName =
      `${Date.now()}.${fileExt}`;

    const filePath =
      `mods/${fileName}`;

    const {
      error,
    } = await supabase.storage
      .from(
        "creator-assets"
      )
      .upload(
        filePath,
        file
      );

    if (error) {

      console.error(error);

      alert(
        "Upload failed"
      );

      setUploading(false);

      return;

    }

    const {
      data,
    } = supabase.storage
      .from(
        "creator-assets"
      )
      .getPublicUrl(
        filePath
      );

    onUpload(
      data.publicUrl
    );

    setUploading(false);

  }

  return (

    <div
      className="
        rounded-3xl
        border
        border-zinc-800
        bg-black/40
        p-6
      "
    >

      <input
        type="file"
        accept="image/*"
        onChange={
          handleUpload
        }
        className="
          w-full
          text-sm
          text-zinc-400
        "
      />

      <p
        className="
          text-xs
          text-zinc-500
          mt-3
        "
      >
        JPG, PNG, WEBP
      </p>

      {uploading && (

        <p
          className="
            mt-4
            text-purple-400
            text-sm
          "
        >
          Uploading...
        </p>

      )}

      {value && (

        <img
          src={value}
          alt=""
          className="
            w-full
            h-64
            object-cover
            rounded-2xl
            border
            border-zinc-800
            mt-6
          "
        />

      )}

    </div>

  );

}