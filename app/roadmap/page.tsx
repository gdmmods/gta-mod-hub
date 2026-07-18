import Link from "next/link";
import { roadmap } from "@/lib/roadmap/roadmap";

import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/roadmap/Hero";
import Timeline from "@/components/roadmap/Timeline";
import DevelopmentSnapshot from "@/components/roadmap/DevelopmentSnapshot";
import CreatorTracker from "@/components/roadmap/CreatorTracker";
import Pillars from "@/components/roadmap/Pillars";
import FooterCTA from "@/components/roadmap/FooterCTA";
import RoadmapGrid from "@/components/roadmap/RoadmapGrid";

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-[#040404] text-white overflow-hidden">

      <Navbar />

      <Hero />     

      

      <RoadmapGrid phases={roadmap.slice(0, 5)} />

      <Timeline />

      <DevelopmentSnapshot />

      <div className="mt-14">
        <RoadmapGrid phases={roadmap.slice(5)} />
      </div>

      

      <CreatorTracker />

      <Pillars />

      <FooterCTA />

    </main>
  );
}