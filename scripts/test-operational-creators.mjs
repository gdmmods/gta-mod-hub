import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compiled = ts.transpileModule(readFileSync(new URL('../lib/team/operational-creators.ts',import.meta.url),'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { filterOperationalCreators } = context.exports;
const identities = [
  { id:'personal', owner_type:'user', team_id:null },
  { id:'active', owner_type:'team', team_id:'team-a' },
  { id:'archived', owner_type:'team', team_id:'team-b' },
  { id:'broken', owner_type:'team', team_id:'team-c' },
  { id:'missing', owner_type:'team', team_id:null },
];
let fail = false;
const client = { from: name => {
  assert.equal(name,'teams');
  return { select: () => ({ in: () => ({ eq: async (column,value) => {
    assert.equal(column,'status'); assert.equal(value,'active');
    return fail ? {data:null,error:{message:'Unavailable'}} : {data:[{id:'team-a',creator_id:'active'},{id:'team-c',creator_id:'other'}],error:null};
  } }) }) };
} };
const result = await filterOperationalCreators(client,identities);
assert.equal(result.map(c=>c.id).join(','),'personal,active');
fail = true;
await assert.rejects(filterOperationalCreators(client,identities),/Could not verify active teams/);
assert.equal((await filterOperationalCreators(client,[identities[0]]))[0].id,'personal');
console.log('Operational selector checks passed: active teams/personal identities retained, archived/missing/mismatched teams excluded, lookup failure rejects selection.');
