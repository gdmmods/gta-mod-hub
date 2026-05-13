type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export default function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
}: SectionTitleProps) {
  return (
    <div
      className={`
        ${align === "center" ? "text-center mx-auto" : ""}
        ${className}
      `}
    >
      {eyebrow && (
        <p
          className="
            text-sm
            uppercase
            tracking-[0.2em]
            text-purple-400
            mb-4
          "
        >
          {eyebrow}
        </p>
      )}

      <h2
        className="
          text-4xl
          md:text-5xl
          font-black
          leading-tight
          tracking-tight
        "
      >
        {title}
      </h2>

      {description && (
        <p
          className="
            mt-5
            text-zinc-400
            text-lg
            leading-relaxed
            max-w-3xl
          "
        >
          {description}
        </p>
      )}
    </div>
  );
}