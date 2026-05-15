type Props = {

  form: any;
  handleChange: any;

};

export default function StatusSelector({
  form,
  handleChange,
}: Props) {

  return (

    <div>

      <label
        className="
          block
          text-sm
          font-medium
          mb-3
        "
      >
        Visibility
      </label>

      <select
        name="status"
        value={form.status}
        onChange={handleChange}
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

        <option value="draft">
          Draft
        </option>

        <option value="published">
          Published
        </option>

        <option value="pending">
          Pending Review
        </option>

        <option value="archived">
          Archived
        </option>

      </select>

      <p
        className="
          text-xs
          text-gray-500
          mt-2
        "
      >
        Control mod visibility
        and workflow state.
      </p>

    </div>

  );

}