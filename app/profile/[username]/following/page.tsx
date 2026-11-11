import SocialDirectory from "@/components/following/SocialDirectory";

export const dynamic = "force-dynamic";

export default async function ProfileFollowingPage({ params, searchParams }: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ view?: string | string[]; page?: string | string[] }>;
}) {
  return <SocialDirectory username={(await params).username} query={await searchParams} />;
}
