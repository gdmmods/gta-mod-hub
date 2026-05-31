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

      {form.aliases?.map(
        (alias: string, index: number) => (

          <input
            key={index}
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
              w-full
              rounded-xl
              bg-zinc-950
              border
              border-zinc-800
              px-4
              py-3
            "
          />

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