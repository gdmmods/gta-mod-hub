import {
  gta5ModsConnector,
} from "./gta5mods";

import type {
  PlatformConnector,
} from "./types";

const connectors:
  Record<string, PlatformConnector> = {

  gta5mods:
    gta5ModsConnector,

};

export function getPlatformConnector(
  connector: string
): PlatformConnector | null {

  return (
    connectors[connector] ||
    null
  );

}