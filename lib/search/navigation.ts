export const searchCategories = {
  all: "All", people: "People", creations: "Creations", contributions: "Contributions", assets: "Assets", projects: "Projects",
} as const;
export const peopleTabs = { all: "All People", user: "Users", creator: "Creators", team: "Teams" } as const;
export const creationTabs = { all: "All Creations", mods: "Mods" } as const;

export type SearchCategory = keyof typeof searchCategories;
export type SupportedSearchCategory = Exclude<SearchCategory, "assets" | "projects">;
export type PeopleFilter = keyof typeof peopleTabs;
export type CreationFilter = keyof typeof creationTabs;
export const searchPageSize = 18;
export const maxSearchOffset = 900;

export function readSearchNavigation(params: Pick<URLSearchParams, "get">) {
  const category = params.get("category");
  const active = category && Object.hasOwn(searchCategories, category) ? category as SearchCategory : "all";
  const subtype = params.get("type");
  const people = active === "people" && subtype && Object.hasOwn(peopleTabs, subtype) ? subtype as PeopleFilter : "all";
  const creations: CreationFilter = active === "creations" && subtype === "mods" ? "mods" : "all";
  const requestedPage = Number(params.get("page") ?? 1);
  const page = active !== "all" && active !== "assets" && active !== "projects"
    && Number.isSafeInteger(requestedPage) && requestedPage > 0 && (requestedPage - 1) * searchPageSize <= maxSearchOffset
    ? requestedPage - 1 : 0;

  return { query: (params.get("q") ?? "").slice(0, 96), active, people, creations, page };
}

// Filter the server's public People results before paginating them. The extra
// row on each RPC page indicates whether the next unfiltered page exists.
export async function collectPeoplePage<T extends { identity_type: string }>(
  read: (offset: number) => Promise<T[]>, filter: Exclude<PeopleFilter, "all">, page: number,
) {
  const start = page * searchPageSize;
  const matches: T[] = [];
  let skipped = 0;

  for (let offset = 0; offset <= maxSearchOffset; offset += searchPageSize) {
    const rows = await read(offset);
    for (const row of rows.slice(0, searchPageSize)) {
      if (row.identity_type !== filter) continue;
      if (skipped < start) skipped++;
      else matches.push(row);
      if (matches.length > searchPageSize) return matches;
    }
    if (rows.length <= searchPageSize) break;
  }
  return matches;
}
