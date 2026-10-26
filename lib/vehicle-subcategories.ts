export const VEHICLE_SUBCATEGORIES = [
  "Cars",
  "Boats",
  "Bike",
  "Aircraft",
  "Paintjobs",
  "Lore Friendly",
  "Wheels",
  "Other",
] as const;

export type VehicleSubcategory = (typeof VEHICLE_SUBCATEGORIES)[number];
export type VehicleSubcategoryFilter = "All" | VehicleSubcategory;

type VehicleContext = {
  category?: unknown;
  title?: unknown;
  description?: unknown;
  tags?: unknown;
  subcategory?: unknown;
};

const CATEGORY_ALIASES: Record<string, VehicleSubcategory> = {
  car: "Cars",
  cars: "Cars",
  bus: "Cars",
  buses: "Cars",
  paintjob: "Paintjobs",
  paintjobs: "Paintjobs",
  "paint job": "Paintjobs",
  "paint jobs": "Paintjobs",
  livery: "Paintjobs",
  liveries: "Paintjobs",
  boat: "Boats",
  boats: "Boats",
  watercraft: "Boats",
  jetskis: "Boats",
  jetski: "Boats",
  "jet ski": "Boats",
  waverunner: "Boats",
  bike: "Bike",
  bikes: "Bike",
  motorcycle: "Bike",
  motorcycles: "Bike",
  motorbike: "Bike",
  motorbikes: "Bike",
  aircraft: "Aircraft",
  airplane: "Aircraft",
  airplanes: "Aircraft",
  aeroplane: "Aircraft",
  aeroplanes: "Aircraft",
  helicopter: "Aircraft",
  helicopters: "Aircraft",
  "aircraft mods": "Aircraft",
  "aircraft vehicles": "Aircraft",
  plane: "Aircraft",
  planes: "Aircraft",
  wheel: "Wheels",
  wheels: "Wheels",
  rim: "Wheels",
  rims: "Wheels",
  "wheel/rim": "Wheels",
  "wheel rims": "Wheels",
  "lore friendly": "Lore Friendly",
  "lore-friendly": "Lore Friendly",
  other: "Other",
};

