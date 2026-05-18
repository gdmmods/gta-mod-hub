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
          Monetization
        </p>

        <h2
          className="
            text-2xl
            font-black
            mt-2
          "
        >
          Access & Support
        </h2>

      </div>

      {/* ACCESS TYPE */}
      <div>

        <label
          className="
            text-sm
            text-zinc-400
            mb-2
            block
          "
        >
          Access Type
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
            Public / Free
          </option>

          <option value="supporters">
            Supporters Only
          </option>

          <option value="early_access">
            Early Access
          </option>

        </select>

      </div>

      {/* ---------------------------------
         SUPPORTER INFO
      --------------------------------- */}

      {form.visibility !== "public" && (

        <div
          className="
            rounded-2xl
            border
            border-purple-500/10
            bg-purple-500/5
            px-6
            py-5
            space-y-5
          "
        >

          <div>

            <h3
              className="
                text-lg
                font-semibold
              "
            >
              External Support Access
            </h3>

            <p
              className="
                text-sm
                text-zinc-400
                mt-2
                leading-relaxed
              "
            >
              Supporter and early-access
              releases currently use
              Patreon, Gumroad, Tebex,
              Ko-fi, or external creator
              stores for monetization.
            </p>

          </div>

          {/* SUPPORT URL */}
          <div>

            <label
              className="
                text-sm
                text-zinc-400
                mb-2
                block
              "
            >
              Patreon / Support URL
            </label>

            <input
              type="text"
              name="support_url"
              value={form.support_url || ""}
              onChange={handleChange}
              placeholder="https://patreon.com/..."
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
            />

          </div>

          {/* PURCHASE URL */}
          <div>

            <label
              className="
                text-sm
                text-zinc-400
                mb-2
                block
              "
            >
              External Purchase URL
            </label>

            <input
              type="text"
              name="external_purchase_url"
              value={
                form.external_purchase_url || ""
              }
              onChange={handleChange}
              placeholder="https://..."
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
            />

          </div>

        </div>

      )}

      {/* ---------------------------------
         MODVAULT MARKETPLACE
      --------------------------------- */}

      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          border
          border-zinc-800
          bg-black/30
          px-5
          py-5
        "
      >

        <div>

          <h3
            className="
              font-semibold
              text-lg
            "
          >
            Paid Mod on ModVault
          </h3>

          <p
            className="
              text-sm
              text-zinc-500
              mt-1
              leading-relaxed
            "
          >
            Sell this creation directly
            through the future ModVault
            marketplace ecosystem.
          </p>

        </div>

        <div
  className="
    flex
    items-start
    justify-between

    rounded-2xl
    border
    border-zinc-800

    bg-black/20

    px-5
    py-5

    opacity-50
  "
>

  <div>

    <div
      className="
        flex
        items-center
        gap-3
      "
    >

      <h3 className="font-semibold">
        Paid Mod on ModVault
      </h3>

      <span
        className="
          rounded-full
          border
          border-purple-500/20

          bg-purple-500/10

          px-3
          py-1

          text-[10px]
          uppercase
          tracking-[0.2em]

          text-purple-300
        "
      >
        Coming Soon
      </span>

    </div>

    <p
      className="
        text-sm
        text-zinc-500
        mt-2
        max-w-xl
        leading-relaxed
      "
    >
      Native marketplace sales,
      secure delivery,
      ownership verification,
      and creator payouts
      are currently in development.
    </p>

  </div>

  <input
    type="checkbox"
    disabled
    checked={false}
    className="
      w-5
      h-5

      cursor-not-allowed
    "
  />

</div>

      </div>

      {/* PRICE */}
      {false && (

        <div>

          <label
            className="
              text-sm
              text-zinc-400
              mb-2
              block
            "
          >
            Suggested Price
          </label>

          <input
            type="number"
            step="0.01"
            name="price"
            value={form.price || ""}
            onChange={handleChange}
            placeholder="5.00"
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
          />

        </div>

      )}

    </section>

  );

}