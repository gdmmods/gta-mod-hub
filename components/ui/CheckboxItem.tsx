type CheckboxItemProps = {
  text: string;
  done?: boolean;
  className?: string;
};

export default function CheckboxItem({
  text,
  done = false,
  className = "",
}: CheckboxItemProps) {
  return (
    <div
      className={`
        flex
        items-start
        gap-3
        text-sm
        ${done ? "text-zinc-300" : "text-zinc-500"}
        ${className}
      `}
    >

      {/* CHECKBOX */}
      <div
        className={`
          relative
          mt-[1px]
          flex
          h-5
          w-5
          items-center
          justify-center
          rounded-full
          border
          text-[10px]

          ${
            done
              ? `
                border-purple-500/40
                bg-purple-500/10
                shadow-[0_0_14px_rgba(168,85,247,0.35)]
              `
              : `
                border-zinc-700
                bg-zinc-900/40
              `
          }
        `}
      >

        {done && (
          <div
            className="
              absolute
              inset-0
              rounded-full
              bg-purple-500/10
              blur-[6px]
            "
          />
        )}

        <span
          className={`
            relative
            z-10
            ${
              done
                ? "text-purple-300"
                : "text-zinc-600"
            }
          `}
        >
          {done ? "✓" : "○"}
        </span>

      </div>

      {/* TEXT */}
      <span>{text}</span>

    </div>
  );
}