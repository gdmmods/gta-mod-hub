import Link from "next/link";

type GradientButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export default function GradientButton({
  children,
  href,
  onClick,
  className = "",
}: GradientButtonProps) {
  const styles = `
    inline-flex
    items-center
    justify-center
    rounded-2xl
    bg-gradient-to-r
    from-purple-600
    to-purple-500
    px-6
    py-3
    text-sm
    font-medium
    text-white
    shadow-[0_0_30px_rgba(168,85,247,0.35)]
    hover:scale-[1.03]
    transition
    duration-300
    ${className}
  `;

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={styles}>
      {children}
    </button>
  );
}