interface Props {
  allCreators: any[];
  filteredCreators: any[] | null;
  setFilteredCreators: any;
  selectedCreator: string;
  collaborators: string[];
  setCollaborators: any;
}

export default function UploadCollaboratorsSection({
  allCreators,
  filteredCreators,
  setFilteredCreators,
  selectedCreator,
  collaborators,
  setCollaborators,
}: Props) {

  return (

    <div>

      <div
        className="
          flex
          items-center
          justify-between
          mb-4
        "
      >

        <h2
          className="
            text-xl
            font-semibold
          "
        >
          Additional Creators
        </h2>

        <span
          className="
            text-xs
            text-gray-500
          "
        >
          Multi-creator support
        </span>

      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="
          Search creator profiles...
        "
        onChange={(e) => {

          const value =
            e.target.value
              .trim()
              .toLowerCase();

          if (!value) {

            setFilteredCreators(
              null
            );

            return;

          }

          const filtered =
            allCreators
              .filter(
                (creator) =>
                  creator.name
                    .toLowerCase()
                    .includes(value)
              )
              .slice(0, 5);

          setFilteredCreators(
            filtered
          );

        }}
        className="
          w-full
          p-4
          bg-black
          border
          border-zinc-800
          rounded-xl
          text-white
          focus:outline-none
          focus:border-purple-500
          mb-4
        "
      />

      {/* RESULTS */}
      <div className="space-y-3">

        {filteredCreators &&
          filteredCreators
            .filter(
              (creator) =>
                creator.id !== selectedCreator
            )
            .map((creator) => {

              const active =
                collaborators.includes(
                  creator.id
                );

              return (

                <button
                  key={creator.id}
                  type="button"
                  onClick={() => {

                    if (active) {

                      setCollaborators(
                        collaborators.filter(
                          (id) =>
                            id !== creator.id
                        )
                      );

                    } else {

                      setCollaborators([
                        ...collaborators,
                        creator.id,
                      ]);

                    }

                  }}
                  className={`
                    w-full
                    flex
                    items-center
                    justify-between
                    p-4
                    rounded-xl
                    border
                    transition

                    ${
                      active
                        ? `
                          border-purple-500
                          bg-purple-500/10
                        `
                        : `
                          border-zinc-800
                          bg-black
                        `
                    }
                  `}
                >

                  <span>
                    {creator.name}
                  </span>

                  <span
                    className="
                      text-xs
                      text-gray-500
                    "
                  >
                    {active
                      ? "Added"
                      : "Add"}
                  </span>

                </button>

              );

            })}

      </div>

      {/* SELECTED */}
      {collaborators.length > 0 && (

        <div className="mt-6">

          <p
            className="
              text-sm
              text-gray-400
              mb-3
            "
          >
            Selected collaborators
          </p>

          <div
            className="
              flex
              flex-wrap
              gap-3
            "
          >

            {collaborators.map(
              (id) => {

                const creator =
                  allCreators.find(
                    (c) =>
                      c.id === id
                  );

                if (!creator)
                  return null;

                return (

                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setCollaborators(
                        collaborators.filter(
                          (c) =>
                            c !== id
                        )
                      )
                    }
                    className="
                      px-4
                      py-2
                      rounded-full
                      bg-purple-500/10
                      border
                      border-purple-500
                      text-sm
                    "
                  >
                    {creator.name} ×
                  </button>

                );

              }
            )}

          </div>

        </div>

      )}

      <p
        className="
          text-xs
          text-gray-500
          mt-4
        "
      >
        Collaborators are linked
        structurally and can later
        claim ownership of their
        creator profiles.
      </p>

    </div>

  );

}