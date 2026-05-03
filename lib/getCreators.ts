export function getCreators(mod: any): string[] {
  if (mod?.mod_creators?.length) {
    return mod.mod_creators
      .map((mc: any) => mc.creators?.name)
      .filter(Boolean);
  }

  if (mod?.creator) {
    return [mod.creator];
  }

  return ["Unknown"];
}