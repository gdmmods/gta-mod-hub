type Creator = {
  id: string;
  name: string;
};

export function getCreators(mod: any): Creator[] {
  // ✅ relational system
  if (mod.mod_creators?.length) {
    return mod.mod_creators
      .map((mc: any) => mc.creators as Creator | null)
      .filter((c: Creator | null): c is Creator => {
        return !!c && !!c.id && !!c.name;
      });
  }

  // ⚠️ fallback (legacy string → fake IDs)
  if (mod.creator) {
    return mod.creator
      .split(" • ")
      .map((name: string, i: number): Creator => ({
        id: `legacy-${i}-${name.trim()}`,
        name: name.trim(),
      }))
      .filter((c: Creator) => !!c.name);
  }

  return [];
}