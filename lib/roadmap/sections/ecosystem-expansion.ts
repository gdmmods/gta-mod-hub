import type { RoadmapSection } from "../types";

export const ecosystemExpansion: RoadmapSection = {
  id: "ecosystem-expansion",

  title: "Ecosystem Expansion",

  description:
    "Extending ModVault beyond the website through integrations, desktop experiences, open APIs, and creator tools that connect the wider modding ecosystem.",

  phases: [
    {
      id: 11,
      phase: "Phase 11",

      title: "Desktop Experience",

      summary:
        "Building a dedicated desktop application for managing libraries, downloads, updates, and local projects.",

      state: "planned",

      progress: 0,

      capabilities: [
        { title: "Desktop application", status: "planned" },
        { title: "Download manager", status: "planned" },
        { title: "Local mod library", status: "planned" },
        { title: "Automatic updates", status: "planned" },
        { title: "Offline support", status: "planned" },
      ],

      currentFocus:
        "Creating a seamless desktop workflow for creators and players.",
    },

    {
      id: 12,
      phase: "Phase 12",

      title: "Platform Integrations",

      summary:
        "Connecting ModVault with launchers, external services, and development workflows.",

      state: "planned",

      progress: 0,

      capabilities: [
        { title: "Launcher integrations", status: "planned" },
        { title: "OAuth integrations", status: "planned" },
        { title: "External services", status: "planned" },
        { title: "Discord integration", status: "planned" },
        { title: "Developer workflows", status: "planned" },
      ],

      currentFocus:
        "Reducing friction between ModVault and the tools creators already use.",
    },

    {
      id: 13,
      phase: "Phase 13",

      title: "Open Platform",

      summary:
        "Opening ModVault through public APIs and developer tooling that encourage community-built applications.",

      state: "planned",

      progress: 0,

      capabilities: [
        { title: "Public REST API", status: "planned" },
        { title: "Authentication tokens", status: "planned" },
        { title: "Webhooks", status: "planned" },
        { title: "SDKs", status: "planned" },
        { title: "Developer documentation", status: "planned" },
      ],

      currentFocus:
        "Making ModVault a platform others can build upon.",
    },

    {
      id: 14,
      phase: "Phase 14",

      title: "Cross-Platform Identity",

      summary:
        "Creating a persistent creator identity that follows creators across games, projects, and communities.",

      state: "planned",

      progress: 0,

      capabilities: [
        { title: "Linked creator identities", status: "planned" },
        { title: "Cross-game creator profiles", status: "planned" },
        { title: "Unified contribution history", status: "planned" },
        { title: "External identity linking", status: "planned" },
        { title: "Creator portfolio", status: "planned" },
      ],

      currentFocus:
        "Recognizing creators beyond individual projects.",
    },

    {
      id: 15,
      phase: "Phase 15",

      title: "Partner Ecosystem",

      summary:
        "Supporting communities, studios, preservation groups, and organizations that strengthen the wider ecosystem.",

      state: "planned",

      progress: 0,

      capabilities: [
        { title: "Community partnerships", status: "planned" },
        { title: "Studio collaborations", status: "planned" },
        { title: "Preservation partners", status: "planned" },
        { title: "Educational resources", status: "planned" },
        { title: "Partner integrations", status: "planned" },
      ],

      currentFocus:
        "Building an ecosystem that extends beyond ModVault itself.",
    },
  ],
};