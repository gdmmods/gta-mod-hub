"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase/client";

export default function useUploadSubmit({

  form,
  selectedCreator,
  collaborators,

}: any) {

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: any
  ) {

    e.preventDefault();

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

      } else {

        alert(
          "Mod uploaded!"
        );

        window.location.href =
          "/";

      }

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