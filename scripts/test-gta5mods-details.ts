import {
  extractGta5ModsDetails,
} from "../lib/connectors/gta5ModsDetails";

const projectUrl =
  "https://www.gta5-mods.com/vehicles/pontiac-gto-convertible-1966-animated-roof-add-on-fivem-template";

async function main() {
  console.log("Fetching GTA5-Mods project...");

  const response = await fetch(projectUrl, {
    headers: {
      "User-Agent": "ModVault Creator Connector",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GTA5-Mods returned HTTP ${response.status}`
    );
  }

  const html = await response.text();

  console.log("Extracting metadata...\n");

  const details = extractGta5ModsDetails(
    html,
    projectUrl
  );

  console.log(
    JSON.stringify(
      {
        ...details,
        description:
          details.description?.slice(0, 500),
      },
      null,
      2
    )
  );

  console.log("\n--- Validation ---");

  console.log("Title found:", Boolean(details.title));
  console.log("Cover image found:", Boolean(details.image));
  console.log("Description found:", Boolean(details.description));
  console.log("Gallery images:", details.images.length);
  console.log("Version:", details.version ?? "Not detected");
  console.log("Features found:", Boolean(details.features));
  console.log("Credits found:", Boolean(details.credits));
  console.log("Downloads:", details.downloads ?? "Not detected");
}

main().catch((error) => {
  console.error("Extractor test failed:", error);
  process.exitCode = 1;
});