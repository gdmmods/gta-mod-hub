
;

import { useState } from "react";

export default function Tabs({
  mod,
}: {
  mod: any;
}) {
  const [active, setActive] = useState("description");

  return (
    <div className="mt-8">
      {/* TAB BUTTONS */}
      <div className="flex gap-6 border-b border-gray-700 pb-2">
        {["description", "details", "comments"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`capitalize ${
              active === tab
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="mt-6">
        {active === "description" && (
          <p className="text-gray-300">
            {mod.full_description || mod.description}
          </p>
        )}

        {active === "details" && (
          <div className="space-y-6">

            {mod.features && (
              <div>
                <h3 className="font-semibold mb-2">Features</h3>
                {mod.features.split("\n").map((f: string, i: number) => (
                  <p key={i} className="text-gray-300">✔ {f}</p>
                ))}
              </div>
            )}

            {mod.requirements && (
              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <p className="text-gray-300 whitespace-pre-line">
                  {mod.requirements}
                </p>
              </div>
            )}

            {mod.notes && (
              <div className="p-4 border border-yellow-500 rounded-lg bg-yellow-500/10">
                <h3 className="text-yellow-400 font-semibold mb-2">Note</h3>
                <p className="text-gray-300 whitespace-pre-line">
                  {mod.notes}
                </p>
              </div>
            )}

            {mod.credits && (
              <div>
                <h3 className="font-semibold mb-2">Credits</h3>
                <p className="text-gray-400 whitespace-pre-line">
                  {mod.credits}
                </p>
              </div>
            )}

          </div>
        )}

        {active === "comments" && (
          <p className="text-gray-500">
            Comments system coming soon...
          </p>
        )}
      </div>
    </div>
  );
}