import type { ChangeEvent } from "react";
import { ProfileTextFields, profileInputClass } from "@/components/profile/ProfileFormFields";

type Props = {
  form: { name: string; tagline: string; status: string; location: string; bio: string };
  handleChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

export default function CreatorProfileSection({ form, handleChange }: Props) {
  return <section className="space-y-6">
    <h2 className="text-2xl font-bold">Profile</h2>
    <ProfileTextFields form={form} onChange={handleChange} />
    <label className="block space-y-2 text-sm text-zinc-300">
      <span>Status badge</span>
      <input name="status" value={form.status} onChange={handleChange} className={profileInputClass} />
    </label>
  </section>;
}
