import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import DiscussionHistory from '@/components/discussions/DiscussionHistory';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export default async function CreatorDiscussions({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await createSupabaseServerClient();
  const { data } = await client.from('creators').select('id,name').eq('id', id).maybeSingle();
  if (!data) notFound();
  return <main className="min-h-screen bg-black text-white"><Navbar /><div className="mx-auto max-w-5xl space-y-6 px-5 py-12">
    <Link href={`/creator/${data.id}`} className="text-sm text-purple-300">← {data.name}</Link>
    <h1 className="text-3xl font-bold">{data.name} · Discussions</h1>
    <DiscussionHistory identity={{ type: 'creator', id: data.id }} />
  </div></main>;
}
