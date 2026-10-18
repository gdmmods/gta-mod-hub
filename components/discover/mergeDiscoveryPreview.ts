import type { DiscoveryPreviewMetadata, DiscoveryResultProject } from "./types";

/**
 * Keep the source fields identical for card actions and bulk actions.
 * Preserve the full parser description in project data; display and API
 * mapping helpers may remove sections only after confirming their contents.
 */
export function mergeDiscoveryPreview(
  project: DiscoveryResultProject,
  metadata: DiscoveryPreviewMetadata
): DiscoveryResultProject {
  return {
    ...project,
    title: metadata.title ?? project.title,
    description: metadata.parsedDetails?.description ?? metadata.description,
    author: metadata.author,
    category: metadata.category,
    imageUrl: metadata.imageUrl,
    screenshots: metadata.screenshots,
    projectUrl: metadata.projectUrl || project.projectUrl,
    parsedDetails: metadata.parsedDetails,
  };
}
