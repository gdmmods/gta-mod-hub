import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";

type SortBarProps = {
  sort?: string;
};

export default function SortBar({
  sort,
}: SortBarProps) {
  return (
    <PageContainer className="mt-10">

      <div
        className="
          flex
          flex-wrap
          items-center
          gap-3
        "
      >

        {[
          {
            label: "Newest",
            href: "/",
            active: !sort,
          },
          {
            label: "Most Liked",
            href: "/?sort=likes",
            active: sort === "likes",
          },
          {
            label: "Most Downloaded",
            href: "/?sort=downloads",
            active: sort === "downloads",
          },
        ].map((item) => (

          <Link
            key={item.label}
            href={item.href}
            className={`
              rounded-2xl
              border
              px-5
              py-2.5
              text-sm
              transition

              ${
                item.active
                  ? `
                    border-purple-500/30
                    bg-purple-500/10
                    text-white
                  `
                  : `
                    border-zinc-800
                    bg-zinc-950
                    text-zinc-400
                    hover:border-purple-500/20
                    hover:text-white
                  `
              }
            `}
          >
            {item.label}
          </Link>

        ))}

      </div>

    </PageContainer>
  );
}