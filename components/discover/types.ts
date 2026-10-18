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
  matchSource?: "primary" | "additional" | "review";
  sourceLinkStatus?: "linked" | "already_linked" | "linked_elsewhere" | "forbidden" | "review";
  existingMod?: { id: string; title?: string | null; status?: string | null; creator_id?: string | null };
  matchCandidates?: Array<{
    id: string;
    title: string | null;
    creator?: string | null;
    creator_id?: string | null;
    status?: string | null;
    visibility?: string | null;
    category?: string | null;
    description?: string | null;
    image?: string | null;
    primarySourceUrl?: string | null;
    otherSources?: Array<{ url: string; platform: string }>;
  }>;
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
  parsedDetails:
    | import("@/lib/connectors/gta5ModsDetails").Gta5ModsDetails
    | import("@/lib/connectors/gtaInsideDetails").GtaInsideDetails
    | null;
}
