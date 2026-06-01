"use client";

import Navbar from "@/components/layout/Navbar";

import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardModsGrid from "@/components/dashboard/DashboardModsGrid";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import DashboardCreatorManager from "@/components/dashboard/DashboardCreatorManager";

import PageLoader from "@/components/ui/PageLoader";

import useDashboardData from "@/app/hooks/useDashboardData";

export default function DashboardPage() {

  const {

    loading,

    mods,

    creatorIds,

  } = useDashboardData();

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

        <DashboardCreatorManager />

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
            mods={mods}
          />

        )}

      </div>

    </main>

  );

}