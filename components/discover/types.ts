export interface DiscoveryResultProject {
  platform: string;
  externalId: string;
  title: string;
  projectUrl: string;
  imageUrl?: string | null;
  description?: string | null;
  author?: string | null;
  category?: string | null;
  screenshots?: string[];
  matchStatus?: "new" | "existing";
  existingMod?: { id: string; title?: string | null; status?: string | null };
  [key: string]: unknown;
}

export interface DiscoveryPreviewMetadata {
  title: string | null;
  description: string | null;
  author: string | null;
  category: string | null;
  imageUrl: string | null;
  screenshots: string[];
  projectUrl: string;
  parsedDetails: import("@/lib/connectors/gta5ModsDetails").Gta5ModsDetails | null;
}
