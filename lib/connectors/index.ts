import {
  gta5ModsConnector,
} from "./gta5mods";

import {
  gtaInsideConnector,
} from "./gtainside";

import type {
  PlatformConnector,
} from "./types";

const connectors: Record<
  string,
  PlatformConnector
> = {
  gta5mods: gta5ModsConnector,
  gtainside: gtaInsideConnector,
};

export function getPlatformConnector(
  connector: string
): PlatformConnector | null {
  return connectors[connector] || null;
}