"use client";

interface Props {
  creatorData: any;
  setCreatorData: any;
}

export default function CreatorEditSocialsSection({
  creatorData,
  setCreatorData,
}: Props) {

  const socials =
    creatorData.socials || {};

  function updateSocial(
    field: string,
    value: string
  ) {

    setCreatorData(
      (prev: any) => ({
        ...prev,
        socials: {
          ...prev.socials,
          [field]: value,
        },
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
          Presence
        </p>

        <h2
          className="
            text-4xl
            font-black
          "
        >
          Social Links
        </h2>

      </div>

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-6
        "
      >

        {[
          {
            label: "Website",
            key: "website",
          },
          {
            label: "Discord",
            key: "discord",
          },
          {
            label: "YouTube",
            key: "youtube",
          },
          {
            label: "Instagram",
            key: "instagram",
          },
          {
            label: "Twitter / X",
            key: "twitter",
          },
          {
            label: "GitHub",
            key: "github",
          },
        ].map((item) => (

          <div key={item.key}>

            <label
              className="
                text-sm
                text-zinc-400
                block
                mb-3
              "
            >
              {item.label}
            </label>

            <input
              value={
                socials[
                  item.key
                ] || ""
              }
              onChange={(e) =>
                updateSocial(
                  item.key,
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
                transition
              "
            />

          </div>

        ))}

      </div>

    </section>

  );

}