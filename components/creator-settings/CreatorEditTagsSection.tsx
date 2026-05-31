"use client";

import { useState } from "react";

interface Props {
  creatorData: any;
  setCreatorData: any;
}

export default function CreatorEditTagsSection({
  creatorData,
  setCreatorData,
}: Props) {

  const [input, setInput] =
    useState("");

  const tags =
    Array.isArray(
      creatorData.specialization
    )
      ? creatorData.specialization
      : [];

  function addTag() {

    const trimmed =
      input.trim();

    if (!trimmed) return;

    if (
      tags.includes(trimmed)
    ) return;

    setCreatorData(
      (prev: any) => ({
        ...prev,
        specialization: [
          ...tags,
          trimmed,
        ],
      })
    );

    setInput("");

  }

  function removeTag(
    tag: string
  ) {

    setCreatorData(
      (prev: any) => ({
        ...prev,
        specialization:
          tags.filter(
            (t: string) =>
              t !== tag
          ),
      })
    );

  }

  return (

    <section
      className="
        rounded-[32px]
        border
        border-zinc-900
        bg-zinc-950/70
        backdrop-blur-xl
        p-8
      "
    >

      <div className="mb-8">

        <p
          className="
            text-sm
            uppercase
            tracking-[0.22em]
            text-purple-400
            mb-2
          "
        >
          Identity
        </p>

        <h2
          className="
            text-4xl
            font-black
          "
        >
          Specializations
        </h2>

      </div>

      <div
        className="
          flex
          gap-4
          mb-6
        "
      >

        <input
          value={input}
          onChange={(e) =>
            setInput(
              e.target.value
            )
          }
          placeholder="
            Add specialization...
          "
          className="
            flex-1
            rounded-2xl
            border
            border-zinc-900
            bg-zinc-950
            px-5
            py-4
            text-white
            outline-none
            focus:border-purple-500
            transition
          "
        />

        <button
          onClick={addTag}
          className="
            rounded-2xl
            px-6
            bg-gradient-to-r
            from-violet-600
            to-fuchsia-500
            font-semibold
          "
        >
          Add
        </button>

      </div>

      <div
        className="
          flex
          flex-wrap
          gap-4
        "
      >

        {tags.map((tag: string) => (

          <div
            key={tag}
            className="
              flex
              items-center
              gap-3
              rounded-2xl
              border
              border-purple-500/20
              bg-purple-500/10
              px-5
              py-3
            "
          >

            <span>
              {tag}
            </span>

            <button
              onClick={() =>
                removeTag(tag)
              }
              className="
                text-zinc-400
                hover:text-red-400
              "
            >
              ×
            </button>

          </div>

        ))}

      </div>

    </section>

  );

}