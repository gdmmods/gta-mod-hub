"use client";

import CreatorTier from "@/components/ratings/CreatorTier";
import RelationshipStats, { type RelationshipCounts } from "@/components/following/RelationshipStats";
import ProfileHeroFrame from "@/components/profile/ProfileHeroFrame";
import ProfileDetails from "@/components/profile/ProfileDetails";
import { publicProfileUrl } from "@/lib/profile/fields";
import type { ExternalDownloadSummary } from "@/lib/server/external-download-counts-core";
import CreatorActions from "./CreatorActions";
import CreatorHeader from "./CreatorHeader";
import CreatorStats from "./CreatorStats";

type CreatorHeroProfile = {
  id: string;
  name: string;
  owner_type: string | null;
  avatar: string | null;
  verified: boolean | null;
  status: string | null;
  tagline: string | null;
  specialization: string[] | null;
  bio: string | null;
  location: string | null;
};

type CreatorHeroProps = {
  creator: CreatorHeroProfile;
  bannerImage: string;
  handle?: string;
  socials: Record<string, string>;
  modsCount: number;
  totalLikes: number;
  totalDownloads: number;
  externalDownloadSummary: ExternalDownloadSummary;
  isManaged: boolean;
  relationships: RelationshipCounts;
  creatorGames: Array<{ id: string; name: string; slug: string }>;
};

export default function CreatorHero({
  creator, bannerImage, handle, socials, modsCount, totalLikes, totalDownloads, externalDownloadSummary,
  isManaged, relationships, creatorGames,
}: CreatorHeroProps) {
  const supportUrl = [socials.patreon, socials.kofi, socials.store, socials.website].map(publicProfileUrl).find(Boolean);
  return <ProfileHeroFrame name={creator.name} avatar={creator.avatar} banner={bannerImage}
    actions={<CreatorActions creatorId={creator.id} supportUrl={supportUrl} />}
    header={<CreatorHeader
      name={creator.name}
      handle={handle}
      profileType={creator.owner_type === "team" ? "TEAM" : "CREATOR"}
      verified={creator.verified}
      status={creator.status}
      isManaged={isManaged}
      games={creatorGames}
      relationshipRow={<RelationshipStats base={`/creator/${creator.id}`} counts={relationships} />}
    />}>
    <ProfileDetails tagline={creator.tagline} interests={creator.specialization} bio={creator.bio} socials={socials} />
    <div className="mt-10">
      <CreatorTier creatorId={creator.id} />
      <CreatorStats modsCount={modsCount} totalLikes={totalLikes} totalDownloads={totalDownloads}
        externalDownloadSummary={externalDownloadSummary} location={creator.location} />
    </div>
  </ProfileHeroFrame>;
}
