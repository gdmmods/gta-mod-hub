"use client";

import { useState } from "react";

import Navbar from "@/components/layout/Navbar";
import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardModsGrid from "@/components/dashboard/DashboardModsGrid";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import DashboardCreatorManager from "@/components/dashboard/DashboardCreatorManager";
import DashboardCreatorOverview from "@/components/dashboard/DashboardCreatorOverview";
import PageLoader from "@/components/ui/PageLoader";
import DashboardRoadmapPreview from "@/components/dashboard/DashboardRoadmapPreview";
import TeamControls from "@/components/dashboard/TeamControls";
import TeamMembership from "@/components/dashboard/TeamMembership";
import useDashboardData from "@/app/hooks/useDashboardData";
import useCurrentCreatorData from "@/app/hooks/useCurrentCreatorData";
import { useCreatorContext } from "@/app/contexts/CreatorContext";

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { activeCreator, activeCreatorId, loading: creatorLoading } = useCreatorContext();
  const { loading, mods, currentMods, creatorIds } = useDashboardData(activeCreatorId, refreshKey);
  const { creator, isTeamOwner, modCount, hasConnectedPlatform } = useCurrentCreatorData(activeCreator, refreshKey);

  if (creatorLoading || loading) {
    return <PageLoader text="Loading dashboard..." />;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <DashboardHero profileType={activeCreator?.owner_type === "team" ? "team" : "creator"} />
        <DashboardCreatorManager onCreatorChanged={() => setRefreshKey((previous) => previous + 1)} />
        <DashboardCreatorOverview
          creator={creator}
          modCount={modCount}
          hasConnectedPlatform={hasConnectedPlatform}
        />

        {creator?.owner_type === "team" ? (creator.team_id && isTeamOwner ? <TeamControls
          key={creator.id}
          creator={{ id: creator.id, name: creator.name, team_id: creator.team_id }}
          onTeamDeleted={() => setRefreshKey((previous) => previous + 1)}
        /> : null) : null}        {creator?.owner_type === "user" && <TeamMembership creatorId={creator.id} />}

        <DashboardRoadmapPreview />
        <DashboardStats creatorCount={creatorIds.length} modCount={mods.length} />
        {mods.length === 0 ? (
          <DashboardEmptyState />
        ) : (
          <DashboardModsGrid
            mods={currentMods}
            onModChanged={() => setRefreshKey((previous) => previous + 1)}
          />
        )}
      </div>
    </main>
  );
}
