/**
 * @typedef {Object} TeamFeaturedCandidate
 * @property {string} id
 * @property {string | null} title
 * @property {string | null} image
 * @property {number | null} likes
 * @property {number | null} externalDownloads
 * @property {string} status
 * @property {string} visibility
 * @property {string[]} creatorIds
 */

/** @typedef {{id: string, title: string, image: string, likes: number, downloads: number | null}} TeamFeaturedCardMod */

/**
 * Selects team-scoped featured mods. Unavailable download counts are not ranked
 * as zero; the Most Downloaded slot remains empty when no reliable count exists.
 *
 * @param {TeamFeaturedCandidate[]} candidates
 * @param {string[]} teamCreatorIds
 * @returns {{mostDownloaded: TeamFeaturedCardMod | null, mostLiked: TeamFeaturedCardMod | null}}
 */
export function selectTeamFeaturedMods(candidates, teamCreatorIds) {
  const teamCreators = new Set(teamCreatorIds);
  const eligible = candidates.filter((candidate) =>
    candidate.status === "published" &&
    (candidate.visibility === "public" || candidate.visibility === "early_access") &&
    candidate.creatorIds.some((creatorId) => teamCreators.has(creatorId))
  );

  const downloadable = eligible
    .filter((candidate) => Number.isSafeInteger(candidate.externalDownloads) && candidate.externalDownloads >= 0)
    .sort((a, b) => b.externalDownloads - a.externalDownloads);
  const liked = [...eligible].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
  const mostDownloaded = downloadable[0] ?? null;
  let communityFavorite = liked[0] ?? null;

  if (mostDownloaded && communityFavorite?.id === mostDownloaded.id && eligible.length > 1) {
    communityFavorite = liked.find((candidate) => candidate.id !== mostDownloaded.id) ?? communityFavorite;
  }

  const toCardMod = (candidate) => candidate ? {
    id: candidate.id,
    title: candidate.title || "Untitled",
    image: candidate.image || "/placeholder.jpg",
    likes: candidate.likes ?? 0,
    downloads: candidate.externalDownloads,
  } : null;

  return {
    mostDownloaded: toCardMod(mostDownloaded),
    mostLiked: toCardMod(communityFavorite),
  };
}
