"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase/client";

interface Props {
  value: string;
  onUpload: (
    urls: string[]
  ) => void;
}

export default function MultiImageUploader({
  value,
  onUpload,
}: Props) {

  const [uploading, setUploading] =
    useState(false);

  let parsedImages: string[] =
    [];

  try {

    parsedImages =
      value
        ? JSON.parse(value)
        : [];

  } catch {

    parsedImages = [];

  }

  async function handleUpload(
    e: any
  ) {

    const files =
      e.target.files;

    if (!files?.length)
      return;

    setUploading(true);

    const uploadedUrls: string[] =
      [];

    for (
      let i = 0;
      i < files.length;
      i++
    ) {

      const file =
        files[i];

      const fileExt =
        file.name.split(".").pop();

      const fileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

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

      uploadedUrls.push(
        data.publicUrl
      );

    }

    onUpload([
      ...parsedImages,
      ...uploadedUrls,
    ]);

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
        multiple
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

      {!!parsedImages.length && (

        <div
          className="
            grid
            grid-cols-2
            gap-4
            mt-6
          "
        >

          {parsedImages.map(
            (
              image,
              index
            ) => (

              <img
                key={index}
                src={image}
                alt=""
                className="
                  w-full
                  h-36
                  object-cover
                  rounded-2xl
                  border
                  border-zinc-800
                "
              />

            )
          )}

        </div>

      )}

    </div>

  );

}