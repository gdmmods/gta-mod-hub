// lib/roadmap/types.ts

export type PhaseState =
  | "planned"
  | "research"
  | "design"
  | "development"
  | "testing"
  | "released";

export type CapabilityStatus =
  | "complete"
  | "progress"
  | "planned";

export interface Capability {
  title: string;
  status: CapabilityStatus;
}

export interface RoadmapPhase {
  id: number;
  phase: string;

  title: string;
  summary: string;

  state: PhaseState;
  progress: number;

  capabilities: Capability[];

  currentFocus: string;
}

export interface RoadmapSection {
  id: string;

  title: string;
  description: string;

  phases: RoadmapPhase[];
}

export interface CurrentDevelopment {
  phaseId: number;

  heading: string;

  title: string;

  summary: string;

  currentFocus: string;

  progress: number;

  recentProgress: string[];

  upNext: string[];

  developerNote: {
    title: string;
    content: string;
  };
}