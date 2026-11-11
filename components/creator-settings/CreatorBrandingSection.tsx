import { ProfileImageFields } from "@/components/profile/ProfileFormFields";

export default function CreatorBrandingSection({ form, onChange, onUploadingChange }: {
  form: { avatar: string; banner: string };
  onChange: (field: "avatar" | "banner", value: string) => void;
  onUploadingChange: (busy: boolean) => void;
}) {
  return <section className="space-y-6">
    <h2 className="text-2xl font-bold">Branding</h2>
    <ProfileImageFields values={form} onChange={onChange} onUploadingChange={onUploadingChange} />
  </section>;
}
