"use client";

import { useState } from "react";

interface Props {
  form: any;
  setForm: any;
}

export default function UploadProtectedFileSection({
  form,
  setForm,
}: Props) {

  const [
    uploading,
    setUploading,
  ] = useState(false);

  async function handleFileUpload(
    e: any
  ) {

    const file =
      e.target.files?.[0];

    if (!file) return;

    setUploading(true);

    try {

      setForm({
        ...form,
        protectedFile: file,
      });

    } catch (err) {

      console.error(err);

      alert(
        "Upload failed"
      );

    }

    setUploading(false);

  }

  return (

    <section
      className="
        rounded-[32px]
        border
        border-zinc-900
        bg-zinc-950/50
        p-7
        space-y-6
        opacity-70
      "
    >

      {/* HEADER */}
      <div>

        <p
          className="
            text-sm
            uppercase
            tracking-[0.2em]
            text-purple-400
          "
        >
          Protected Files
        </p>

        <div
          className="
            flex
            items-center
            gap-3
            mt-2
          "
        >

          <h2
            className="
              text-2xl
              font-black
            "
          >
            Secure Mod Delivery
          </h2>

          <span
            className="
              rounded-full
              border
              border-purple-500/20

              bg-purple-500/10

              px-3
              py-1

              text-[10px]
              uppercase
              tracking-[0.2em]

              text-purple-300
            "
          >
            Coming Soon
          </span>

        </div>

        <p
          className="
            text-sm
            text-zinc-500
            mt-3
            max-w-2xl
            leading-relaxed
          "
        >
          Upload ZIP archives directly to ModVault.
          Files will be securely stored in private
          infrastructure and delivered through
          protected access systems once the native
          marketplace launches.
        </p>

      </div>

      {/* DISABLED INPUT */}
      <div>

        <label
          className="
            flex
            flex-col
            items-center
            justify-center

            rounded-3xl
            border
            border-dashed
            border-zinc-800

            bg-black/20

            px-8
            py-14

            cursor-not-allowed

            opacity-50
          "
        >

          <input
            type="file"
            disabled
            accept=".zip,.rar,.7z"
            className="hidden"
            onChange={
              handleFileUpload
            }
          />

          <div
            className="
              text-5xl
              mb-4
            "
          >
            📦
          </div>

          <p
            className="
              font-semibold
              text-lg
            "
          >
            Protected Uploads Unavailable
          </p>

          <p
            className="
              text-sm
              text-zinc-500
              mt-2
            "
          >
            Native marketplace delivery is still in development
          </p>

        </label>

      </div>

      {/* FILE INFO */}
      {form.protectedFile && (

        <div
          className="
            rounded-2xl
            border
            border-emerald-500/20
            bg-emerald-500/10
            px-5
            py-4
          "
        >

          <p className="font-medium">
            {form.protectedFile.name}
          </p>

          <p
            className="
              text-sm
              text-zinc-400
              mt-1
            "
          >
            {(
              form.protectedFile.size /
              1024 /
              1024
            ).toFixed(2)} MB
          </p>

        </div>

      )}

      {/* STATUS */}
      {uploading && (

        <div
          className="
            text-sm
            text-purple-300
          "
        >
          Uploading...
        </div>

      )}

    </section>

  );

}