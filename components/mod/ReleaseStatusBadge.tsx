interface Props {
  visibility?: string;
  className?: string;
}

export default function ReleaseStatusBadge({
  visibility,
  className = "",
}: Props) {

  if (!visibility || visibility === "public") {
    return null;
  }

  let label = "";
  let styles = "";

  if (visibility === "early_access") {

    label = "Early Access";

    styles = `
      bg-amber-500/20
      border-amber-500/20
      text-amber-300
    `;

  } else if (visibility === "supporters") {

    label = "Restricted Release";

    styles = `
      bg-purple-500/20
      border-purple-500/20
      text-purple-300
    `;

  } else {
    return null;
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