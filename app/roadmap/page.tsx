import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/roadmap/Hero";
import Timeline from "@/components/roadmap/Timeline";
import DevelopmentSnapshot from "@/components/roadmap/DevelopmentSnapshot";
import CreatorTracker from "@/components/roadmap/CreatorTracker";
import Pillars from "@/components/roadmap/Pillars";
import FooterCTA from "@/components/roadmap/FooterCTA";
import CurrentPhase from "@/components/roadmap/CurrentPhase";
import SupporterPreview from "@/components/roadmap/SupporterPreview";

import RoadmapSection from "@/components/roadmap/RoadmapSection";

import {
    currentDevelopment,
    roadmapSections,
} from "@/lib/roadmap";

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-[#040404] text-white overflow-hidden">

      <Navbar />

      <Hero />   

      <CurrentPhase
          development={currentDevelopment}
      /> 

        {roadmapSections.map((section) => (
        <RoadmapSection
          key={section.id}
          section={section}
        />
      ))}

      <Timeline />

      <DevelopmentSnapshot />

      <CreatorTracker />

      <Pillars />

      <SupporterPreview />

      <FooterCTA />

    </main>
  );
}