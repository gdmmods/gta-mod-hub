// Match the existing public discovery eligibility for published releases.
export const publicCreatorModAccess = ["public", "early_access"] as const;

type PublicModCandidate = {
  id: string;
  status: string | null;
  visibility: string | null;
  release_state: string | null;
};

function isPublicAccess(value: string | null) {
  return publicCreatorModAccess.some(access => access === value);
}

export function isPublicModRelease(mod: Omit<PublicModCandidate, "id">) {
  return mod.status === "published" && isPublicAccess(mod.visibility) && isPublicAccess(mod.release_state);
}

export function countPublicCreatorMods(mods: readonly PublicModCandidate[]) {
  const eligibleIds = new Set<string>();
  for (const mod of mods) {
    if (isPublicModRelease(mod)) {
      eligibleIds.add(mod.id);
    }
  }
  return eligibleIds.size;
}
