type Props = {
  form: any;
  handleChange: any;
};

export default function CreatorBrandingSection({
  form,
  handleChange,
}: Props) {

  return (

    <section className="space-y-6">

      <div>

        <h2
          className="
            text-2xl
            font-bold
            mb-2
          "
        >
          Branding
        </h2>

        <p className="text-zinc-400 text-sm">
          Avatar and banner visuals.
        </p>

      </div>

      <input
        name="avatar"
        value={form.avatar}
        onChange={handleChange}
        placeholder="Avatar image URL"
        className="
          w-full
          rounded-2xl
          bg-zinc-950
          border
          border-zinc-800
          px-5
          py-4
        "
      />

      <input
        name="banner"
        value={form.banner}
        onChange={handleChange}
        placeholder="Banner image URL"
        className="
          w-full
          rounded-2xl
          bg-zinc-950
          border
          border-zinc-800
          px-5
          py-4
        "
      />

    </section>

  );

}