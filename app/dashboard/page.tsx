"use client";

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

import {
  useState,
} from "react";


export default function DashboardPage() {

  const [
  refreshKey,
  setRefreshKey,
] = useState(0);

  const {

  loading,

  mods,

  currentMods,

  creatorIds,

} = useDashboardData(
  refreshKey
);

    const {

  creator,
  isTeamOwner,

  modCount,

  hasConnectedPlatform,

} = useCurrentCreatorData(
  refreshKey
);

  /* --------------------------------
     LOADING
  -------------------------------- */

  if (loading) {

    return (
      <PageLoader
        text="Loading dashboard..."
      />
    );

  }

console.log("CURRENT CREATOR", creator);

  return (

    <main
      className="
        min-h-screen
        bg-black
        text-white
      "
    >

      <Navbar />

      <div
        className="
          max-w-6xl
          mx-auto
          px-6
          py-16
        "
      >

        <DashboardHero profileType={creator?.owner_type === "team" ? "team" : "creator"} />

        <DashboardCreatorManager
          onCreatorChanged={() =>
            setRefreshKey(
              prev => prev + 1
            )
          }
        />

        {creator?.owner_type === "team" ? (
          isTeamOwner ? <TeamControls
            key={creator.id}
            creator={{ ...creator, team_id: creator.team_id || "" }}
            onTeamDeleted={() => setRefreshKey((prev) => prev + 1)}
          /> : <p role="alert" className="mb-8 rounded-2xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">This team dashboard is available only to its owner.</p>
        ) : (
          <>
            <DashboardCreatorOverview creator={creator} modCount={modCount} hasConnectedPlatform={hasConnectedPlatform} />
            {creator?.owner_type === "user" && <TeamMembership creatorId={creator.id} />}
            <DashboardStats creatorCount={creatorIds.length} modCount={mods.length} />
            {mods.length === 0 ? <DashboardEmptyState /> : <DashboardModsGrid mods={currentMods} onModChanged={() => setRefreshKey((prev) => prev + 1)} />}
          </>
        )}

        <DashboardRoadmapPreview />

      </div>

    </main>

  );

}
