import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ModSourceButtons from "../components/mod/ModSourceButtons";

const empty = renderToStaticMarkup(createElement(ModSourceButtons, {
  modId: "mod-1",
  primarySourceUrl: null,
  creatorBackupUrl: null,
  sources: [],
}));
assert.match(empty, /Primary Source/);
assert.match(empty, /Creator Backup/);
assert.match(empty, /Other Sources/);
assert.match(empty, /disabled="" aria-disabled="true"/);

const populated = renderToStaticMarkup(createElement(ModSourceButtons, {
  modId: "mod-1",
  primarySourceUrl: "https://www.gta5-mods.com/vehicles/audi-xgt",
  creatorBackupUrl: "https://drive.google.com/file/d/backup",
  sources: [
    { canonical_url: "https://www.gtainside.com/gta5/mods/12345-audi-xgt", platform: { slug: "gtainside", name: "GTAinside" } },
    { canonical_url: "https://www.gta5-mods.com/vehicles/audi-xgt", platform: { slug: "gta5mods", name: "GTA5-Mods" } },
  ],
}));
assert.match(populated, /aria-haspopup="dialog"/);
assert.match(populated, /aria-expanded="false"/);
assert.match(populated, />2</, "all available platform links are represented in the selector count");
assert.match(populated, /target="_blank" rel="noopener noreferrer"/);
assert.doesNotMatch(populated, /role="dialog"/, "the selector stays closed until activated by click or tap");

console.log("Mod source button state checks passed.");
