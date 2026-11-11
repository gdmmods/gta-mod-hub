import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import DiscussionHistory from '@/components/discussions/DiscussionHistory';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DiscussionsPage() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  return <main className="min-h-screen bg-black text-white"><Navbar />
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-12">
      <header className="border-b border-zinc-800 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-purple-400">Your account</p>
        <h1 className="mt-2 text-3xl font-bold">Communication Hub</h1>
        <p className="mt-3 text-sm text-zinc-400">Your discussions across personal and creator identities.</p>
        <p className="mt-2 text-xs text-zinc-500">Private messages will come later.</p>
      </header>
      {user ? <DiscussionHistory /> : <p className="text-zinc-400"><Link className="text-purple-300" href="/login">Sign in</Link> to view your discussions. Every account can participate.</p>}
    </div>
  </main>;
}
