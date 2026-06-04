"use client";

interface Props {
  creatorData: any;
  setCreatorData: any;
}

export default function CreatorEditBrandingSection({
  creatorData,
  setCreatorData,
}: Props) {

  function updateField(
    field: string,
    value: any
  ) {

    setCreatorData(
      (prev: any) => ({
        ...prev,
        [field]: value,
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
        overflow-hidden
      "
    >

      {/* BANNER */}
      <div
        className="
          relative
          h-[260px]
          border-b
          border-zinc-900
          overflow-hidden
        "
      >

        <img
          src={
            creatorData.banner ||
            "/placeholder.jpg"
          }
          alt="Banner"
          className="
            w-full
            h-full
            object-cover
          "
        />

        <div
          className="
            absolute
            inset-0
            bg-black/40
          "
        />

      </div>

      <div className="p-8">

        {/* AVATAR */}
        <div
          className="
            flex
            items-end
            gap-6
            -mt-24
            relative
            z-10
            mb-8
          "
        >

          <div
            className="
              w-40
              h-40
              rounded-[30px]
              overflow-hidden
              border-4
              border-black
              bg-zinc-900
              shrink-0
            "
          >

            <img
              src={
                creatorData.avatar ||
                "/placeholder-avatar.png"
              }
              alt="Avatar"
              className="
                w-full
                h-full
                object-cover
              "
            />

          </div>

          <div className="pb-4">

            <p
              className="
                text-sm
                uppercase
                tracking-[0.22em]
                text-purple-400
                mb-2
              "
            >
              Branding
            </p>

            <h2
              className="
                text-4xl
                font-black
              "
            >
              Creator Identity
            </h2>

          </div>

        </div>

        <div className="space-y-7">

          {/* NAME */}
          <div>

            <label
              className="
                block
                text-sm
                text-zinc-400
                mb-3
              "
            >
              Creator Name
            </label>

            <input
              value={
                creatorData.name
              }
              onChange={(e) =>
                updateField(
                  "name",
                  e.target.value
                )
              }
              className="
                w-full
                rounded-2xl
                border
                border-zinc-900
                bg-zinc-950
                px-5
                py-4
                text-white
                outline-none
                focus:border-purple-500
              "
            />

          </div>

          {/* TAGLINE */}
          <div>

            <label
              className="
                block
                text-sm
                text-zinc-400
                mb-3
              "
            >
              Tagline
            </label>

            <input
              value={
                creatorData.tagline
              }
              onChange={(e) =>
                updateField(
                  "tagline",
                  e.target.value
                )
              }
              className="
                w-full
                rounded-2xl
                border
                border-zinc-900
                bg-zinc-950
                px-5
                py-4
                text-white
                outline-none
                focus:border-purple-500
              "
            />

          </div>

          {/* BIO */}
          <div>

            <label
              className="
                block
                text-sm
                text-zinc-400
                mb-3
              "
            >
              Bio
            </label>

            <textarea
              rows={6}
              value={
                creatorData.bio
              }
              onChange={(e) =>
                updateField(
                  "bio",
                  e.target.value
                )
              }
              className="
                w-full
                rounded-3xl
                border
                border-zinc-900
                bg-zinc-950
                px-5
                py-5
                text-white
                outline-none
                resize-none
                focus:border-purple-500
              "
            />

          </div>

          {/* LOCATION */}
          <div>

            <label
              className="
                block
                text-sm
                text-zinc-400
                mb-3
              "
            >
              Location
            </label>

            <input
              value={
                creatorData.location
              }
              onChange={(e) =>
                updateField(
                  "location",
                  e.target.value
                )
              }
              className="
                w-full
                rounded-2xl
                border
                border-zinc-900
                bg-zinc-950
                px-5
                py-4
                text-white
                outline-none
                focus:border-purple-500
              "
            />

          </div>

          {/* AVATAR */}
          <div>

            <label
              className="
                block
                text-sm
                text-zinc-400
                mb-3
              "
            >
              Avatar URL
            </label>

            <input
              value={
                creatorData.avatar
              }
              onChange={(e) =>
                updateField(
                  "avatar",
                  e.target.value
                )
              }
              className="
                w-full
                rounded-2xl
                border
                border-zinc-900
                bg-zinc-950
                px-5
                py-4
                text-white
                outline-none
                focus:border-purple-500
              "
            />

          </div>

          {/* BANNER */}
          <div>

            <label
              className="
                block
                text-sm
                text-zinc-400
                mb-3
              "
            >
              Banner URL
            </label>

            <input
              value={
                creatorData.banner
              }
              onChange={(e) =>
                updateField(
                  "banner",
                  e.target.value
                )
              }
              className="
                w-full
                rounded-2xl
                border
                border-zinc-900
                bg-zinc-950
                px-5
                py-4
                text-white
                outline-none
                focus:border-purple-500
              "
            />

          </div>

        </div>

      </div>

    </section>

  );

}