import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

// Isolated PostgreSQL runtime, outside the application dependencies:
// npm install --prefix "$env:TEMP/modvault-discussion-tests" --no-save --package-lock=false @electric-sql/pglite@0.3.14
const runtime = process.env.MODVAULT_DISCUSSION_TEST_RUNTIME ?? join(process.env.TEMP, 'modvault-discussion-tests');
const { PGlite } = createRequire(join(runtime, 'package.json'))('@electric-sql/pglite');
const db = new PGlite();
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const [alice, bob, outsider, moderator] = [1, 2, 3, 4].map(id);
const [creatorA, creatorB, creatorOther, teamCreator, team] = [11, 12, 13, 14, 15].map(id);
const [modA, modB, modTeam, unpublished] = [21, 22, 23, 24].map(id);
await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  grant usage on schema auth to anon,authenticated;
  create type public.activity_actor_type as enum ('user','creator','system');
  create table public.profiles(id uuid primary key,username text,display_name text,default_creator_id uuid,role text default 'user');
  create table public.creators(id uuid primary key,name text,owner_id uuid,owner_type text,team_id uuid);
  create table public.creator_members(creator_id uuid,profile_id uuid,status text,role text);
  create table public.teams(id uuid primary key,creator_id uuid,owner_id uuid,status text default 'active');
  create table public.mods(id uuid primary key,title text,status text,creator_id uuid);
  create table public.activity_events(id uuid primary key default gen_random_uuid(),event_type text,actor_type public.activity_actor_type,
    actor_id uuid,target_type text,target_id uuid,parent_type text,parent_id uuid,visibility text,title text,summary text,metadata jsonb);
  create table public.notifications(id uuid primary key default gen_random_uuid(),profile_id uuid,activity_event_id uuid);
  alter table public.activity_events enable row level security;
  create policy legacy_activity_insert on public.activity_events for insert to authenticated with check (auth.uid() is not null);
  grant insert on public.activity_events to authenticated;
