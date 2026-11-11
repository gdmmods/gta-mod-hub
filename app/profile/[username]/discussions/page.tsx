import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import DiscussionHistory from '@/components/discussions/DiscussionHistory';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export default async function UserDiscussions({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const client = await createSupabaseServerClient();
  const { data } = await client.from('profiles').select('id,username,display_name').eq('username', username.toLowerCase()).maybeSingle();
  if (!data) notFound();
  return <main className="min-h-screen bg-black text-white"><Navbar /><div className="mx-auto max-w-5xl space-y-6 px-5 py-12">
    <Link href={`/profile/${encodeURIComponent(data.username)}`} className="text-sm text-purple-300">← {data.display_name || data.username}</Link>
    <h1 className="text-3xl font-bold">{data.display_name || data.username} · Discussions</h1>
    <DiscussionHistory identity={{ type: 'user', id: data.id }} />
  </div></main>;
}
