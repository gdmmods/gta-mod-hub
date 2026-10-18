import assert from "node:assert/strict";

import { aggregateCreatorExternalDownloadCounts, aggregateExternalDownloadCounts } from "../lib/server/external-download-counts-core";

assert.equal(aggregateExternalDownloadCounts([
  { platform: "gtainside", downloads: 308 },
  { platform: "gta5mods", downloads: 7582 },
]), 7890, "Counts from connected supported platforms are combined");

assert.equal(aggregateExternalDownloadCounts([
  { platform: "gtainside", downloads: 308 },
  { platform: "gtainside", downloads: 350 },
  { platform: "gta5mods", downloads: 7582 },
]), 7932, "Multiple pages on one platform contribute only the largest count");

assert.equal(aggregateExternalDownloadCounts([
  { platform: "gtainside", downloads: 0 },
  { platform: "gta5mods", downloads: null },
]), 0, "A reported zero is a valid count");

assert.equal(aggregateExternalDownloadCounts([
  { platform: "gtainside", downloads: null },
  { platform: "other", downloads: 100 },
]), null, "Unavailable or invalid counts produce no metric value");

assert.deepEqual(aggregateCreatorExternalDownloadCounts([
  { modId: "mod-a", platform: "gtainside", sourceKey: "https://gtainside.com/one", downloads: 308 },
  { modId: "mod-b", platform: "gtainside", sourceKey: "https://gtainside.com/two", downloads: 100 },
  { modId: "mod-b", platform: "gtainside", sourceKey: "https://gtainside.com/one", downloads: 308 },
  { modId: "mod-a", platform: "gta5mods", sourceKey: "https://gta5-mods.com/one", downloads: null },
]), {
  total: 308,
  availableSources: 2,
  totalSources: 3,
}, "creator totals apply the per-mod platform maximum, de-duplicate linked pages across mods, and expose partial coverage without treating missing data as zero");

assert.deepEqual(aggregateCreatorExternalDownloadCounts([
  { modId: "mod-a", platform: "gtainside", sourceKey: "one", downloads: 308 },
  { modId: "mod-a", platform: "gtainside", sourceKey: "two", downloads: 350 },
]), {
  total: 350,
  availableSources: 2,
  totalSources: 2,
}, "a mod keeps the existing highest-count-per-platform aggregation rule");

console.log("External download aggregation checks passed.");
