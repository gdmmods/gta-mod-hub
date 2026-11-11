"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import { supabase } from "@/lib/supabase/client";

import { filterOperationalCreators } from '@/lib/team/operational-creators';

export type CreatorOption = {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string[] | null;
  owner_type: string | null;
  team_id: string | null;
};

type CreatorMembershipRow = {
  creator_id: string;
  creators: CreatorOption | CreatorOption[] | null;
};

type CreatorContextType = {
  accountId: string | null;
  creators: CreatorOption[];
  activeCreatorId: string | null;
  activeCreator: CreatorOption | null;
  loading: boolean;
  selecting: boolean;
  error: string | null;
  selectActiveCreator: (creatorId: string | null) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const CreatorContext = createContext<CreatorContextType | undefined>(undefined);

function getCreatorOptions(rows: CreatorMembershipRow[]): CreatorOption[] {
  const unique = new Map<string, CreatorOption>();

  for (const row of rows) {
    const relatedCreator = Array.isArray(row.creators)
      ? row.creators[0] ?? null
      : row.creators;

    if (!relatedCreator || relatedCreator.id !== row.creator_id) continue;

    unique.set(relatedCreator.id, {
      id: relatedCreator.id,
      name: relatedCreator.name,
      avatar: relatedCreator.avatar ?? null,
      specialization: relatedCreator.specialization ?? null,
      owner_type: relatedCreator.owner_type ?? null,
      team_id: relatedCreator.team_id ?? null,
    });
  }

  return [...unique.values()].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }) ||
    left.id.localeCompare(right.id)
  );
}

