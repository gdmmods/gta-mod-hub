type Props = {

  form: any;

  handleChange: any;

};

export default function CategorySelector({

  form,

  handleChange,

}: Props) {

  return (

    <section
      className="
        rounded-3xl
        border
        border-white/10
        bg-white/[0.02]
        p-6
      "
    >

      <div
        className="
          mb-6
        "
      >

        <p
          className="
            text-xs
            uppercase
            tracking-[0.3em]
            text-purple-400
          "
        >
          Category
        </p>

        <h2
          className="
            mt-2
            text-3xl
            font-bold
          "
        >
          Mod Category
        </h2>

      </div>

      <select
        name="category"

        value={
          form.category || ""
        }

        onChange={
          handleChange
        }

        className="
          w-full
          rounded-2xl
          border
          border-white/10
          bg-black/40
          px-4
          py-3
          text-white
          outline-none
        "
      >

        <option value="">
          Select category
        </option>

        <option value="vehicles">
          Vehicles
        </option>

        <option value="maps">
          Maps
        </option>

        <option value="scripts">
          Scripts
        </option>

        <option value="graphics">
          Graphics
        </option>

        <option value="weapons">
          Weapons
        </option>

        <option value="player">
          Player
        </option>

        <option value="sounds">
          Sounds
        </option>

        <option value="ui">
          UI
        </option>

        <option value="tools">
          Tools
        </option>

        <option value="misc">
          Misc
        </option>

      </select>

    </section>

  );

}