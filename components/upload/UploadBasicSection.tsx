interface Props {
  form: any;
  handleChange: any;
}

export default function UploadBasicSection({
  form,
  handleChange,
}: Props) {

  return (

    <div>

      <div
        className="
          flex
          items-center
          justify-between
          mb-6
        "
      >

        <h2
          className="
            text-xl
            font-semibold
          "
        >
          Basic Information
        </h2>

        <div
          className="
            text-xs
            text-gray-500
          "
        >
          Required fields marked automatically
        </div>

      </div>

      <div className="space-y-6">

        {/* TITLE */}
        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-2
            "
          >
            Mod Title
          </label>

          <input
            name="title"
            placeholder='Example: "2017 Ferrari J50 [Add-On]"'
            value={form.title}
            onChange={handleChange}
            className="
              w-full
              p-4
              bg-black
              border
              border-zinc-800
              rounded-xl
              focus:outline-none
              focus:border-purple-500
              focus:ring-1
              focus:ring-purple-500/30
              transition
            "
            required
          />

          <p
            className="
              text-xs
              text-gray-500
              mt-2
            "
          >
            Use a clean and searchable title.
          </p>

        </div>

        {/* DESCRIPTION */}
        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-2
            "
          >
            Description
          </label>

          <textarea
            name="description"
            placeholder="
              Describe the mod, quality level, compatibility, or unique details...
            "
            value={form.description}
            onChange={handleChange}
            rows={6}
            className="
              w-full
              p-4
              bg-black
              border
              border-zinc-800
              rounded-xl
              resize-none
              focus:outline-none
              focus:border-purple-500
              focus:ring-1
              focus:ring-purple-500/30
              transition
            "
          />

          <p
            className="
              text-xs
              text-gray-500
              mt-2
            "
          >
            Better descriptions improve visibility and trust.
          </p>

        </div>

      </div>

    </div>

  );

}