export function CreatorProvider({ children }: { children: ReactNode }) {
  const [creators, setCreators] = useState<CreatorOption[]>([]);
  const [activeCreatorId, setActiveCreatorId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVersion = useRef(0);
  const selectionVersion = useRef(0);
  const loadedAccountId = useRef<string | null | undefined>(undefined);
  const persistedCreatorId = useRef<string | null>(null);

  const loadForAccount = useCallback(async (userId: string | null, force = false) => {
    if (!force && loadedAccountId.current === userId) return;

    const version = ++loadVersion.current;
    selectionVersion.current += 1;
    loadedAccountId.current = userId;
    persistedCreatorId.current = null;
    setAccountId(userId);
    setCreators([]);
    setActiveCreatorId(null);
    setSelecting(false);
    setError(null);
    setLoading(true);

    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const [profileResult, membershipResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("default_creator_id")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("creator_members")
          .select(`
            creator_id,
            creators (
              id,
              name,
              avatar,
              specialization,
              owner_type,
              team_id
            )
          `)
          .eq("profile_id", userId)
          .eq("status", "approved"),
      ]);

      if (version !== loadVersion.current) return;
      if (membershipResult.error) {
        throw new Error("Could not load your approved creator profiles.");
      }

      const options = await filterOperationalCreators(supabase, getCreatorOptions(
        (membershipResult.data ?? []) as unknown as CreatorMembershipRow[]
      ));
      if (version !== loadVersion.current) return;
      setCreators(options);

      if (profileResult.error || !profileResult.data) {
        throw new Error("Could not load your saved Active Creator selection.");
      }

      const savedCreatorId = profileResult.data.default_creator_id;
      persistedCreatorId.current = savedCreatorId;

      const selectedCreatorId = options.some((creator) => creator.id === savedCreatorId)
        ? savedCreatorId
        : null;

      if (savedCreatorId !== selectedCreatorId) {
        setActiveCreatorId(selectedCreatorId);
        const { data: updatedProfile, error: saveError } = await supabase
          .from("profiles")
          .update({ default_creator_id: selectedCreatorId })
          .eq("id", userId)
          .select("id")
          .maybeSingle();

        if (version !== loadVersion.current) return;
        if (saveError || !updatedProfile) {
          throw new Error("The available Active Creator is selected for this session, but could not be saved to your profile.");
        }
        persistedCreatorId.current = selectedCreatorId;
      }

      if (version === loadVersion.current) {
        setActiveCreatorId(selectedCreatorId);
        setError(null);
      }
    } catch (cause) {
      if (version === loadVersion.current) {
        setError(cause instanceof Error ? cause.message : "Could not load the Active Creator.");
      }
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null;
      if (nextUserId === loadedAccountId.current) return;

      setActiveCreatorId(null);
      setCreators([]);
      setLoading(true);
      setSelecting(false);
      setError(null);
      window.setTimeout(() => {
        if (mounted) void loadForAccount(nextUserId, true);
      }, 0);
    });

    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!mounted) return;
      if (authError) {
        setError("Could not verify your account session.");
        setLoading(false);
        return;
      }
      void loadForAccount(data.user?.id ?? null);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      loadVersion.current += 1;
      selectionVersion.current += 1;
    };
  }, [loadForAccount]);

  const refresh = useCallback(async () => {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError) {
      setError("Could not verify your account session.");
      return;
    }
    await loadForAccount(data.user?.id ?? null, true);
  }, [loadForAccount]);

  const selectActiveCreator = useCallback(async (creatorId: string | null) => {
    if (!accountId || loading || selecting) return false;
    if (creatorId !== null && !creators.some((creator) => creator.id === creatorId)) {
      setError("That creator is not available to your account.");
      return false;
    }
    if (activeCreatorId === creatorId && persistedCreatorId.current === creatorId) {
      setError(null);
      return true;
    }

    const selectionRequest = ++selectionVersion.current;
    const accountAtStart = accountId;
    setSelecting(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || authData.user?.id !== accountAtStart) {
        setError("Your account changed. Reload the creator list and try again.");
        if (authData.user?.id !== accountAtStart) void loadForAccount(authData.user?.id ?? null, true);
        return false;
      }

      if (creatorId !== null) {
        const { data: membership, error: membershipError } = await supabase
          .from("creator_members")
          .select("creator_id")
          .eq("profile_id", accountAtStart)
          .eq("creator_id", creatorId)
          .eq("status", "approved")
          .maybeSingle();

        const selected = creators.find(c => c.id === creatorId);
        const operational = selected ? await filterOperationalCreators(supabase, [selected]) : [];
        if (membershipError || !membership || operational.length === 0) {
          setError("You no longer have approved access to that creator.");
          void loadForAccount(accountAtStart, true);
          return false;
        }
      }

      const { data: updatedProfile, error: saveError } = await supabase
        .from("profiles")
        .update({ default_creator_id: creatorId })
        .eq("id", accountAtStart)
        .select("id")
        .maybeSingle();

      if (selectionRequest !== selectionVersion.current || loadedAccountId.current !== accountAtStart) return false;
      if (saveError || !updatedProfile) {
        setError("The Active Creator could not be saved. Your previous selection is still active.");
        return false;
      }

      persistedCreatorId.current = creatorId;
      setActiveCreatorId(creatorId);
      setError(null);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The Active Creator could not be saved.");
      return false;
    } finally {
      if (selectionRequest === selectionVersion.current) setSelecting(false);
    }
  }, [accountId, activeCreatorId, creators, loadForAccount, loading, selecting]);

  useEffect(() => {
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  const activeCreator = useMemo(
    () => creators.find((creator) => creator.id === activeCreatorId) ?? null,
    [activeCreatorId, creators]
  );

  const value = useMemo<CreatorContextType>(() => ({
    accountId,
    creators,
    activeCreatorId,
    activeCreator,
    loading,
    selecting,
    error,
    selectActiveCreator,
    refresh,
  }), [accountId, creators, activeCreatorId, activeCreator, loading, selecting, error, selectActiveCreator, refresh]);

  return <CreatorContext.Provider value={value}>{children}</CreatorContext.Provider>;
}

export function useCreatorContext() {
  const context = useContext(CreatorContext);
  if (!context) throw new Error("useCreatorContext must be used inside CreatorProvider");
  return context;
}
