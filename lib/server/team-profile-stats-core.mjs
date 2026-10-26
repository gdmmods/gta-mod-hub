/** Calculate team statistics once per distinct eligible published mod. */
export function calculateTeamProfileStats(mods, clickRows) {
  const uniqueMods = new Map();
  for (const mod of mods) {
    if (mod?.id) uniqueMods.set(mod.id, mod);
  }

  const eligibleIds = new Set(uniqueMods.keys());
  const clicksByModAndAction = new Map();
  for (const row of clickRows) {
    if (!eligibleIds.has(row?.mod_id) || !row?.action_type) continue;
    const count = row.click_count;
    if (!Number.isSafeInteger(count) || count < 0) continue;
    const key = `${row.mod_id}:${row.action_type}`;
    clicksByModAndAction.set(key, Math.max(clicksByModAndAction.get(key) ?? 0, count));
  }

  return {
    modsCount: uniqueMods.size,
    totalLikes: [...uniqueMods.values()].reduce((total, mod) =>
      total + (Number.isSafeInteger(mod.likes) && mod.likes >= 0 ? mod.likes : 0), 0),
    totalClicks: [...clicksByModAndAction.values()].reduce((total, count) => total + count, 0),
  };
}

/** Recognize only the known Postgres/PostgREST missing-table responses. */
export function isMissingClickTotalsTable(error) {
  return error?.code === "42P01" || error?.code === "PGRST205" ||
    /could not find the table[^\n]*mod_click_totals[^\n]*schema cache|relation ["']?public\.mod_click_totals["']? does not exist/i
      .test(error?.message ?? "");
}

/** Compatibility path for databases predating mod_click_totals. */
export function sumLegacyDownloadClicks(mods) {
  const uniqueMods = new Map();
  for (const mod of mods) {
    if (mod?.id) uniqueMods.set(mod.id, mod);
  }
  return [...uniqueMods.values()].reduce((total, mod) =>
    total + (Number.isSafeInteger(mod.downloads) && mod.downloads >= 0 ? mod.downloads : 0), 0);
}
