import Link from "next/link";

interface CreatorFeaturedModProps {
  featured: any;
}

export default function CreatorFeaturedMod({
  featured,
}: CreatorFeaturedModProps) {

  if (!featured) {
    return null;
  }

  return (

    <section
      className="
        max-w-[1450px]
        mx-auto
        px-6
        mt-14
      "
    >

      <div
        className="
          flex
          items-center
          justify-between
          mb-6
        "
      >

        <div>

          <p
            className="
              text-sm
              uppercase
              tracking-[0.2em]
              text-purple-400
            "
          >
            Highlight
          </p>

          <h2
            className="
              text-3xl
              font-bold
              mt-2
            "
          >
            Featured Creation
          </h2>

        </div>

      </div>

      <Link
        href={`/mods/${featured.id}`}
      >

        <div
          className="
            relative
            rounded-[36px]
            overflow-hidden
            border
            border-zinc-800
            group
          "
        >

          <img
            src={featured.image}
            alt={featured.title}
            className="
              w-full
              h-[420px]
              object-cover
              group-hover:scale-[1.03]
              transition
              duration-700
            "
          />

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black
              via-black/40
              to-transparent
            "
          />

          <div
            className="
              absolute
              bottom-0
              left-0
              p-8
            "
          >

            <h3
              className="
                text-4xl
                font-black
              "
            >
              {featured.title}
            </h3>

            <div
              className="
                flex
                gap-5
                mt-3
                text-zinc-300
              "
            >

              <span>
                ⬇{" "}
                {featured.downloads}
              </span>

              <span>
                ❤️{" "}
                {featured.likes}
              </span>

            </div>

          </div>

        </div>

      </Link>

    </section>

  );

}