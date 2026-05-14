interface Props {
  form: any;
  handleChange: any;
}

export default function UploadLinksSection({
  form,
  handleChange,
}: Props) {

  return (

    <div>

      <h2
        className="
          text-xl
          font-semibold
          mb-6
        "
      >
        Links
      </h2>

      <div className="space-y-6">

        {/* SOURCE URL */}
        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-2
            "
          >
            Source URL
          </label>

          <input
            name="source_url"
            placeholder="
              https://gta5-mods.com/...
            "
            value={form.source_url}
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
          />

          <p
            className="
              text-xs
              text-gray-500
              mt-2
            "
          >
            Original source page or
            creator profile.
          </p>

        </div>

        {/* DOWNLOAD URL */}
        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-2
            "
          >
            Download URL
          </label>

          <input
            name="download_url"
            placeholder="
              https://download-link.com/...
            "
            value={form.download_url}
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
          />

          <p
            className="
              text-xs
              text-gray-500
              mt-2
            "
          >
            Direct download or external
            download page.
          </p>

        </div>

      </div>

    </div>

  );

}