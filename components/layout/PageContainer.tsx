type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export default function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <div
      className={`
        max-w-[1600px]
        mx-auto
        px-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}