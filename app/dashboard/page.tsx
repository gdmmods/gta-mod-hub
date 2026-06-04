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
import DashboardTeamPanel from "@/components/dashboard/DashboardTeamPanel";

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

    modCount,

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

        <DashboardHero />

        <DashboardCreatorManager
          onCreatorChanged={() =>
            setRefreshKey(
              prev => prev + 1
            )
          }
        />

        <DashboardCreatorOverview
          creator={creator}
          modCount={modCount}
        />

        <DashboardTeamPanel
          creator={creator}
        />

        <DashboardRoadmapPreview />

        <DashboardStats
          creatorCount={
            creatorIds.length
          }
          modCount={
            mods.length
          }
        />

        {mods.length === 0 ? (

          <DashboardEmptyState />

        ) : (

          <DashboardModsGrid
            mods={currentMods}
          />

        )}

      </div>

    </main>

  );

}