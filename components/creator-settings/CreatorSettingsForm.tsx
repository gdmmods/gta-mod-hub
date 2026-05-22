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