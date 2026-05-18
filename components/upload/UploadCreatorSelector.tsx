interface Props {
  creators: any[];
  selectedCreator: string;
  setSelectedCreator: any;
}

export default function UploadCreatorSelector({
  creators,
  selectedCreator,
  setSelectedCreator,
}: Props) {

  return (

    <div className="mb-10">

      <label
        className="
          block
          text-sm
          font-medium
          mb-3
        "
      >
        Upload As
      </label>

      <select
        value={selectedCreator || ""}
        onChange={(e) =>
          setSelectedCreator(
            e.target.value
          )
        }
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
        "
      >

        {creators.length === 0 && (

          <option value="">
            No approved creator profiles
          </option>

        )}

        {creators.map(
          (
            creator
          ) => (

            <option
              key={
                creator.id
              }
              value={
                creator.id
              }
            >
              {
                creator.name
              }
            </option>

          )
        )}

      </select>

      <p
        className="
          text-xs
          text-gray-500
          mt-2
        "
      >
        Upload ownership
        comes from verified
        creator profiles.
      </p>

    </div>

  );

}