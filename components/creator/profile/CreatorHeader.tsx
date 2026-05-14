import CreatorVerificationBadge from "./CreatorVerificationBadge";

interface CreatorHeaderProps {
  name: string;
  verified?: boolean;
  status?: string | null;
}

export default function CreatorHeader({
  name,
  verified,
  status,
}: CreatorHeaderProps) {

  return (

    <div
      className="
        flex
        flex-wrap
        items-center
        gap-3
      "
    >

      <h1
        className="
          text-5xl
          md:text-6xl
          font-black
          tracking-tight
          leading-none
        "
      >
        {name}
      </h1>

      <CreatorVerificationBadge
        verified={verified}
      />

      {status && (

        <div
          className="
            px-3
            py-1.5
            rounded-xl
            bg-emerald-500/10
            border
            border-emerald-500/20
            text-sm
            text-emerald-300
          "
        >
          {status}
        </div>

      )}

    </div>

  );

}