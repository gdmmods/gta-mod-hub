type Props = {
  form: any;
  handleChange: any;
};

export default function CreatorProfileSection({
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
          Profile
        </h2>

        <p className="text-zinc-400 text-sm">
          Public creator information.
        </p>

      </div>

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Creator name"
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
        name="tagline"
        value={form.tagline}
        onChange={handleChange}
        placeholder="Tagline"
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
        name="status"
        value={form.status}
        onChange={handleChange}
        placeholder="Status badge"
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

      <textarea
        name="bio"
        value={form.bio}
        onChange={handleChange}
        placeholder="Bio"
        rows={6}
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