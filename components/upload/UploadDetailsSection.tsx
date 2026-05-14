interface Props {
  form: any;
  handleChange: any;
}

export default function UploadDetailsSection({
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
        Additional Details
      </h2>

      <div className="space-y-6">

        {/* FEATURES */}
        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-2
            "
          >
            Features
          </label>

          <textarea
            name="features"
            placeholder={`Full HQ Interior
LOD Support
Custom Handling`}
            value={form.features}
            onChange={handleChange}
            rows={5}
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
            Add one feature per line.
          </p>

        </div>

        {/* REQUIREMENTS */}
        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-2
            "
          >
            Requirements
          </label>

          <textarea
            name="requirements"
            placeholder={`Game Build 3095
FiveM Compatible`}
            value={form.requirements}
            onChange={handleChange}
            rows={4}
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
            Mention dependencies or
            compatibility requirements.
          </p>

        </div>

        {/* NOTES */}
        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-2
            "
          >
            Notes
          </label>

          <textarea
            name="notes"
            placeholder="
Known issues, limitations, installation notes...
"
            value={form.notes}
            onChange={handleChange}
            rows={4}
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
            Optional information shown
            on the mod page.
          </p>

        </div>

        {/* CREDITS */}
        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-2
            "
          >
            Credits
          </label>

          <textarea
            name="credits"
            placeholder={`Adapted by...
Converted by...
Original model by...`}
            value={form.credits}
            onChange={handleChange}
            rows={4}
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
            Credit collaborators and
            original creators properly.
          </p>

        </div>

      </div>

    </div>

  );

}