type Props = {
  form: any;
  handleSocialChange: (
    field: string,
    value: string
  ) => void;
};

export default function CreatorSocialsSection({
  form,
  handleSocialChange,
}: Props) {

  const socials =
    form.socials || {};

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
          External links and support platforms.
        </p>

      </div>

      {[
        "discord",
        "youtube",
        "website",
        "instagram",
        "twitter",
        "github",
        "patreon",
        "kofi",
        "store",
        "support_email",
      ].map((field) => (

        <input
          key={field}
          name={field}
          value={
            socials[field] || ""
          }
          onChange={(e) =>
            handleSocialChange(
              field,
              e.target.value
            )
          }
          placeholder={
            field
              .replace("_", " ")
              .replace(
                /\b\w/g,
                (c) => c.toUpperCase()
              )
          }
          className="
            w-full
            rounded-2xl
            bg-zinc-950
            border
            border-zinc-800
            px-5
            py-4
            text-white
            outline-none
            focus:border-purple-500
            transition
          "
        />

      ))}

    </section>

  );

}