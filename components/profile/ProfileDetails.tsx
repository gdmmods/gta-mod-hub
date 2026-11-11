import CreatorAboutSection from "@/components/creator/profile/CreatorAboutSection";
import CreatorBio from "@/components/creator/profile/CreatorBio";
import CreatorSocialLinks from "@/components/creator/profile/CreatorSocialLinks";

export default function ProfileDetails({ tagline, interests, bio, location, socials, personal = false }: {
  tagline?: string | null;
  interests?: string[] | null;
  bio?: string | null;
  location?: string | null;
  socials: Record<string, string>;
  personal?: boolean;
}) {
  return <>
    <div className="mt-6"><CreatorAboutSection tagline={tagline} specialization={interests} /></div>
    <div className="mt-6"><CreatorBio bio={bio} emptyText={personal ? "No biography added yet." : undefined} /></div>
    {location && <p className="mt-6 break-words text-sm text-zinc-400"><span className="text-zinc-300">Location</span> · {location}</p>}
    <div className="mt-7"><CreatorSocialLinks socials={socials} /></div>
  </>;
}
