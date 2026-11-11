import { readFileSync, readdirSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const migration = readdirSync(new URL('supabase/migrations/', root)).find(name => name.endsWith('_external_rating_synchronization.sql'));
let setup = readFileSync(new URL('scripts/test-team-archive.mjs', root), 'utf8').split('const checks =')[0];
setup = setup.replace("new URL('../', import.meta.url)", `new URL(${JSON.stringify(root.href)})`);
const checks = `
const migrationRoot = new URL('supabase/migrations/', ${JSON.stringify(root.href)});
await db.exec(readFileSync(new URL('20261104090451_discussion_ux_notifications_mod_ratings.sql', migrationRoot),'utf8'));
await db.exec(\`
  alter table mods add column visibility text not null default 'public', add column source_url text,
    add column download_url text, add column external_purchase_url text,
    add column created_at timestamp, add column added_at timestamptz;
  create table public.platforms(id uuid primary key,slug text unique);
  alter table mod_sources add column id uuid primary key default gen_random_uuid(),
    add column platform_id uuid references platforms(id),add column canonical_url text;
  insert into platforms values(gen_random_uuid(),'gta5mods'),(gen_random_uuid(),'gtainside');
\`);
await db.exec(readFileSync(new URL('20261105095308_rating_channels_and_creator_reputation.sql', migrationRoot),'utf8'));
const url='https://www.gta5-mods.com/vehicles/fixture';
await db.query("update mods set source_url=$1,added_at=now()-interval '10 days' where id=$2",[url,modA]);
await db.exec(readFileSync(new URL(${JSON.stringify(migration)}, migrationRoot),'utf8'));
const query=async(sql,args=[]) => (await db.query(sql,args)).rows[0];
const claim=async(mod=null,account=null)=>(await query('select public.claim_external_rating_sync($1,$2) data',[mod,account])).data;
const finish=async(job,results)=>(await query('select public.finish_external_rating_sync($1,$2,$3) data',[job.modId,job.token,JSON.stringify(results)])).data;
const snapshot=()=>query('select original_value,last_success_at,last_checked_at from private.external_rating_snapshots where mod_id=$1',[modA]);
const next=async()=>(await query('select next_check_at::text from private.external_rating_sync where mod_id=$1',[modA])).next_check_at;
const success={platform:'gta5mods',url,status:'success',value:4.8,count:20};
await db.query("insert into mod_sources(mod_id,platform_id,canonical_url) select $1,id,'https://www.gtainside.com/fixture' from platforms where slug='gtainside'",[modA]);
assert.equal((await claim(modA,outsider)).status,'forbidden');
assert.equal((await as(outsider,'select public.read_external_rating_sync($1) data',[modA]))[0].data,null);
await assert.rejects(as(null,'select public.read_external_rating_sync($1)',[modA]),/permission denied/);
await assert.rejects(as(alice,'select public.claim_external_rating_sync($1,$2)',[modA,alice]),/permission denied/);
const initial=await claim();
assert.equal(initial.modId,modA);
assert.equal(initial.sources.length,2);
assert.equal((await claim(modA,alice)).status,'busy');
assert.equal((await finish(initial,[success,{...initial.sources.find(s=>s.platform==='gtainside'),status:'unsupported'}])).status,'updated');
const weekly=await next();
assert.match(weekly,/^\\d/);
assert.equal((await query("select next_check_at > now()+interval '6 days' weekly from private.external_rating_sync where mod_id=$1",[modA])).weekly,true);
assert.equal((await claim()).status,'idle');

await selectIdentity(alice,creatorB);
const manual=await claim(modA,alice);
assert.equal(manual.status,'claimed','authorized account works under another selected identity');
assert.equal((await finish(manual,[success])).status,'unchanged');
assert.equal(await next(),weekly,'manual refresh never changes automatic schedule');
assert.equal((await claim(modA,alice)).status,'cooldown');
assert.equal((await finish(initial,[{...success,value:1}])).status,'expired');
assert.equal(Number((await snapshot()).original_value),4.8);
await db.query("update private.external_rating_sync set next_check_at=now() where mod_id=$1",[modA]);
const failure=await claim();
const beforeFailure=await snapshot();
assert.equal((await finish(failure,[{...success,status:'failed'}])).status,'failed');
assert.deepEqual((await snapshot()).last_success_at,beforeFailure.last_success_at);
assert.equal(Number((await snapshot()).original_value),4.8);
assert.equal((await query("select next_check_at < now()+interval '2 hours' retry from private.external_rating_sync where mod_id=$1",[modA])).retry,true);

await db.query("update mods set status='draft',source_url=$1 where id=$2",[url,unpublished]);
assert.equal(await query('select mod_id from private.external_rating_sync where mod_id=$1',[unpublished]),undefined);
await db.query("update mods set status='published' where id=$1",[unpublished]);
const newJob=await claim();
assert.equal(newJob.modId,unpublished);
await finish(newJob,[{...success,status:'unavailable'}]);
assert.equal((await query("select next_check_at < now()+interval '25 hours' and next_check_at > now()+interval '23 hours' daily from private.external_rating_sync where mod_id=$1",[unpublished])).daily,true);
const first=await query('select first_published_at from private.external_rating_sync where mod_id=$1',[unpublished]);
await db.query("update mods set status='published', title='Edited' where id=$1",[unpublished]);
assert.deepEqual(await query('select first_published_at from private.external_rating_sync where mod_id=$1',[unpublished]),first);
await db.query("update private.external_rating_sync set first_published_at=now()-interval '7 days',next_check_at=now() where mod_id=$1",[unpublished]);
await finish(await claim(),[{...success,status:'rate_limited'}]);
assert.equal((await claim()).status,'rate_limited');
await db.exec("create schema vault; create table vault.decrypted_secrets(name text,decrypted_secret text);");
await db.exec(readFileSync(new URL('20261105121317_creator_centric_external_rating_sync.sql', migrationRoot),'utf8'));
assert.equal((await query("select public.authorize_external_rating_cron('bad') as allowed")).allowed,false);
await assert.rejects(as(alice,"select public.authorize_external_rating_cron('bad')"),/permission denied/);
const setAge=async(age,mod=modA)=>db.query(
  "update private.external_rating_sync set first_published_at=now()-($2::integer*interval '24 hours'),next_check_at=now(),last_manual_at=null,failures=0 where mod_id=$1",
  [mod,age]);
await db.exec("update private.external_rating_sync set next_check_at=null");
for(const age of [3,14,29,30,31,90]){
  await setAge(age);
  const job=await claim();
  if(age>=30){
    assert.equal(job.status,'idle','stale queue must not bypass age '+age);
    continue;
  }
  assert.equal(job.modId,modA);
  assert.equal((await finish(job,[success])).status,'unchanged');
  const due=await query('select extract(epoch from next_check_at-now()) as seconds from private.external_rating_sync where mod_id=$1',[modA]);
  if(age===29) assert.equal(due.seconds,null);
  else assert.ok(Math.abs(Number(due.seconds)-(age===3?86400:604800))<5);
}
for(const age of [3,31,90]){
  await setAge(age);
  if(age===90) await db.query('update private.external_rating_sync set last_attempt_at=null,next_check_at=null where mod_id=$1',[modA]);
  const before=await next();
  const job=await claim(modA,alice);
  assert.equal(job.status,'claimed');
  assert.equal(job.automaticUntil,null);
  await finish(job,[success]);
  assert.equal(await next(),before);
  assert.equal((await claim(modA,alice)).status,'cooldown');
}
await db.query("update mods set title='Old edit',status='published' where id=$1",[modA]);
assert.equal((await claim()).status,'idle');
await setAge(3);
const limited=await claim();
await finish(limited,[{...success,status:'rate_limited',retryAfter:7200}]);
assert.equal((await claim(modA,alice)).status,'paused');
assert.ok((await query("select paused_until > now()+interval '110 minutes' as long_pause from private.external_rating_provider_state")).long_pause);
assert.equal((await as(alice,'select public.read_external_rating_sync($1) data',[modA]))[0].data.automaticEnded,false);

await db.exec("alter table public.mods add column origin text");
await db.exec(readFileSync(new URL("20261105195510_gtainside_native_external_feedback.sql", migrationRoot),'utf8'));
await db.exec("update private.external_rating_provider_state set paused_until=null");
await setAge(90);
const gtaInside='https://www.gtainside.com/gta5/mods/12-fixture';
await db.query("update mods set origin='gtainside',source_url=$1 where id=$2",[gtaInside,modA]);
await db.query("insert into mod_sources(mod_id,platform_id,canonical_url) select $1,id,$2 from platforms where slug='gta5mods'",[modA,url]);
const native=async(mod=null,account=null)=>(await query('select public.claim_external_feedback_sync($1,$2) data',[mod,account])).data;
assert.equal((await native()).status,'idle','old due time never enables native backfill');
assert.equal((await native(modA,outsider)).status,'forbidden');
await assert.rejects(as(alice,'select public.claim_external_feedback_sync($1,$2)',[modA,alice]),/permission denied/);
const ownerNative=await native(modA,alice);
assert.equal(ownerNative.status,'claimed');
const voteResult={platform:'gtainside',url:gtaInside,status:'success',positive:0,negative:0};
assert.equal((await finish(ownerNative,[voteResult])).status,'updated');
assert.equal((await native(modA,alice)).status,'cooldown');
const ratingData=(await query('select public.read_mod_rating_channels(array[$1::uuid],true) data',[modA])).data[modA];
assert.equal(ratingData.externalPrimary.platform,'gtainside');
assert.equal(ratingData.externalPrimary.url,gtaInside);
const nativeRating=ratingData.external.find(s=>s.platform==='gtainside');
assert.equal(nativeRating.type,'votes');
assert.equal(nativeRating.positive,0);
assert.equal(nativeRating.negative,0);
assert.equal(nativeRating.value,null);
assert.equal(ratingData.external.find(s=>s.platform==='gta5mods').value,4.8);
await setAge(90);
assert.equal((await finish(await native(modA,alice),[{...voteResult,status:'unavailable'}])).status,'unavailable');
assert.equal((await query("select positive_count from private.external_rating_snapshots where feedback_type='votes'")).positive_count,0);
await setAge(14);
const scheduledNative=await native();
assert.equal(scheduledNative.modId,modA);
await finish(scheduledNative,[{...voteResult,status:'rate_limited',retryAfter:7200}]);
const pauseState=(await db.query('select platform,paused_until is not null as paused from private.external_rating_provider_state order by platform')).rows;
assert.deepEqual(pauseState,[{platform:'gta5mods',paused:false},{platform:'gtainside',paused:true}]);

await db.close();
console.log('External sync SQL passed: publication and backfill, owner authorization, lease fencing, cooldown, unchanged scores, snapshot preservation and retry.');
`;
setup += `\ntry { await import('data:text/javascript;base64,'+Buffer.from(fixture+${JSON.stringify(checks)}).toString('base64')); } catch(error) { console.error(error.message); process.exitCode=1; }`;
await import('data:text/javascript;base64,'+Buffer.from(setup).toString('base64'));

