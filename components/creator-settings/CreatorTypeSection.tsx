type Props = {
  form: any;
  setForm: any;
};

export default function CreatorTypeSection({
  form,
  setForm,
}: Props) {

  return (

    <section className="space-y-4">

      <h2 className="text-2xl font-bold">
        Creator Type
      </h2>

      <p className="text-zinc-400 text-sm">
        Personal creators can work alone.
        Team creators can invite members.
      </p>

      <div className="flex gap-3">

        <button
          type="button"
          onClick={() =>
            setForm((prev: any) => ({
              ...prev,
              owner_type: "user",
            }))
          }
          className={`
            px-5
            py-3
            rounded-xl
            border

            ${
              form.owner_type === "user"
                ? "bg-purple-600 border-purple-600"
                : "border-zinc-700"
            }
          `}
        >
          Personal
        </button>

        <button
          type="button"
          onClick={() =>
            setForm((prev: any) => ({
              ...prev,
              owner_type: "team",
            }))
          }
          className={`
            px-5
            py-3
            rounded-xl
            border

            ${
              form.owner_type === "team"
                ? "bg-purple-600 border-purple-600"
                : "border-zinc-700"
            }
          `}
        >
          Team
        </button>

      </div>

    </section>

  );

}