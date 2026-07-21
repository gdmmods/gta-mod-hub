import type { RoadmapSection } from "../types";

export const platformEvolution: RoadmapSection = {
  id: "platform-evolution",

  title: "Platform Evolution",

  description:
    "Expanding ModVault into a richer platform with better discovery, tooling, workflows, and creator experiences built upon the Foundation.",

  phases: [
    {
      id: 6,
      phase: "Phase 6",

      title: "Collections & Libraries",

      summary:
        "Helping creators and players organize, share, and manage groups of mods.",

      state: "planned",

      progress: 0,

      capabilities: [
        { title: "Collections", status: "planned" },
        { title: "Custom libraries", status: "planned" },
        { title: "Bookmarks", status: "planned" },
        { title: "Follow collections", status: "planned" },
        { title: "Sharing", status: "planned" },
      ],

      currentFocus:
        "Building better ways to organize content.",
    },

    {
      id: 7,
      phase: "Phase 7",

      title: "Advanced Discovery",

      summary:
        "Making it easier to discover creators, projects, and mods through meaningful relationships instead of popularity alone.",

      state: "planned",

      progress: 0,

      capabilities: [
        { title: "Advanced search", status: "planned" },
        { title: "Faceted filters", status: "planned" },
        { title: "Smart recommendations", status: "planned" },
        { title: "Related creators", status: "planned" },
        { title: "Related projects", status: "planned" },
      ],

      currentFocus:
        "Improving discovery while staying creator-first.",
    },

    {
      id: 8,
      phase: "Phase 8",

      title: "Media & Presentation",

      summary:
        "Giving creators better ways to showcase their work through richer media and presentation tools.",

      state: "planned",

      progress: 0,

      capabilities: [
        { title: "Enhanced galleries", status: "planned" },
        { title: "Video embeds", status: "planned" },
        { title: "Rich markdown", status: "planned" },
        { title: "Feature highlights", status: "planned" },
        { title: "Custom page layouts", status: "planned" },
      ],

      currentFocus:
        "Improving how projects are presented.",
    },

    {
      id: 9,
      phase: "Phase 9",

      title: "Creator Tools",

      summary:
        "Providing creators with better tools to manage projects, releases, and communities.",

      state: "planned",

      progress: 0,

      capabilities: [
        { title: "Release management", status: "planned" },
        { title: "Version history", status: "planned" },
        { title: "Project analytics", status: "planned" },
        { title: "Draft publishing", status: "planned" },
        { title: "Creator insights", status: "planned" },
      ],

      currentFocus:
        "Reducing the friction of maintaining projects.",
    },

    {
      id: 10,
      phase: "Phase 10",

      title: "Developer Platform",

      summary:
        "Opening ModVault through APIs and integrations so other tools can build on top of the ecosystem.",

      state: "planned",

      progress: 0,

      capabilities: [
        { title: "Public API", status: "planned" },
        { title: "Authentication tokens", status: "planned" },
        { title: "Webhooks", status: "planned" },
        { title: "SDK", status: "planned" },
        { title: "Developer documentation", status: "planned" },
      ],

      currentFocus:
        "Turning ModVault into an extensible platform.",
    },
  ],
};