const CANONICAL_CATEGORIES = new Set([
  "vehicles", "maps", "scripts", "graphics", "weapons", "player", "sounds", "ui", "tools", "misc",
]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function key(value: unknown): string {
  return text(value).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function canonicalSubcategory(value: unknown): VehicleSubcategory | null {
  const normalized = key(value);
  return VEHICLE_SUBCATEGORIES.find((item) => key(item) === normalized)
    ?? CATEGORY_ALIASES[normalized]
    ?? null;
}

function exactTagSubcategory(tags: unknown): VehicleSubcategory | null {
  if (!Array.isArray(tags)) return null;
  for (const tag of tags) {
    const match = canonicalSubcategory(tag);
    if (match) return match;
    const nested = typeof tag === "string" ? tag.trim().match(/^(cars?|vehicles?)\s*\/\s*(.+)$/i) : null;
    if (nested) return /^cars?$/i.test(nested[1]) ? "Cars" : canonicalSubcategory(nested[2]);
  }
  return null;
}

function titleSubcategory(title: unknown): VehicleSubcategory {
  const value = key(title);
  if (!value) return "Other";

  // Require title-level evidence. Description prose commonly mentions wheels on cars.
  if (/\b(paint[\s-]?jobs?|liveries|livery|skins?|vehicle skin|car skin)\b/.test(value)) return "Paintjobs";
  if (/\b(aircraft|airplanes?|aeroplanes?|helicopters?|heli|rotorcraft|fighter jet|jet fighter|cessna|boeing|airbus|piper|beechcraft)\b/.test(value)) return "Aircraft";
  if (/\b(boat|boats|yacht|sailboat|jetski|jet ski|waverunner|watercraft|speedboat)\b/.test(value)) return "Boats";
  if (/\b(motorcycle|motorbike|bikes?|scooter|harley|confederate f\d+|ducati|kawasaki ninja)\b/.test(value)) return "Bike";

  const wheelOnlyTitle = /\b(wheel pack|wheels pack|rim pack|rims pack|wheel collection|rim collection|wheel replacement|rim replacement|custom wheels?|custom rims?)\b/.test(value);
  if (wheelOnlyTitle) return "Wheels";

  if (/\b(car|cars|sedan|coupe|hatchback|wagon|estate|suv|pickup|pick-up|van|automobile|bus|buses|coach)\b/.test(value)) return "Cars";
  if (/\b(audi|porsche|volkswagen|vw|mclaren|ferrari|ford|caterham|lamborghini|bmw|mercedes|chevrolet|toyota|honda|nissan|subaru|mazda|volvo|bentley|bugatti|aston martin|rolls royce|man lions city|alfa romeo|pagani|donkervoort|amc|henry clay|pontiac|shelby|dodge|jeep|yamaha fx ho)\b/.test(value)) return "Cars";

  // A bare wheel/rim listing is a Wheels item; incidental description words are ignored.
  if (/^(?:\d{1,2}\s*(?:in(?:ch(?:es)?)?)?\s*)?(?:wheel|wheels|rim|rims)\b/.test(value)) return "Wheels";
  if (/\b(lore[\s-]?friendly|realistic traffic|vanilla style)\b/.test(value)) return "Lore Friendly";
  return "Other";
}

function explicitLabelSubcategory(raw: string, context: VehicleContext): VehicleSubcategory | null {
  const normalized = key(raw);
  const nested = normalized.match(/^(cars?|vehicles?)\s*\/\s*(.+)$/);
  if (nested) {
    // The source taxonomy explicitly groups Buses under Cars, and make/model suffixes are metadata.
    return /^cars?$/i.test(nested[1]) ? "Cars" : canonicalSubcategory(nested[2]);
  }

  const direct = canonicalSubcategory(normalized);
  if (direct) return direct;
  if (normalized === "vehicles" || normalized === "vehicle") return null;
  return exactTagSubcategory(context.tags);
}

/** Maps source category labels to the stored top-level category plus a derived canonical vehicle subtype. */
export function normalizeModCategory(
  input: unknown,
  context: VehicleContext = {},
): { category: string; vehicleSubcategory: VehicleSubcategory | null } {
  const raw = text(input);
  const normalized = key(raw);
  const nestedVehicleLabel = /^(cars?|vehicles?)\s*\/\s*(.+)$/.test(normalized);
  const explicit = explicitLabelSubcategory(raw, context);

  if (explicit || nestedVehicleLabel || normalized === "vehicles" || normalized === "vehicle") {
    return {
      category: "vehicles",
      vehicleSubcategory: explicit ?? exactTagSubcategory(context.tags) ?? titleSubcategory(context.title),
    };
  }

  if (CANONICAL_CATEGORIES.has(normalized)) {
    return { category: normalized, vehicleSubcategory: null };
  }

  // Unknown categories do not create top-level categories. Vehicle evidence keeps
  // the item visible under Vehicles/Other; unrelated unknowns use existing Misc.
  if (exactTagSubcategory(context.tags) || titleSubcategory(context.title) !== "Other") {
    return {
      category: "vehicles",
      vehicleSubcategory: exactTagSubcategory(context.tags) ?? titleSubcategory(context.title),
    };
  }
  return { category: "misc", vehicleSubcategory: null };
}

export function getVehicleSubcategory(mod: VehicleContext): VehicleSubcategory {
  const explicit = text(mod.subcategory);
  if (explicit) return canonicalSubcategory(explicit) ?? "Other";

  const category = text(mod.category);
  const categorySubtype = explicitLabelSubcategory(category, mod);
  if (categorySubtype) return categorySubtype;

  const tagSubtype = exactTagSubcategory(mod.tags);
  if (tagSubtype) return tagSubtype;

  return titleSubcategory(mod.title);
}

export function matchesVehicleSubcategory(
  mod: VehicleContext,
  filter: VehicleSubcategoryFilter,
): boolean {
  return filter === "All" || getVehicleSubcategory(mod) === filter;
}
