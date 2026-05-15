type Props = {
  text?: string;
};

export default function PageLoader({
  text = "Loading...",
}: Props) {

  return (

    <main
      className="
        min-h-screen
        bg-black
        text-white
        flex
        items-center
        justify-center
      "
    >

      <p
        className="
          text-lg
          text-gray-400
        "
      >
        {text}
      </p>

    </main>

  );

}