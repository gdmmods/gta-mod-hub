type Props = {

  active: string;

  setActive: (
    value: string
  ) => void;

};

export default function SearchTabs({
  active,
  setActive,
}: Props) {

  const tabs = [
    "all",
    "mods",
    "creators",
  ];

  return (

    <div
      className="
        flex
        gap-3
        mb-10
      "
    >

      {tabs.map((tab) => (

        <button
          key={tab}
          onClick={() =>
            setActive(tab)
          }
          className={`
            px-5
            py-3

            rounded-xl

            text-sm
            capitalize

            border

            transition

            ${
              active === tab
                ? `
                  border-purple-500
                  bg-purple-500/10
                  text-white
                `
                : `
                  border-zinc-800
                  bg-zinc-950
                  text-zinc-400
                `
            }
          `}
        >
          {tab}
        </button>

      ))}

    </div>

  );

}