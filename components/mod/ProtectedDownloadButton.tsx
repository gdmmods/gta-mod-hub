"use client";

import { useState } from "react";

interface Props {
  modId: string;
}

export default function ProtectedDownloadButton({
  modId,
}: Props) {

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function handleDownload() {

    try {

      setLoading(true);

      const res =
        await fetch(
          "/api/download-file",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              modId,
            }),
          }
        );

      const data =
        await res.json();

      if (!res.ok) {

        console.error(data);

        alert(
          "Download failed"
        );

        setLoading(false);

        return;

      }

      window.open(
        data.url,
        "_blank"
      );

    } catch (err) {

      console.error(err);

      alert(
        "Download failed"
      );

    }

    setLoading(false);

  }

  return (

    <button
      onClick={
        handleDownload
      }
      disabled={loading}
      className="
        w-full

        rounded-2xl

        bg-gradient-to-r
        from-purple-600
        to-purple-500

        py-4

        font-semibold
        text-white

        shadow-[0_0_40px_rgba(168,85,247,0.25)]

        hover:opacity-90
        transition

        disabled:opacity-50
      "
    >

      {loading
        ? "Preparing Download..."
        : "Secure Download"}

    </button>

  );

}