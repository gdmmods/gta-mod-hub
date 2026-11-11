"use client";

import { modSubmitAction, uploadPublicationStatus } from "@/lib/forms/mod-publication";
import { useRef, useState } from "react";

import { supabase } from "@/lib/supabase/client";

export default function useUploadSubmit({

  form,
  selectedCreator,
  collaborators,
  notifyFollowers,

}: any) {

  const [loading, setLoading] =
    useState(false);

  const uploadId = useRef<string | null>(null);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();
    const status = uploadPublicationStatus(modSubmitAction(e.nativeEvent));

    setLoading(true);

    try {

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session) {

        alert(
          "You must be logged in."
        );

        setLoading(false);

        return;

      }

      if (
        !selectedCreator
      ) {

        alert(
          "No creator profile available."
        );

        setLoading(false);

        return;

      }

      /* --------------------------------
         CREATE MOD
      -------------------------------- */

      const res =
        await fetch(
          "/api/upload",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({

              ...form,
              status,
              uploadId: uploadId.current ??= crypto.randomUUID(),
              notifyFollowers,

              creator_id:
                selectedCreator,

              collaborators,

            }),
          }
        );

      if (!res.ok) {

        const error =
          await res.json();

        console.error(error);

        alert(
          "Upload failed"
        );

        setLoading(false);

        return;

      }

      const data =
        await res.json();

      const modId =
        data.modId;

      /* --------------------------------
         PROTECTED FILE UPLOAD
      -------------------------------- */

      if (
        form.protectedFile
      ) {

        const fileForm =
          new FormData();

        fileForm.append(
          "file",
          form.protectedFile
        );

        fileForm.append(
          "modId",
          modId
        );

        const fileRes =
          await fetch(
            "/api/upload-file",
            {
              method: "POST",
              headers: { Authorization: `Bearer ${session.access_token}` },
              body: fileForm,
            }
          );

        if (!fileRes.ok) {

          console.error(
            "Protected upload failed"
          );

          alert(
            "Mod uploaded, but protected file failed."
          );

        }

      }

      /* --------------------------------
         SUCCESS
      -------------------------------- */

      alert(
        status === "draft" ? "Draft saved." : "Mod uploaded!"
      );

      window.location.href =
        "/";

    } catch (err) {

      console.error(
        "UPLOAD ERROR:",
        err
      );

      alert(
        "Error uploading"
      );

    }

    setLoading(false);

  }

  return {

    loading,
    handleSubmit,

  };

}