import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/roadmap/Hero";
import Timeline from "@/components/roadmap/Timeline";
import DevelopmentSnapshot from "@/components/roadmap/DevelopmentSnapshot";
import Pillars from "@/components/roadmap/Pillars";
import CurrentPhase from "@/components/roadmap/CurrentPhase";
import SupporterPreview from "@/components/roadmap/SupporterPreview";
import LaunchMilestone from "@/components/roadmap/LaunchMilestone";

import RoadmapSection from "@/components/roadmap/RoadmapSection";
import {
  currentDevelopment,
  foundation,
  creatorEcosystem,
  creatorFederation,
} from "@/lib/roadmap";

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-[#040404] text-white overflow-hidden">

      <Navbar />

      <Hero />   

      <Timeline />

      <CurrentPhase
        development={currentDevelopment}
      />

      <RoadmapSection
        section={foundation}
      />

      <LaunchMilestone />

      <RoadmapSection
        section={creatorEcosystem}
      />

      <DevelopmentSnapshot />

      <RoadmapSection
        section={creatorFederation}
      />

      <Pillars />

      <SupporterPreview />

    </main>
  );
}