"use client";

import { useState } from "react";

interface CreatorEditFormProps {
  creator: any;
}

export default function CreatorEditForm({
  creator,
}: CreatorEditFormProps) {

  const [name, setName] = useState(
    creator.name || ""
  );

  const [bio, setBio] = useState(
    creator.bio || ""
  );

  const [website, setWebsite] = useState(
    creator.website || ""
  );

  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();

    console.log({
      name,
      bio,
      website,
    });

    // save logic later

  }

  return (

    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >

      {/* NAME */}
      <div className="space-y-2">

        <label
          className="
            text-sm
            font-medium
            text-zinc-300
          "
        >
          Creator Name
        </label>

        <input
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900
            px-4
            py-3
            text-white
            outline-none
            transition
            focus:border-purple-500
          "
          placeholder="Creator name"
        />

      </div>

      {/* BIO */}
      <div className="space-y-2">

        <label
          className="
            text-sm
            font-medium
            text-zinc-300
          "
        >
          Bio
        </label>

        <textarea
          value={bio}
          onChange={(e) =>
            setBio(e.target.value)
          }
          rows={6}
          className="
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900
            px-4
            py-3
            text-white
            outline-none
            transition
            focus:border-purple-500
          "
          placeholder="Tell people about this creator..."
        />

      </div>

      {/* WEBSITE */}
      <div className="space-y-2">

        <label
          className="
            text-sm
            font-medium
            text-zinc-300
          "
        >
          Website
        </label>

        <input
          value={website}
          onChange={(e) =>
            setWebsite(e.target.value)
          }
          className="
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900
            px-4
            py-3
            text-white
            outline-none
            transition
            focus:border-purple-500
          "
          placeholder="https://"
        />

      </div>

      {/* ACTIONS */}
      <div
        className="
          flex
          items-center
          justify-end
          pt-4
        "
      >

        <button
          type="submit"
          className="
            rounded-2xl
            bg-purple-600
            px-6
            py-3
            font-medium
            text-white
            transition
            hover:bg-purple-500
          "
        >
          Save Changes
        </button>

      </div>

    </form>

  );

}