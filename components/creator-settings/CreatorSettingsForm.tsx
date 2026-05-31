import { useState } from "react";

import CreatorProfileSection from "@/components/creator-settings/CreatorProfileSection";

import CreatorBrandingSection from "@/components/creator-settings/CreatorBrandingSection";

import CreatorSocialsSection from "@/components/creator-settings/CreatorSocialsSection";

import CreatorSettingsSubmit from "@/components/creator-settings/CreatorSettingsSubmit";

type Props = {

  form: any;

  setForm: any;

  handleChange: any;

  handleSubmit: any;

  loading: boolean;

};

export default function CreatorSettingsForm({

  form,

  setForm,

  handleChange,

  handleSubmit,

  loading,

}: Props) {

  console.log("FORM:", form);

  return (

    <form
      onSubmit={handleSubmit}
      className="space-y-10"
    >

      <CreatorProfileSection
        form={form}
        handleChange={handleChange}
      />

      <CreatorBrandingSection
        form={form}
        handleChange={handleChange}
      />

      <section className="space-y-4">

      <h2 className="text-2xl font-bold">
        Creator Aliases
      </h2>

      <p className="text-zinc-400 text-sm">
        Alternate creator names used across platforms.
      </p>

      <button
        type="button"
        onClick={() => {

          setForm((prev: any) => ({
            ...prev,
            aliases: [
            ...(prev.aliases || []),
            `New Alias ${
              (prev.aliases?.length || 0) + 1
            }`,
            ],
          }));

        }}
        className="
          rounded-xl
          bg-zinc-800
          px-4
          py-2
          hover:bg-zinc-700
        "
      >
        Add Alias
      </button>

      {form.aliases?.map(
        (alias: string, index: number) => (

          <div
            key={index}
            className="
              flex
              gap-3
            "
          >

            <input
              value={alias}
              onChange={(e) => {

                const updated = [
                  ...form.aliases,
                ];

                updated[index] =
                  e.target.value;

                setForm((prev: any) => ({
                  ...prev,
                  aliases: updated,
                }));

              }}
              className="
                flex-1
                rounded-xl
                bg-zinc-950
                border
                border-zinc-800
                px-4
                py-3
              "
            />

            <button
              type="button"
              onClick={() => {

                const updated =
                  form.aliases.filter(
                    (
                      _: string,
                      i: number
                    ) =>
                      i !== index
                  );

                setForm((prev: any) => ({
                  ...prev,
                  aliases: updated,
                }));

              }}
              className="
                rounded-xl
                bg-red-500/20
                px-4
                py-3
                text-red-400
                hover:bg-red-500/30
              "
            >
              Remove
            </button>

          </div>

        )
      )}

    </section>

      <CreatorSocialsSection
        form={form}
        handleSocialChange={(
        field: string,
        value: string
      ) => {

        form.socials = {
          ...form.socials,
          [field]: value,
        };

      }}
      />

      <CreatorSettingsSubmit
        loading={loading}
      />

    </form>

  );

}