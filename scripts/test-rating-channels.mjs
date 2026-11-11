import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
let setup = readFileSync(new URL('scripts/test-team-archive.mjs', root), 'utf8').split('const checks =')[0];
setup = setup.replace("new URL('../', import.meta.url)", `new URL(${JSON.stringify(root.href)})`);
const checks = `
await db.exec(readFileSync(new URL('supabase/migrations/20261104090451_discussion_ux_notifications_mod_ratings.sql', ${JSON.stringify(root.href)}),'utf8'));
await db.exec(\`
  alter table mods add column visibility text not null default 'public', add column source_url text, add column download_url text, add column external_purchase_url text;
  create table public.platforms(id uuid primary key,slug text);
  alter table mod_sources add column id uuid primary key default gen_random_uuid(),
    add column platform_id uuid references platforms(id),add column canonical_url text;
\`);
const feedback=async (account,mod,value)=>
  (await as(account,'select public.submit_mod_feedback($1,null,null,$2) result',[mod,value]))[0].result;
const channels=async (account,mod)=>
  (await as(account,'select public.read_mod_rating_channels(array[$1::uuid],true) result',[mod]))[0].result[mod];

await feedback(alice,modB,4);
await db.exec(readFileSync(new URL(${JSON.stringify(process.argv[2])}, ${JSON.stringify(root.href)}),'utf8'));
assert.equal((await channels(null,modB)).internal.legacy.average,4);
await feedback(outsider,modB,3);
assert.equal((await channels(null,modB)).internal.user.average,3);

for (const title of ['Qualifying A','Qualifying B','Qualifying C']) {
  await db.query("insert into mods(id,title,status,creator_id,download_url) values(gen_random_uuid(),$1,'published',$2,'https://example.test/download')",[title,creatorA]);
}
await feedback(alice,modB,5);
assert.equal((await channels(null,modB)).internal.legacy.average,5);
await feedback(alice,modTeam,2);
assert.equal((await channels(null,modTeam)).internal.creator.average,2);
assert.equal(await count('private.mod_ratings'),3);
await assert.rejects(feedback(alice,modA,4),/own mod/);
await assert.rejects(as(outsider,'select * from private.mod_ratings'),/permission denied/);
await assert.rejects(as(outsider,'select * from private.external_rating_snapshots'),/permission denied/);
await db.query("insert into platforms values(gen_random_uuid(),'fixture')");
await db.query("insert into mod_sources(mod_id,platform_id,canonical_url) select $1,id,'https://example.test/listing' from platforms",[modB]);
await db.exec(\`insert into private.external_rating_snapshots
  select mod_id,platform_id,canonical_url,4,5,6,4,now()-interval '45 days','failed' from mod_sources\`);
assert.equal((await channels(null,modB)).external[0].value,4);
await db.query("update mods set visibility='private' where id=$1",[modB]);
assert.equal(await channels(null,modB),undefined);

assert.equal((await as(null,'select public.read_creator_tier($1) tier',[creatorA]))[0].tier,null);
await db.query("insert into private.creator_reputation_assessments(creator_id,tier) values ($1,'trusted'),($1,null)",[creatorA]);
assert.equal((await as(null,'select public.read_creator_tier($1) tier',[creatorA]))[0].tier,null);
await db.close();
console.log('Rating channels, historical votes, eligibility, external snapshots, and tier checks passed.');
`;
setup += `\ntry { await import('data:text/javascript;base64,'+Buffer.from(fixture+${JSON.stringify(checks)}).toString('base64')); } catch(error) { console.error(error.message); process.exitCode=1; }`;
await import('data:text/javascript;base64,'+Buffer.from(setup).toString('base64'));

