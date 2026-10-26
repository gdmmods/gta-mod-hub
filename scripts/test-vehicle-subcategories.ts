import assert from "node:assert/strict";
import {
  getVehicleSubcategory,
  matchesVehicleSubcategory,
  normalizeModCategory,
  VEHICLE_SUBCATEGORIES,
} from "../lib/vehicle-subcategories";
import { getSourceUpdateValues } from "../lib/server/discovery-update-values";

assert.deepEqual(VEHICLE_SUBCATEGORIES, ["Cars", "Boats", "Bike", "Aircraft", "Paintjobs", "Lore Friendly", "Wheels", "Other"]);

const noisyCar = {
  category: "vehicles",
  title: "1994 Ferrari F355 Spider [Add-On / FiveM]",
  description: "The car has custom fifteen52 wheels and updated rims.",
};
const waverunner = {
  category: "vehicles",
  title: "2011 Yamaha FX HO Waverunner Jetski [Add-On]",
  description: "Something else than a box on 4 wheels.",
  tags: ["boat", "add-on"],
};
const wheelPack = { category: "vehicles", title: "Forged wheel pack", description: "For GTA V." };
const paintjob = { category: "paintjobs", title: "Audi A4 Avant Police skin" };
const aircraft = { category: "aircraft", title: "Cessna 172" };

assert.equal(getVehicleSubcategory(noisyCar), "Cars", "wheel words in a car description cannot reclassify the car");
assert.equal(matchesVehicleSubcategory(noisyCar, "Wheels"), false, "cars do not leak into Wheels");
assert.equal(matchesVehicleSubcategory(wheelPack, "Wheels"), true, "explicit wheel packs remain in Wheels");
assert.equal(getVehicleSubcategory(waverunner), "Boats", "the Waverunner remains under Boats despite wheel prose");
assert.equal(matchesVehicleSubcategory(waverunner, "Boats"), true, "boat and jet-ski records remain discoverable");
assert.deepEqual(normalizeModCategory("Paintjobs", { title: paintjob.title }), {
  category: "vehicles",
  vehicleSubcategory: "Paintjobs",
});
assert.equal(getVehicleSubcategory(paintjob), "Paintjobs");
assert.equal(normalizeModCategory("Aircraft").vehicleSubcategory, "Aircraft");
assert.equal(getVehicleSubcategory(aircraft), "Aircraft");
assert.equal(normalizeModCategory("Cars / Volkswagen").vehicleSubcategory, "Cars");
assert.equal(normalizeModCategory("Cars / Buses").vehicleSubcategory, "Cars");
assert.equal(normalizeModCategory("Wheels").vehicleSubcategory, "Wheels");
assert.equal(normalizeModCategory("jet ski").vehicleSubcategory, "Boats");

const missing = { category: "vehicles", title: "Unknown vehicle mod" };
const unknown = { category: "vehicles", title: "Unclassified mod", subcategory: "Unknown" };
assert.equal(getVehicleSubcategory(missing), "Other");
assert.equal(getVehicleSubcategory(unknown), "Other");
assert.equal(matchesVehicleSubcategory(missing, "Other"), true);
assert.equal(matchesVehicleSubcategory(unknown, "Other"), true);
assert.equal(matchesVehicleSubcategory(missing, "All"), true, "All Vehicles includes missing subtype records");
assert.equal(matchesVehicleSubcategory(wheelPack, "All"), true);

assert.equal(getSourceUpdateValues({ platform: "gtainside", title: "Audi A4 livery", category: "Paintjobs" }).category, "vehicles");
assert.equal(normalizeModCategory("Paintjobs").vehicleSubcategory, "Paintjobs");
assert.equal(normalizeModCategory("map mods").category, "misc", "unrelated unknown values are not made Vehicles");

const knownCarsWithWheelDescriptions = [
  "1978 Hoonigan Ford Escort Mk2 RS",
  "1994 Ferrari F355 Spider",
  "2013 Ferrari F12 Stallone by Mansory",
  "2013 Pininfarina Ferrari Sergio",
  "2017 Audi TTS Roadster",
  "2017 Ferrari J50",
  "2017 Mercedes Benz C63S AMG Coupe",
  "2017 Mercedes-Benz AMG GT-R",
  "2018 Pagani Huayra Roadster",
  "2020 Mercedes-Benz AMG GT-R Roadster",
  "2021 Alfa Romeo Stelvio GTAm",
  "Alfa Romeo GT 3.7L Autodelta",
  "Audi R8 2020",
  "Caterham Super 7 R620",
  "Ferrari F60 America",
  "Shelby Chrysler Dodge Omni GLHS",
  "Volkswagen Golf 7.5R 2018",
];
for (const title of knownCarsWithWheelDescriptions) {
  const mod = { category: "vehicles", title, description: "Updated wheels and rims." };
  assert.equal(getVehicleSubcategory(mod), "Cars", `${title} remains in Cars`);
  assert.equal(matchesVehicleSubcategory(mod, "Wheels"), false, `${title} never leaks into Wheels`);
}

console.log("Vehicle subcategory regression checks passed.");
