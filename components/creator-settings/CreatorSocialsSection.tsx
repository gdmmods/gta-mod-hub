import { ProfileSocialFields } from "@/components/profile/ProfileFormFields";

export default function CreatorSocialsSection({ form, handleSocialChange }: {
  form: { socials: Record<string, string> };
  handleSocialChange: (field: string, value: string) => void;
}) {
  return <section className="space-y-6">
    <h2 className="text-2xl font-bold">Socials</h2>
    <ProfileSocialFields socials={form.socials} onChange={handleSocialChange} creator />
  </section>;
}
