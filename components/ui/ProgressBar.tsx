type ProgressBarProps = {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
};

export default function ProgressBar({
  value,
  label,
  showValue = true,
  className = "",
}: ProgressBarProps) {
  return (
    <div className={className}>

      {(label || showValue) && (
        <div
          className="
            flex
            items-center
            justify-between
            mb-2
            text-sm
          "
        >
          {label && (
            <span className="text-zinc-400">
              {label}
            </span>
          )}

          {showValue && (
            <span className="text-zinc-500">
              {value}%
            </span>
          )}
        </div>
      )}

      <div
        className="
          relative
          w-full
          h-2.5
          overflow-hidden
          rounded-full
          border
          border-white/5
          bg-black/50
        "
      >

        {/* FILL */}
        <div
          className="
            absolute
            inset-y-0
            left-0
            rounded-full
            bg-gradient-to-r
            from-purple-500
            via-fuchsia-500
            to-cyan-400
            shadow-[0_0_18px_rgba(168,85,247,0.45)]
            transition-all
            duration-500
          "
          style={{
            width: `${value}%`,
          }}
        />

      </div>

    </div>
  );
}