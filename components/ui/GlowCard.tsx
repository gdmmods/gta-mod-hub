type GlowCardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function GlowCard({
  children,
  className = "",
}: GlowCardProps) {
  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-[30px]
        border
        border-zinc-800
        bg-gradient-to-br
        from-zinc-900
        to-black
        backdrop-blur-xl
        transition-all
        duration-300
        hover:border-purple-500/30
        hover:scale-[1.01]
        ${className}
      `}
    >
      {/* GLOW */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_40%)]
        "
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}