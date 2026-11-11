export type RatingSummary = {
  average: number | null;
  count: number;
  ownRating: { value: number; isValid: boolean; channel?: "user" | "creator" | "legacy" } | null;
  canRate: boolean;
  canModerate: boolean;
  moderation: { id: string; value: number; is_valid: boolean; moderation_reason: string | null; created_at: string }[];
  hasMore: boolean;
};
