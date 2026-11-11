import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

let user = { id: 'account' };
let result = { data: [], error: null };
const calls = [];
const client = { auth: { getUser: async () => ({ data: { user }, error: null }) },
  rpc: async (name, args) => { calls.push({ name, args }); return result; } };
const compiled = ts.transpileModule(readFileSync(new URL('../app/api/team-lifecycle/route.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const context = { exports: {}, Response, Request, URL, console,
  require: name => { assert.equal(name, '@/lib/supabase/server'); return { createSupabaseServerClient: async () => client }; } };
vm.runInNewContext(compiled, context);
const { GET, POST } = context.exports;
const teamId = '00000000-0000-0000-0000-000000000018';
const post = (body, origin = 'http://localhost:3000') => POST(new Request('http://localhost:3000/api/team-lifecycle', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { origin } : {}) }, body: JSON.stringify(body),
}));
assert.equal((await post({ action: 'archive', teamId }, 'https://other.example')).status, 403);
assert.equal((await post({ action: 'archive', teamId }, null)).status, 403);
assert.equal(calls.length, 0);
user = null;
assert.equal((await GET()).status, 401);
assert.equal((await post({ action: 'restore', teamId })).status, 401);
assert.equal(calls.length, 0);
user = { id: 'account' };
for (const body of [null, {}, { action: 'delete', teamId }, { action: 'archive', teamId: 'bad' }]) assert.equal((await post(body)).status, 400);
assert.equal(calls.length, 0);
await post({ action: 'archive', teamId, ownerId: 'forged' });
assert.equal(calls.at(-1).name, 'set_team_archived');
assert.equal(calls.at(-1).args.p_archived, true);
assert.equal(Object.keys(calls.at(-1).args).join(','), 'p_team_id,p_archived');
await post({ action: 'restore', teamId });
assert.equal(calls.at(-1).args.p_archived, false);
for (const [code, status] of [['42501', 403], ['55000', 409], ['PGRST202', 503]]) {
  result = { data: null, error: { code, message: 'Rejected' } };
  assert.equal((await post({ action: 'restore', teamId })).status, status);
}
result = { data: [], error: null };
const response = await GET();
assert.equal(response.status, 200);
assert.equal(response.headers.get('cache-control'), 'private, no-store');
assert.equal(calls.at(-1).name, 'get_archived_teams');
console.log('Team lifecycle API checks passed: auth, same origin, identifiers/actions, owner spoofing, setup/validation errors and no-store responses.');
