export type RoadmapStatus =
  | "complete"
  | "in-progress"
  | "planned";

export interface RoadmapItem {
  text: string;
  done: boolean;
}

export interface RoadmapPhase {
  phase: string;
  title: string;
  status: RoadmapStatus;
  progress: number;
  items: RoadmapItem[];
}