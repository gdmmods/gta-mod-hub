import SocialDirectory from "@/components/following/SocialDirectory";

export const dynamic = "force-dynamic";

export default async function CreatorFollowingPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string | string[]; page?: string | string[] }>;
}) {
  return <SocialDirectory creator={(await params).id} query={await searchParams} />;
}
