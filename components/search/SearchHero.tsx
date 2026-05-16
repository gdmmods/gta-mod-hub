type Props = {

  query: string;

  setQuery: (
    value: string
  ) => void;

};

export default function SearchHero({
  query,
  setQuery,
}: Props) {

  return (

    <div className="mb-14">

      <p
        className="
          text-purple-400
          text-sm
          tracking-[0.2em]
          mb-3
        "
      >
        DISCOVER
      </p>

      <h1
        className="
          text-5xl
          font-bold
          mb-6
        "
      >
        Search the platform.
      </h1>

      <input
        type="text"
        placeholder="
          Search mods, creators...
        "
        value={query}
        onChange={(e) =>
          setQuery(
            e.target.value
          )
        }
        className="
          w-full
          p-5

          rounded-2xl

          border
          border-zinc-800

          bg-zinc-950

          text-white

          focus:outline-none
          focus:border-purple-500
        "
      />

    </div>

  );

}