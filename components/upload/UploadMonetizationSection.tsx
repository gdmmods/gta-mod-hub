interface Props {
  form: any;
  handleChange: any;
}

export default function UploadMonetizationSection({
  form,
  handleChange,
}: Props) {
  return (
    <section
      className="
        rounded-[32px]
        border
        border-zinc-900
        bg-zinc-950/50
        p-7
        space-y-6
      "
    >
      {/* HEADER */}
      <div>
        <p
          className="
            text-sm
            uppercase
            tracking-[0.2em]
            text-purple-400
          "
        >
          Documentation
        </p>

        <h2
          className="
            text-2xl
            font-black
            mt-2
          "
        >
          Release Information
        </h2>
      </div>

      {/* RELEASE STATUS */}
      <div>
        <label
          className="
            text-sm
            text-zinc-400
            mb-2
            block
          "
        >
          Release Status
        </label>

        <select
          name="visibility"
          value={form.visibility || "public"}
          onChange={handleChange}
          className="
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-black/40
            px-4
            py-3
            text-white
            outline-none
          "
        >
          <option value="public">
            Public Release
          </option>

          <option value="early_access">
            Public Beta / Early Access
          </option>

          <option value="supporters">
            Restricted / Supporter Release
          </option>
        </select>

        {/* RESTRICTED RELEASE INFORMATION */}
        {form.visibility === "supporters" && (
          <div
            className="
              mt-4
              rounded-2xl
              border
              border-purple-500/10
              bg-purple-500/5
              px-6
              py-5
            "
          >
            <h3 className="text-lg font-semibold">
              Release Information
            </h3>

            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              Release status is descriptive only.
              ModVault does not provide, sell, or facilitate access to
              externally restricted projects.
            </p>

            <p className="text-sm text-zinc-500 mt-4 leading-relaxed">
              This project is documented as a restricted or supporter release.
              Any external release remains subject to the creator's rights,
              permissions, and the rules of the platform where it is distributed.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}