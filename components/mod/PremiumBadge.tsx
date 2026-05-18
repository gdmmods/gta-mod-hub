interface Props {
  visibility?: string;
  isPaid?: boolean;
  className?: string;
}

export default function PremiumBadge({
  visibility,
  isPaid,
  className = "",
}: Props) {

  if (
    visibility === "public" &&
    !isPaid
  ) {
    return null;
  }

  let label = "";
  let styles = "";

  if (visibility === "supporters") {

    label = "Supporters Only";

    styles = `
      bg-purple-500/20
      border-purple-500/20
      text-purple-300
    `;

  } else if (
    visibility === "early_access"
  ) {

    label = "Early Access";

    styles = `
      bg-amber-500/20
      border-amber-500/20
      text-amber-300
    `;

  } else if (isPaid) {

    label = "Paid";

    styles = `
      bg-emerald-500/20
      border-emerald-500/20
      text-emerald-300
    `;

  }

  return (

    <div
      className={`
        inline-flex
        items-center

        rounded-full
        border

        px-3
        py-1

        text-xs
        font-medium

        backdrop-blur-xl

        ${styles}
        ${className}
      `}
    >
      {label}
    </div>

  );

}