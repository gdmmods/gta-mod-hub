"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AuthenticatedUploadLink({ children, className }: { children: ReactNode; className: string }) {
  const [connected, setConnected] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setConnected(Boolean(user));
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setConnected(Boolean(session?.user));
      setAuthChecked(true);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!authChecked || !connected) return null;
  return <Link href="/upload" className={className}>{children}</Link>;
}
