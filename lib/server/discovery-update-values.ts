import type { Gta5ModsDetails } from "../connectors/gta5ModsDetails";
import { getGta5ModsPreviewDescription } from "../connectors/gta5ModsDescriptionPreview";

const SOURCE_FIELDS = ["title", "description", "category", "creator", "image", "images", "features", "requirements", "notes", "credits", "download_url"] as const;
export const SOURCE_DESCRIPTION_PLACEHOLDER = "None found in source description";
export type UpdateField = (typeof SOURCE_FIELDS)[number];
export type UpdateValues = Partial<Record<UpdateField, string>>;
export type SourceProject = {
  title?: unknown;
  description?: unknown;
  category?: unknown;
  author?: unknown;
  imageUrl?: unknown;
  screenshots?: unknown;
  projectUrl?: unknown;
  parsedDetails?: unknown;
};

function nonEmptyText(value: unknown, maxLength: number): string | null {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength
    ? value.trim()
    : null;
}

function secureUrl(value: unknown): string | null {
  const text = nonEmptyText(value, 2048);
  if (!text) return null;
  try {
    return new URL(text).protocol === "https:" ? text : null;
  } catch {
    return null;
  }
}

export function getSourceUpdateValues(project: SourceProject): UpdateValues {
  const values: UpdateValues = {};
  const title = nonEmptyText(project.title, 300);
  const description = nonEmptyText(project.description, 100_000);
  const category = nonEmptyText(project.category, 200);
  const creator = nonEmptyText(project.author, 300);
  const details = project.parsedDetails && typeof project.parsedDetails === "object"
    ? project.parsedDetails as Record<string, unknown>
    : {};
  const features = nonEmptyText(details.features, 100_000);
  const requirements = nonEmptyText(details.requirements, 100_000);
  const notes = [
    nonEmptyText(details.notes, 100_000) ? `Notes:\n${nonEmptyText(details.notes, 100_000)}` : null,
    nonEmptyText(details.knownBugs, 100_000) ? `Known Bugs:\n${nonEmptyText(details.knownBugs, 100_000)}` : null,
  ].filter((value): value is string => !!value).join("\n\n");
  const credits = nonEmptyText(details.credits, 100_000);
  const downloadUrl = secureUrl(details.downloadUrl);
  const screenshotsInput = Array.isArray(project.screenshots) ? project.screenshots : [];
  const image = secureUrl(project.imageUrl) ?? secureUrl(screenshotsInput[0]);
  const screenshots = screenshotsInput
    .map(secureUrl)
    .filter((url): url is string => !!url)
    .slice(0, 20);

  if (title) values.title = title;
  const cleanedDescription = description && Object.keys(details).length
    ? getGta5ModsPreviewDescription(description, details as unknown as Pick<Gta5ModsDetails, "features" | "requirements" | "notes" | "knownBugs" | "credits">)
    : description;
  if (cleanedDescription) values.description = cleanedDescription;
  if (category) values.category = category;
  if (creator) values.creator = creator;
  if (features) values.features = features;
  if (requirements) values.requirements = requirements;
  if (notes) values.notes = notes;
  if (credits) values.credits = credits;
  if (downloadUrl) values.download_url = downloadUrl;
  if (image) values.image = image;
  if (screenshots.length) values.images = JSON.stringify(screenshots);
  return values;
}

export function validateAcceptedUpdateValues(input: unknown): UpdateValues | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const result: UpdateValues = {};
  for (const [key, value] of Object.entries(input)) {
    if (!SOURCE_FIELDS.includes(key as UpdateField) || typeof value !== "string") return null;
    const field = key as UpdateField;
    const maximum = ["description", "features", "requirements", "notes", "credits"].includes(field)
      ? 100_000
      : field === "images" ? 40_000 : ["image", "download_url"].includes(field) ? 2048 : 300;
    if (!value.trim() || value.length > maximum) return null;
    if (field === "image" || field === "download_url") {
      if (!secureUrl(value)) return null;
    } else if (field === "images") {
      try {
        const images: unknown = JSON.parse(value);
        if (!Array.isArray(images) || images.length === 0 || images.length > 20 || images.some((url) => !secureUrl(url))) return null;
      } catch {
        return null;
      }
    }
    result[field] = value;
  }
  return Object.keys(result).length ? result : null;
}

export function getSourceDescriptionDisplayValues(project: SourceProject): { requirements: string; notes: string } {
  const details = project.parsedDetails && typeof project.parsedDetails === "object"
    ? project.parsedDetails as Record<string, unknown>
    : {};
  const requirements = nonEmptyText(details.requirements, 100_000);
  const notes = [
    nonEmptyText(details.notes, 100_000) ? `Notes:\n${nonEmptyText(details.notes, 100_000)}` : null,
    nonEmptyText(details.knownBugs, 100_000) ? `Known Bugs:\n${nonEmptyText(details.knownBugs, 100_000)}` : null,
  ].filter((value): value is string => !!value).join("\n\n");
  return {
    requirements: requirements ?? SOURCE_DESCRIPTION_PLACEHOLDER,
    notes: notes || SOURCE_DESCRIPTION_PLACEHOLDER,
  };
}

export function normalizeProjectUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    url.hash = "";
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}
