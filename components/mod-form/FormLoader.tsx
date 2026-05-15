export default function FormLoader() {

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

      <div
        className="
          text-center
        "
      >

        <div
          className="
            w-12
            h-12
            border-2
            border-purple-500
            border-t-transparent
            rounded-full
            animate-spin
            mx-auto
            mb-5
          "
        />

        <p
          className="
            text-gray-400
          "
        >
          Loading...
        </p>

      </div>

    </main>

  );

}