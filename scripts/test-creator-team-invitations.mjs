import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/api/team-invitations/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const poke = "b3e64bc5-44a4-45bb-a411-898673068c54";
const peak = "e9ce6108-30da-4789-9d26-2711627483f0";
const invitationId = "5b1657fd-2b84-4587-8f32-76d63f11add6";
function route({ user = { id: "account" }, lookupError = null } = {}) {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user } }) },
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === "respond_to_team_invitation") return { data: { status: args.p_accept ? "accepted" : "declined" }, error: null };
      const matches = args?.p_creator_id == null || args.p_creator_id === poke;
      return { data: matches ? [{ invitation_id: invitationId, recipient_creator_id: poke, recipient_creator_name: "PØKE", status: "pending" }] : [], error: lookupError };
    },
  };
  const routeModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: routeModule, exports: routeModule.exports, URL,
    require: (name) => name === "next/server" ? { NextResponse: { json: (body, options) => Response.json(body, options) } }
      : name === "@/lib/supabase/server" ? { createSupabaseServerClient: async () => client } : require(name),
  });
  return { ...routeModule.exports, calls };
}
const request = (body) => new Request("http://localhost/api/team-invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
for (const creatorId of [null, poke, peak]) {
  const api = route();
  await api.GET(new Request("http://localhost/api/team-invitations" + (creatorId ? `?creatorId=${creatorId}` : "")));
  assert.equal(api.calls[0].name, "get_creator_team_invitations");
  assert.equal(api.calls[0].args.p_creator_id, creatorId);
}
{
  const api = route();
  await api.GET(new Request("http://localhost/api/team-invitations?activity=true"));
  assert.equal(api.calls[0].name, "get_notified_team_invitation_statuses");
}
for (const accept of [true, false]) {
  const api = route();
  const response = await api.POST(request({ action: "respond", invitationId, recipientCreatorId: poke, accept }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).recipientCreatorId, poke);
  assert.equal(api.calls[0].args.p_creator_id, poke);
  assert.equal(api.calls[0].args.p_invitation_id, invitationId);
  assert.equal(api.calls[1].name, "respond_to_team_invitation");
  assert.equal(api.calls[1].args.p_invitation_id, invitationId);
  assert.equal(api.calls[1].args.p_accept, accept);
}
for (const recipientCreatorId of [undefined, peak]) {
  const api = route();
  const response = await api.POST(request({ action: "respond", invitationId, recipientCreatorId, accept: true }));
  assert.equal(response.status, recipientCreatorId ? 403 : 400);
  assert.ok(api.calls.every((call) => call.name !== "respond_to_team_invitation"));
}
{
  const api = route({ lookupError: { message: "Lookup unavailable" } });
  assert.equal((await api.POST(request({ action: "respond", invitationId, recipientCreatorId: poke, accept: true }))).status, 500);
  assert.equal(api.calls.length, 1);
}
{
  const api = route({ user: null });
  assert.equal((await api.GET(new Request("http://localhost/api/team-invitations"))).status, 401);
  assert.equal((await api.POST(request({ action: "respond", invitationId, recipientCreatorId: poke, accept: true }))).status, 401);
  assert.equal(api.calls.length, 0);
}
console.log("Creator-specific invitation route checks passed: account/creator reads, accept/decline, mismatch, missing identity, lookup failure, authentication.");
