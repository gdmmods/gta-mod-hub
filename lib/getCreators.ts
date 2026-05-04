export function getCreators(mod: any): string[] {
  // ✅ new system (join table)
  if (mod.mod_creators?.length) {
    return mod.mod_creators
      .map((mc: any) => mc.creators?.name)
      .filter(Boolean);
  }

  // ⚠️ fallback (legacy string)
  if (mod.creator) {
    return mod.creator.split(" • ").map((c: string) => c.trim());
  }

  return ["Unknown"];
}