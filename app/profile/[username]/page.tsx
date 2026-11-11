import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import CreatorHeader from "@/components/creator/profile/CreatorHeader";
import CommunityContributions from "@/components/discussions/CommunityContributions";
import DiscussionHistory from "@/components/discussions/DiscussionHistory";
import FollowButton, { profileFollowClassName } from "@/components/following/FollowButton";
import RelationshipStats, { type RelationshipCounts } from "@/components/following/RelationshipStats";
import ProfileDetails from "@/components/profile/ProfileDetails";
import ProfileHeroFrame from "@/components/profile/ProfileHeroFrame";
import { loadPersonalProfile } from "@/lib/profile/personal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const client = await createSupabaseServerClient();
  const [{ profile, error }, { data: { user } }, { data: counts }, { data: handle }] = await Promise.all([
    loadPersonalProfile(client, "username", username.toLowerCase()),
    client.auth.getUser(),
    client.rpc("personal_relationship_counts", { p_username: username }),
    client.rpc("get_personal_handle", { p_username: username.toLowerCase() }),
  ]);
  if (error) throw error;
  if (!profile?.username) notFound();

  const base = "/profile/" + encodeURIComponent(profile.username);
  const name = profile.display_name || profile.username;
  return <main className="min-h-screen bg-black text-white">
    <Navbar />
    <ProfileHeroFrame name={name} avatar={profile.avatar_url} banner={profile.banner_url}
      actions={<div className="mt-5 w-full space-y-3">
        {user?.id !== profile.id && <FollowButton kind="user" id={profile.id} className={profileFollowClassName} />}
        {user?.id === profile.id && <Link href="/settings" className="inline-block rounded-2xl border border-purple-500/30 bg-purple-600/20 px-5 py-3 text-sm font-medium text-purple-200 hover:border-purple-400">Edit Profile</Link>}
      </div>}
      header={<CreatorHeader name={name} handle={typeof handle === "string" ? handle : profile.username} profileType="USER"
        relationshipRow={<RelationshipStats base={base} counts={(counts ?? {}) as RelationshipCounts} />} />}>
      <ProfileDetails tagline={profile.tagline} interests={profile.interests} bio={profile.bio}
        location={profile.location} socials={profile.socials ?? {}} personal />
    </ProfileHeroFrame>
    <div className="mx-auto max-w-[1450px] space-y-6 px-5 py-6">
      <CommunityContributions identity={{ type: "user", id: profile.id }} />
      <DiscussionHistory recent identity={{ type: "user", id: profile.id }} historyHref={base + "/discussions"} />
    </div>
  </main>;
}
