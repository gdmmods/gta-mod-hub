interface Props {

  children: React.ReactNode;

}

export default function ModFormContainer({
  children,
}: Props) {

  return (

    <div
      className="
        max-w-5xl
        mx-auto
        px-6
        py-14
      "
    >

      <div
        className="
          bg-zinc-900/60
          border
          border-zinc-800
          rounded-3xl
          p-8
          backdrop-blur-xl
        "
      >

        {children}

      </div>

    </div>

  );

}