type Props = {
  form: any;
  handleChange: any;
};

export default function CreatorSocialsSection({
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
          Socials
        </h2>

        <p className="text-zinc-400 text-sm">
          External links and platforms.
        </p>

      </div>

      <input
        name="discord"
        value={form.discord}
        onChange={handleChange}
        placeholder="Discord"
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
        name="youtube"
        value={form.youtube}
        onChange={handleChange}
        placeholder="YouTube"
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
        name="website"
        value={form.website}
        onChange={handleChange}
        placeholder="Website"
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