`);
for (const [account, name] of [[alice,'Alice'],[bob,'Bob'],[outsider,'Outsider'],[moderator,'Moderator']]) {
  await db.query('insert into profiles(id,username,display_name) values ($1,$2,$2)', [account,name]);
}
for (const [creator, owner, name] of [[creatorA,alice,'A'],[creatorB,alice,'B'],[creatorOther,bob,'Other']]) {
  await db.query("insert into creators values ($1,$2,$3,'user',null)", [creator,name,owner]);
  await db.query("insert into creator_members values ($1,$2,'approved','owner')", [creator,owner]);
}
await db.query("insert into creators values ($1,'Team',$2,'team',$2)", [teamCreator,team]);
await db.query('insert into teams(id,creator_id,owner_id) values ($1,$2,$3)',[team,teamCreator,creatorOther]);
for (const [mod, creator] of [[modA,creatorA],[modB,creatorOther],[modTeam,teamCreator],[unpublished,creatorOther]]) {
  await db.query('insert into mods values ($1,$2,$3,$4)',[mod,'Mod',mod===unpublished?'draft':'published',creator]);
}
await db.exec(readFileSync(new URL('../supabase/migrations/20261031100736_unified_discussions.sql',import.meta.url),'utf8'));
async function as(account, sql, args=[]) {
  await db.exec(`begin; set local role ${account ? 'authenticated' : 'anon'};`);
  await db.query("select set_config('request.jwt.claim.sub',$1,true)",[account??'']);
  try { const result = await db.query(sql,args); await db.exec('commit'); return result.rows; }
  catch (error) { await db.exec('rollback'); throw error; }
}
const write = async (account, action, { comment=null,target=modB,creator=null,parent=null,body='A comment',category='mod' }={}) =>
  (await as(account,'select public.write_discussion($1,$2,$3,$4,$5,$6,$7) id',[action,comment,target,creator,parent,body,category]))[0].id;
const read = async (account, mode, {type=null,identity=null,target=null,direction='written',category=null,page=1,limit=20,comment=null}={}) =>
  (await as(account,'select public.read_discussions($1,$2,$3,$4,$5,$6,$7,$8,$9) result',[mode,type,identity,target,direction,category,page,limit,comment]))[0].result;
const selectIdentity = (account,creator) => db.query('update profiles set default_creator_id=$1 where id=$2',[creator,account]);
const resetRate = () => db.exec('truncate private.discussion_mutations');
const count = async table => (await db.query(`select count(*)::int n from ${table}`)).rows[0].n;

await assert.rejects(write(null,'create'),/permission denied|Sign in/);
await assert.rejects(write(alice,'create',{creator:creatorOther}),/identity changed/);
await selectIdentity(alice,creatorOther);
await assert.rejects(write(alice,'create',{creator:creatorOther}),/no longer have access/);
await selectIdentity(alice,creatorA);
await assert.rejects(write(alice,'create'),/identity changed/);
await write(alice,'create',{creator:creatorA,target:modA});
assert.equal(await count('notifications'),0,'own mod never notifies the author');
const top = await write(alice,'create',{creator:creatorA});
await assert.rejects(db.query('update private.discussion_comments set author_creator_id=$1 where id=$2',[creatorB,top]),/immutable/);
await assert.rejects(db.query('update private.discussion_comments set author_account_id=$1 where id=$2',[bob,top]),/immutable/);
await assert.rejects(db.query('update private.discussion_comments set target_id=$1 where id=$2',[modA,top]),/immutable/);
assert.equal(await count('notifications'),1);
const reply = await write(bob,'create',{parent:top});
assert.equal(await count('notifications'),2,'self owner excluded, original author receives reply');
assert.equal((await read(alice,'account',{direction:'received'})).items[0].id,reply);
assert.equal((await read(alice,'account',{direction:'received',type:'creator',identity:creatorA})).items.length,1);
assert.equal((await read(alice,'account',{direction:'received',type:'user',identity:alice})).items.length,0);
await assert.rejects(write(bob,'create',{parent:reply}),/top-level/);
await assert.rejects(write(bob,'create',{parent:top,target:modA}),/top-level/);
await assert.rejects(write(alice,'edit',{comment:reply}),/Only the author/);
await assert.rejects(write(outsider,'hide',{comment:top}),/cannot moderate/);
await assert.rejects(write(alice,'create',{creator:creatorA,target:unpublished}),/unavailable/);
await assert.rejects(write(alice,'create',{creator:creatorA,body:'  '}),/between/);
await assert.rejects(write(alice,'create',{creator:creatorA,body:'x'.repeat(4001)}),/between/);
await assert.rejects(write(alice,'create',{creator:creatorA,category:'asset'}),/not available/);

await selectIdentity(alice,creatorB);
await write(alice,'edit',{comment:top,body:'Edited under permanent A'});
assert.equal((await read(null,'identity',{type:'creator',identity:creatorA})).items.find(c=>c.id===top).author_creator_id,creatorA);
assert.equal((await read(null,'identity',{type:'creator',identity:creatorA})).items.length,2,'own and other mods in authored history');
assert.equal((await read(null,'identity',{type:'creator',identity:creatorB})).items.length,0);
assert.equal((await read(null,'identity',{type:'user',identity:alice})).items.length,0);
await selectIdentity(alice,null);
const personal = await write(alice,'create');
const ownReply = await write(alice,'create',{parent:top});
assert.equal((await read(null,'identity',{type:'user',identity:alice})).items.length,2,'personal replies included');
assert.equal((await read(alice,'account')).items.length,4);
await assert.rejects(read(null,'account'),/Sign in/);
await assert.rejects(read(bob,'account',{type:'user',identity:alice}),/Identity unavailable/);
await assert.rejects(read(bob,'account',{type:'creator',identity:creatorA}),/Identity unavailable/);
const publicRow=(await read(null,'identity',{type:'creator',identity:creatorA})).items[0];
assert.ok(!('author_account_id' in publicRow),'creator public authorship does not leak account linkage');
await assert.rejects(as(alice,'select * from private.discussion_comments'),/permission denied/);
await assert.rejects(as(alice,"update private.discussion_comments set author_creator_id=$1 where id=$2",[creatorB,top]),/permission denied/);

await write(bob,'hide',{comment:top});
assert.equal((await read(null,'thread',{target:modB,comment:reply})).items.length,0,'hidden thread suppresses replies');
assert.equal((await read(alice,'account',{direction:'received'})).items.length,0);
assert.equal((await read(bob,'moderation',{target:modB})).items[0].id,top);
assert.equal((await read(outsider,'moderation',{target:modB})).items.length,0);
await write(bob,'restore',{comment:top});
await write(alice,'delete',{comment:top});
const tombstone=(await read(null,'thread',{target:modB,comment:reply})).items.find(c=>c.id===top);
assert.equal(tombstone.status,'deleted'); assert.equal(tombstone.body,'');
assert.ok((await read(null,'identity',{type:'user',identity:alice})).items.some(c=>c.id===ownReply),'authored replies survive deleted parent');
await assert.rejects(write(bob,'restore',{comment:top}),/cannot be restored/);
assert.equal((await read(null,'identity',{type:'creator',identity:creatorA})).items.length,1,'deleted excluded from public history');
assert.equal(await count('activity_events'),await count('notifications'),'one account notification per recipient event');
assert.equal((await db.query("select count(*)::int n from activity_events where metadata ? 'body' or summary is not null")).rows[0].n,0);

await resetRate();
await selectIdentity(bob,null);
const sameOwnerParent=await write(bob,'create');
const before=await count('notifications');
await write(outsider,'create',{parent:sameOwnerParent});
assert.equal(await count('notifications'),before+1,'reply+mod-owner recipient deduplicated');
await write(alice,'create',{target:modTeam});
assert.equal((await db.query('select profile_id from notifications order by ctid desc limit 1')).rows[0].profile_id,bob,'team mod resolves to leader account');
await db.query('insert into private.discussion_moderators values ($1)',[moderator]);
await write(moderator,'hide',{comment:personal});
await write(moderator,'restore',{comment:personal});
await db.query("update profiles set role='admin' where id=$1",[outsider]);
await assert.rejects(write(outsider,'hide',{comment:personal}),/cannot moderate/,'editable profile role grants no moderation');
await assert.rejects(as(alice,"insert into activity_events(event_type,metadata) values ('comment_created','{}')"),/must be generated/);
await as(alice,"insert into activity_events(event_type,metadata) values ('existing_team_event','{}')");

await resetRate();
for(let i=0;i<5;i++) await write(alice,'create',{body:`rate ${i}`});
await assert.rejects(write(alice,'create'),/Posting limit/);
await selectIdentity(alice,creatorA);
await assert.rejects(write(alice,'create',{creator:creatorA}),/Posting limit/,'limit shared across identities');
await resetRate();
await selectIdentity(alice,null);
for(let i=0;i<51;i++) {
  await db.exec("update private.discussion_mutations set occurred_at=now()-interval '2 minutes'");
  if(i<50) await write(alice,'create',{body:`pagination ${i}`});
  else await assert.rejects(write(alice,'create'),/Posting limit/);
}
const first=await read(null,'identity',{type:'user',identity:alice});
const second=await read(null,'identity',{type:'user',identity:alice,page:2});
assert.equal(first.items.length,20); assert.equal(second.items.length,20); assert.equal(first.hasMore,true);
assert.ok(!first.items.some(a=>second.items.some(b=>b.id===a.id)),'stable pagination has no duplicates');
assert.equal((await read(null,'identity',{type:'user',identity:alice,category:'asset'})).items.length,0);
assert.equal((await read(null,'identity',{type:'user',identity:alice,limit:10})).items.length,10);
await assert.rejects(read(null,'target',{target:modB,limit:21}),/Invalid/);
await assert.rejects(read(null,'identity',{type:'nope',identity:alice}),/Choose/);
await resetRate();
const longThread=await write(bob,'create');
let oldestReply;
for(let i=0;i<25;i++) {
  await resetRate();
  const created=await write(alice,'create',{parent:longThread,body:`reply ${i}`});
  if(i===0) oldestReply=created;
}
const focused=await read(null,'thread',{target:modB,comment:oldestReply});
assert.equal(focused.items[0].id,longThread,'root is first in a thread');
assert.equal(focused.items[1].id,oldestReply,'old deep-linked reply is on page one');
assert.equal(focused.hasMore,true);
assert.equal(focused.items[0].reply_count,25);
await db.close();
console.log('Discussion PostgreSQL checks passed: identity, ownership, replies, visibility, moderation, events, deduplication, rate limits, pagination and privileges.');
