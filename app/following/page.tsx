import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import FollowingList from "@/components/following/FollowingList";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FollowingPage() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  return <main className="min-h-screen bg-black text-white">
    <Navbar />
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-12">
      <h1 className="text-3xl font-bold">Following</h1>
      {user ? <FollowingList /> : <Link href="/login" className="text-purple-300 hover:underline">Sign in to see who you follow</Link>}
    </div>
  </main>;
}
