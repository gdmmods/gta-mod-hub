import type { RoadmapSection } from "../types";

export const foundation: RoadmapSection = {
  id: "foundation",

  title: "Foundation",

  description:
    "Building the core systems that establish ModVault as a creator-first ecosystem. This chapter focuses on identity, attribution, collaboration, historical continuity, and the architecture every future feature depends upon.",

  phases: [
    {
      id: 0,
      phase: "Phase 0",

      title: "Foundation & Core Architecture",

      summary:
        "Establishing the technical foundation and architectural principles that power the entire ModVault ecosystem.",

      state: "development",

      progress: 90,

      capabilities: [
        { title: "Next.js application architecture", status: "complete" },
        { title: "Supabase backend & RLS", status: "complete" },
        { title: "Authentication", status: "complete" },
        { title: "User profiles", status: "complete" },
        { title: "Dashboard architecture", status: "progress" },
        { title: "Creator context & switching", status: "complete" },
        { title: "Database architecture", status: "complete" },
      ],

      currentFocus:
        "Preparing the platform architecture for production readiness.",
    },

    {
      id: 1,
      phase: "Phase 1",

      title: "Core Mod Platform",

      summary:
        "Building the project and mod management systems that form the heart of the platform.",

      state: "development",

      progress: 75,

      capabilities: [
        { title: "Mod records", status: "complete" },
        { title: "Mod management", status: "complete" },
        { title: "Creator-to-mod relationships", status: "complete" },
        { title: "Dashboard integration", status: "complete" },
        { title: "Metadata architecture", status: "progress" },
        { title: "Rich version history", status: "planned" },
        { title: "Release channels", status: "planned" },
        { title: "Dependencies", status: "planned" },
        { title: "Compatibility information", status: "planned" },
      ],

      currentFocus:
        "Evolving mods into fully managed creator projects.",
    },

    {
      id: 2,
      phase: "Phase 2",

      title: "Creator Identity",

      summary:
        "iving creators full control over their public identity.",

      state: "development",

      progress: 85,

      capabilities: [
        { title: "Creator identities", status: "complete" },
        { title: "Multiple creator management", status: "complete" },
        { title: "Creator memberships", status: "complete" },
        { title: "Creator switching", status: "complete" },
        { title: "Public creator profiles", status: "complete" },
        { title: "Default creator context", status: "complete" },
        { title: "Unclaimed creator profiles", status: "progress" },
        { title: "Verification", status: "progress" },
        { title: "Identity provenance", status: "planned" },
      ],

      currentFocus:
        "Strengthening creator ownership, verification and historical identity.",
    },

    {
      id: 3,
      phase: "Phase 3",

      title: "Ownership & Attribution",

      summary:
        "Ensuring creators receive proper attribution while preserving the historical ownership of creative work.",

      state: "development",

      progress: 40,

      capabilities: [
        { title: "Attribution foundation", status: "complete" },
        { title: "Rich attribution", status: "progress" },
        { title: "Ownership history", status: "planned" },
        { title: "Evidence framework", status: "planned" },
        { title: "Creator claims", status: "progress" },
        { title: "Dispute resolution", status: "planned" },
      ],

      currentFocus:
        "Expanding attribution into a complete ownership framework.",
    },

    {
      id: 4,
      phase: "Phase 4",

      title: "Teams & Collaboration",

      summary:
        "Helping creators collaborate through shared ownership, memberships and team management.",

      state: "development",

      progress: 80,

      capabilities: [
        { title: "Team architecture", status: "complete" },
        { title: "Team creator identities", status: "complete" },
        { title: "Team memberships", status: "complete" },
        { title: "Ownership architecture", status: "complete" },
        { title: "Secure team deletion", status: "complete" },
        { title: "Invitations", status: "progress" },
        { title: "Permissions", status: "planned" },
        { title: "Recruitment", status: "progress" },
      ],

      currentFocus:
        "Completing the collaborative creator workflow.",
    },
    
  ],
};