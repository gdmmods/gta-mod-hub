import { useState } from "react";

import CreatorProfileSection from "@/components/creator-settings/CreatorProfileSection";

import CreatorBrandingSection from "@/components/creator-settings/CreatorBrandingSection";

import CreatorSocialsSection from "@/components/creator-settings/CreatorSocialsSection";

import CreatorSettingsSubmit from "@/components/creator-settings/CreatorSettingsSubmit";

type Props = {

  form: any;

  handleChange: any;

  handleSubmit: any;

  loading: boolean;

};

export default function CreatorSettingsForm({

  form,

  handleChange,

  handleSubmit,

  loading,

}: Props) {

const [aliases, setAliases] =
  useState<string[]>([]);

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

      <button
        type="button"
        onClick={() =>
          setAliases([
            ...aliases,
            "",
          ])
        }
        className="
          rounded-xl
          bg-zinc-800
          px-4
          py-2
        "
      >
        Add Alias
      </button>

      {aliases.map(
        (alias, index) => (
          <input
            key={index}
            value={alias}
            onChange={(e) => {

              const updated = [
                ...aliases,
              ];

              updated[index] =
                e.target.value;

              setAliases(updated);

            }}
            placeholder="Alias"
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