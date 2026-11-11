import { readFileSync } from "node:fs";

import assert from "node:assert/strict";
import { followingEventHref, isModActivity } from "../lib/notifications/followingPresentation.ts";

const creatorId = "00000000-0000-0000-0000-000000000011";
const modId = "00000000-0000-0000-0000-000000000012";
const followingEventId = "00000000-0000-0000-0000-000000000013";
const metadata = { creatorId, modId, followingEventId };
assert.equal(followingEventHref({ event_type: "mod_published", metadata }), "/mods/" + modId);
assert.equal(followingEventHref({ event_type: "creator_announcement", metadata }), "/creator/" + creatorId + "#announcement-" + followingEventId);
for (const event_type of ["mod_version_update", "mod_announcement"]) {
  assert.equal(followingEventHref({ event_type, metadata }), "/mods/" + modId + "#announcement-" + followingEventId);
  assert.equal(isModActivity({ event_type, metadata }), true);
}
assert.equal(isModActivity({ event_type: "comment_reply_created", metadata }), true);
assert.equal(isModActivity({ event_type: "discussion_recognized", metadata }), true);
assert.equal(isModActivity({ event_type: "creator_announcement", metadata }), false);
assert.equal(followingEventHref({ event_type: "creator_followed", metadata: { followerUsername: "sample.creator" } }), "/profile/sample.creator");
assert.equal(followingEventHref({ event_type: "creator_followed", metadata: { followerUsername: "../invalid" } }), null);
assert.equal(followingEventHref({ event_type: "profile_followed", metadata: { followerCreatorId: creatorId } }), "/creator/" + creatorId);
assert.equal(isModActivity({ event_type: "project_updated", metadata }), false);
assert.equal(followingEventHref({ event_type: "mod_announcement", metadata: { modId: "/bad", followingEventId } }), null);

const root = new URL("../", import.meta.url);
let setup = readFileSync(new URL("scripts/test-team-archive.mjs", root), "utf8").split("const checks =")[0];
setup = setup.replace("new URL('../', import.meta.url)", `new URL(${JSON.stringify(root.href)})`);
const checks = `
const migrations = new URL('supabase/migrations/', ${JSON.stringify(root.href)});
await db.query('update profiles set username=lower(username)');
await db.exec("create type public.activity_target_type as enum ('creator','mod'); alter table public.mods add column category text, add column description text, add column creator text, add column image text, add column images text, add column source_url text, add column download_url text, add column creator_backup_url text, add column features text, add column requirements text, add column notes text, add column credits text, add column delivery_mode text, add column support_url text, add column external_purchase_url text, add column ownership_required boolean, add column is_paid boolean, add column price numeric, add column created_by uuid, add column verified text, add column visibility text default 'public', add column release_state text default 'public'; alter table mods alter column release_state set default 'stable', add constraint mods_release_state_check check (release_state in ('public','supporters','early_access')); alter table mod_creators add foreign key(creator_id) references creators(id); grant select,insert,update on mods,mod_creators to service_role;");
await db.exec(readFileSync(new URL('supabase/migrations/20261111093456_following_and_announcements.sql', ${JSON.stringify(root.href)}),'utf8'));

const follow = async (account,kind,target,enabled=true) =>
  (await as(account,'select set_follow($1,$2,$3) result',[kind,target,enabled]))[0].result;
const state = async (account,kind,target) =>
  (await as(account,'select follow_state($1,$2) result',[kind,target]))[0].result;
const list = async (account,target,mod,focus=null) =>
  (await as(account,'select list_announcements($1,$2,12,0,$3) result',[target,mod,focus]))[0].result;
const publish = async (account,target,mod,entry,{action='publish',kind='announcement',title='News',notify=false}={}) =>
  (await as(account,'select write_announcement($1,$2,$3,$4,$5,$6,$7,$8,$9) result',
    [action,target,mod,entry,kind,title,'Public notes',kind==='version'?'2.0':null,notify]))[0].result;
const recipients = async key => (await db.query(
  "select n.profile_id from public.notifications n join public.activity_events e on e.id=n.activity_event_id where e.metadata->>'followingEventId'=$1 order by n.profile_id",
  [key])).rows.map(row=>row.profile_id);

assert.equal((await state(null,'creator',creatorOther)).signedIn,false);
await assert.rejects(follow(null,'creator',creatorOther),/permission denied/);
await assert.rejects(follow(bob,'creator',creatorOther),/cannot follow/);
await assert.rejects(follow(bob,'mod',modB),/cannot follow/);
await assert.rejects(follow(alice,'mod',unpublished),/cannot follow/);
await assert.rejects(as(alice,'select * from private.follows'),/permission denied/);
await follow(alice,'creator',creatorOther);
await follow(alice,'creator',creatorOther);
await selectIdentity(alice,creatorB);
assert.equal((await state(alice,'creator',creatorOther)).following,true);
assert.equal((await state(alice,'creator',creatorOther)).count,1);
assert.equal((await state(alice,'mod',modB)).following,false);
assert.equal((await state(outsider,'creator',creatorOther)).following,false);
await follow(outsider,'creator',creatorOther);
await follow(alice,'mod',modB);
await follow(moderator,'mod',modB);
assert.deepEqual((await as(alice,"select id from list_following('mod')")).map(row=>row.id),[modB]);

await assert.rejects(publish(alice,creatorOther,false,id(90)),/permission/);
await assert.rejects(publish(bob,unpublished,true,id(90)),/unavailable/);
await assert.rejects(as(alice,"insert into activity_events(event_type,metadata) values ('mod_announcement','{}')"),/generated by publication/);
await publish(bob,creatorOther,false,id(90));
assert.deepEqual(await recipients(id(90)),[]);
assert.equal((await list(null,creatorOther,false,id(90))).items[0].notified,null);
assert.equal((await list(bob,creatorOther,false,id(90))).items[0].notified,false);
await publish(bob,creatorOther,false,id(91),{notify:true});
await publish(bob,creatorOther,false,id(91),{notify:true});
await publish(bob,creatorOther,false,id(91),{action:'edit',title:'Edited',notify:true});
assert.deepEqual(await recipients(id(91)),[alice,outsider]);
assert.equal((await list(null,creatorOther,false,id(91))).items[0].title,'Edited');
await publish(bob,modB,true,id(92),{kind:'version',notify:true});
await publish(bob,modB,true,id(93),{notify:true});
assert.deepEqual(await recipients(id(92)),[alice,moderator]);
assert.deepEqual(await recipients(id(93)),[alice,moderator]);
await follow(alice,'mod',modB,false);
await publish(bob,modB,true,id(94),{notify:true});
assert.deepEqual(await recipients(id(94)),[moderator]);
assert.deepEqual(await recipients(id(93)),[alice,moderator]);
await publish(bob,modB,true,id(93),{action:'archive'});
assert.equal((await list(null,modB,true,id(93))).items.length,0);
assert.deepEqual(await recipients(id(93)),[alice,moderator]);

await follow(alice,'mod',modTeam);
await publish(bob,modTeam,true,id(95),{notify:true});
assert.deepEqual(await recipients(id(95)),[alice]);
await db.query("insert into creator_members values ($1,$2,'approved','owner')",[teamCreator,bob]);
await as(bob,'select set_team_archived($1,true)',[team]);
await assert.rejects(publish(bob,modTeam,true,id(96)),/permission/);
assert.equal((await list(null,modTeam,true,id(95))).items[0].author,'Team');

async function upload(key,options={},collaborators=[]) {
  await db.exec('begin; set local role service_role');
  try {
    const result = await db.query('select publish_uploaded_mod($1,$2,$3) id',[key,
      JSON.stringify({title:'New mod',creator_id:creatorOther,created_by:bob,notify_followers_on_publication:true,...options}),collaborators]);
    await db.exec('commit');
    return result.rows[0].id;
  } catch (error) {
    await db.exec('rollback');
    throw error;
  }
}
await assert.rejects(as(alice,"select publish_uploaded_mod($1,'{}','{}')",[id(100)]),/permission denied/);
assert.equal(await upload(id(100)),id(100));
assert.equal(await upload(id(100)),id(100));
assert.deepEqual(await recipients(id(100)),[alice,outsider]);
assert.equal((await db.query("select count(*)::int n from mod_creators where mod_id=$1 and role='owner'",[id(100)])).rows[0].n,1);
await assert.rejects(upload(id(103),{},[id(999)]),/foreign key constraint/);
assert.deepEqual(await recipients(id(103)),[]);
assert.equal((await db.query("select id from mods where id=$1",[id(103)])).rows.length,0);
const modState = async key => (await db.query(
  'select status,visibility,release_state,first_publication_pending from mods where id=$1',[key])).rows[0];
assert.deepEqual(await modState(id(100)),{status:'published',visibility:'public',release_state:'public',first_publication_pending:false});
await upload(id(106),{release_state:null,status:'draft',visibility:'supporters'});
assert.deepEqual(await modState(id(106)),{status:'draft',visibility:'supporters',release_state:'public',first_publication_pending:true});
assert.deepEqual(await recipients(id(106)),[]);
for (const [key,release] of [[107,'public'],[108,'supporters'],[109,'early_access']]) {
  await upload(id(key),{release_state:release});
  assert.equal((await modState(id(key))).release_state,release);
  assert.equal((await modState(id(key))).visibility,'public');
  assert.deepEqual(await recipients(id(key)),release==='public'?[alice,outsider]:[]);
}
await assert.rejects(upload(id(110),{release_state:'stable'}),/mods_release_state_check/);
assert.equal(await modState(id(110)),undefined);
assert.deepEqual(await recipients(id(110)),[]);
await upload(id(101),{notify_followers_on_publication:false});
await upload(id(102),{status:'draft'});
assert.deepEqual(await modState(id(102)),{status:'draft',visibility:'public',release_state:'public',first_publication_pending:true});
assert.deepEqual(await recipients(id(101)),[]);
assert.deepEqual(await recipients(id(102)),[]);
await db.query("update mods set status='published' where id=$1",[id(102)]);
assert.equal((await modState(id(102))).first_publication_pending,false);
assert.deepEqual(await recipients(id(102)),[alice,outsider]);
await db.query("update mods set title='Minor correction' where id=$1",[id(102)]);
await db.query("update mods set status='draft' where id=$1",[id(102)]);
await db.query("update mods set status='published' where id=$1",[id(102)]);
assert.deepEqual(await recipients(id(102)),[alice,outsider]);
await db.exec("grant select,insert,update on mods to authenticated; alter table mods enable row level security; create policy fixture_mod_reads on mods for select to authenticated using (true); create policy fixture_mod_insert on mods for insert to authenticated with check (exists(select 1 from creators c where c.id=mods.creator_id and c.owner_id=auth.uid())); create policy fixture_mod_update on mods for update to authenticated using (exists(select 1 from creators c where c.id=mods.creator_id and c.owner_id=auth.uid()));");
await as(bob,"insert into mods(id,title,status,creator_id,release_state) values ($1,'Import draft','draft',$2,'public')",[id(104),creatorOther]);
assert.deepEqual(await recipients(id(104)),[]);
await as(bob,"update mods set status='published',notify_followers_on_publication=true where id=$1",[id(104)]);
assert.deepEqual(await recipients(id(104)),[alice,outsider]);
await as(bob,"insert into mods(id,title,status,creator_id,release_state) values ($1,'Quiet draft','draft',$2,'public')",[id(105),creatorOther]);
await as(bob,"update mods set status='published',notify_followers_on_publication=false where id=$1",[id(105)]);
assert.deepEqual(await recipients(id(105)),[]);
await as(bob,"update mods set status='draft',first_publication_pending=true where id=$1",[modB]);
await assert.rejects(as(bob,"update mods set status='published',notify_followers_on_publication=true where id=$1",[modB]),/only change on first publication/);
await as(bob,"update mods set status='published' where id=$1",[modB]);
assert.deepEqual(await recipients(modB),[]);
await db.query("update mods set visibility='private' where id=$1",[modB]);
assert.equal((await list(null,modB,true)).items.length,0);
assert.deepEqual((await as(moderator,"select name,image,available from list_following('mod')"))[0],{name:null,image:null,available:false});

console.log('Following PostgreSQL checks passed: account isolation, identity switching, public visibility, team ownership, announcement management, notification audiences, publication defaults, and retries.');


await db.exec("alter table profiles add column avatar_url text; alter table creators add column specialization text[]; alter table notifications add column is_read boolean not null default false;");
const originalFollows = await db.query("select account_id,creator_id,mod_id,created_at from private.follows order by account_id,creator_id,mod_id");
const identityMigration = readFileSync(new URL('20261111104309_identity_following.sql', migrations),'utf8');
await db.exec(identityMigration);
await db.exec(identityMigration);
assert.deepEqual((await db.query("select account_id,creator_id,mod_id,created_at from private.follows where follower_user_id=account_id and follower_creator_id is null order by account_id,creator_id,mod_id")).rows,originalFollows.rows);
assert.equal(await count('private.follows'),originalFollows.rows.length);
await db.exec(readFileSync(new URL('20261111104334_social_discovery.sql', migrations),'utf8'));

const identityFollow = async (account,selected,kind,target,enabled=true) =>
  (await as(account,'select set_follow($1,$2,$3,$4) result',[kind,target,enabled,selected]))[0].result;
const management = (account,selected,kind) => as(account,'select * from list_following($1,24,0,$2)',[kind,selected]);
const directory = async (creator,username,section,offset=0) =>
  (await as(null,'select list_social_directory($1,$2,$3,$4) result',[creator,username,section,offset]))[0].result;
const followerEvents = async (actor,target) => (await db.query(
  "select n.profile_id,n.activity_event_id,e.actor_type,e.metadata,n.is_read from notifications n join activity_events e on e.id=n.activity_event_id where e.event_type='creator_followed' and e.actor_id=$1 and e.target_id=$2",
  [actor,target])).rows;

assert.deepEqual(await followerEvents(alice,creatorOther),[],'existing follows do not send new notifications');
await selectIdentity(alice,null);
assert.equal((await state(alice,'creator',creatorOther)).following,true);
const countBefore=(await state(null,'creator',creatorOther)).count;
assert.ok((await management(alice,null,'creator')).some(row=>row.id===creatorOther));
await selectIdentity(alice,creatorA);
assert.equal((await state(alice,'creator',creatorOther)).following,false);
assert.deepEqual(await management(alice,creatorA,'creator'),[]);
await assert.rejects(identityFollow(alice,null,'creator',creatorOther),/selected identity changed/);
await assert.rejects(identityFollow(alice,creatorA,'creator',creatorA),/cannot follow/);
await assert.rejects(identityFollow(alice,creatorA,'mod',modA),/cannot follow/);
await identityFollow(alice,creatorA,'creator',creatorOther);
await identityFollow(alice,creatorA,'creator',creatorOther);
assert.equal((await state(alice,'creator',creatorOther)).following,true);
assert.equal((await state(null,'creator',creatorOther)).count,countBefore+1);
let events=await followerEvents(creatorA,creatorOther);
assert.equal(events.length,1);
assert.equal(events[0].profile_id,bob);
assert.equal(events[0].actor_type,'creator');
assert.equal(events[0].metadata.followerCreatorId,creatorA);
assert.equal(events[0].is_read,false);
await identityFollow(alice,creatorA,'creator',creatorOther,false);
assert.equal((await followerEvents(creatorA,creatorOther)).length,1);
await identityFollow(alice,creatorA,'creator',creatorOther);
events=await followerEvents(creatorA,creatorOther);
assert.equal(events.length,2);
assert.notEqual(events[0].activity_event_id,events[1].activity_event_id);

await db.query("update creators set specialization=array['Vehicles'] where id=$1",[creatorA]);
await identityFollow(alice,creatorA,'creator',creatorB);
assert.deepEqual(await followerEvents(creatorA,creatorB),[],'same responsible account does not receive a notification');
const followers=(await directory(creatorOther,null,'followers')).items;
assert.deepEqual(Object.keys(followers.find(item=>item.href==='/profile/alice')).sort(),['avatar','href','name','specialization']);
assert.deepEqual(followers.find(item=>item.href==='/creator/'+creatorA).specialization,['Vehicles']);
assert.ok((await directory(creatorA,null,'creators')).items.some(item=>item.id===creatorB));
assert.ok(!(await directory(null,'alice','creators')).items.some(item=>item.id===creatorB));
await db.query("update mods set visibility='public' where id=$1",[modB]);
await identityFollow(alice,creatorA,'mod',modB);
await selectIdentity(alice,null);
assert.ok(!(await directory(null,'alice','mods')).items.some(item=>item.id===modB));
await identityFollow(alice,null,'mod',modB);
assert.ok((await directory(creatorA,null,'mods')).items.some(item=>item.id===modB && item.mod_creators[0].creators.id===creatorOther));
await publish(bob,creatorOther,false,id(195),{notify:true});
assert.deepEqual(await recipients(id(195)),[alice,outsider],'creator follows deduplicate by delivery account');
await publish(bob,modB,true,id(196),{kind:'version',notify:true});
assert.deepEqual(await recipients(id(196)),[alice,moderator],'mod follows deduplicate by delivery account');
await db.query("update mods set visibility='private' where id=$1",[modB]);
assert.deepEqual((await directory(creatorA,null,'mods')).items,[]);

await as(bob,'select set_team_archived($1,false)',[team]);
await db.query("insert into creator_members values ($1,$2,'approved','member')",[teamCreator,alice]);
await selectIdentity(alice,teamCreator);
assert.equal((await state(alice,'creator',creatorOther)).canManage,false);
await assert.rejects(identityFollow(alice,teamCreator,'creator',creatorOther),/Only the team leader/);
await assert.rejects(identityFollow(alice,teamCreator,'creator',creatorOther,false),/Only the team leader/);
await assert.rejects(management(alice,teamCreator,'creator'),/cannot manage/);
await selectIdentity(bob,teamCreator);
await identityFollow(bob,teamCreator,'creator',creatorA);
assert.ok((await directory(teamCreator,null,'creators')).items.some(item=>item.id===creatorA));
assert.ok(!(await directory(null,'bob','creators')).items.some(item=>item.id===creatorA));
assert.equal((await followerEvents(teamCreator,creatorA))[0].profile_id,alice);
await selectIdentity(alice,null);
await identityFollow(alice,null,'creator',teamCreator);
assert.equal((await followerEvents(alice,teamCreator))[0].profile_id,bob);
await assert.rejects(as(alice,"insert into activity_events(event_type,metadata) values ('creator_followed','{}')"),/generated by publication/);
await assert.rejects(as(alice,'select * from private.follows'),/permission denied/);
assert.equal(await directory(null,'missing','mods'),null);
assert.equal(await directory(null,'alice','projects'),null);

for (let n=201;n<226;n++) {
  await db.query('insert into profiles(id,username) values ($1,$2)',[id(n),'follower'+n]);
  await identityFollow(id(n),null,'creator',creatorOther);
}
const firstPage=(await directory(creatorOther,null,'followers')).items;
const secondPage=(await directory(creatorOther,null,'followers',24)).items;
assert.equal(firstPage.length,25,'one lookahead row');
assert.equal(new Set([...firstPage.slice(0,24),...secondPage].map(x=>x.href)).size,countBefore+26);
assert.equal((await state(null,'creator',creatorOther)).count,countBefore+26);
console.log('Identity following and Social Discovery checks passed: replay-safe personal backfill, identity switching, public isolation, leader permissions, pagination, re-follows, and account-level delivery.');
await db.exec(readFileSync(new URL('20261111111100_creator_relationship_counts.sql', migrations),'utf8'));
const relationships = async (viewer,creator) =>
  (await as(viewer,'select creator_relationship_counts($1) result',[creator]))[0].result;
assert.deepEqual(await relationships(null,creatorA),{followers:1,following:2,followedCreations:0});
assert.deepEqual(await relationships(bob,creatorA),await relationships(null,creatorA),'counts do not depend on the viewer or their Active Creator');
assert.equal((await relationships(null,creatorOther)).followers,countBefore+26);
await db.query("update mods set visibility='public' where id=$1",[modB]);
assert.equal((await relationships(null,creatorA)).followedCreations,1);
assert.equal((await relationships(null,creatorA)).followedCreations,(await directory(creatorA,null,'mods')).items.length);
assert.equal((await relationships(null,creatorOther)).followedCreations,0);
await db.query("insert into creators(id,name,owner_type) values ($1,'Empty identity','user')",[id(999)]);
assert.deepEqual(await relationships(null,id(999)),{followers:0,following:0,followedCreations:0});
assert.equal(await relationships(null,id(998)),null);
await assert.rejects(as(null,'select * from private.follows'),/permission denied/);
console.log('Creator relationship counts passed: profile identity isolation, public-only mod counts, directory parity and zeros.');

await db.exec("create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(bucket_id text,name text); create function storage.foldername(name text) returns text[] language sql immutable as 'select string_to_array(name,''/'')'; grant usage on schema storage to anon,authenticated; grant insert,update,delete on storage.objects to authenticated; alter table storage.objects enable row level security; grant select,update on public.profiles to authenticated; alter table public.profiles enable row level security; create policy fixture_profiles_read on public.profiles for select using(true); create policy fixture_profile_owner_update on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());");
await db.exec(readFileSync(new URL('20261111113433_universal_profile_foundation.sql', migrations),'utf8'));
const personal = (await as(null,"select personal_relationship_counts('alice') result"))[0].result;
assert.equal(personal.following,(await directory(null,'alice','creators')).items.length);
assert.equal(personal.followedCreations,(await directory(null,'alice','mods')).items.length);
await selectIdentity(alice,creatorA);
assert.deepEqual((await as(alice,"select personal_relationship_counts('alice') result"))[0].result,personal);
assert.equal((await as(null,"select personal_relationship_counts('unknown') result"))[0].result,null);

const avatar = 'https://example.test/avatar.png';
await as(alice,"update profiles set tagline='Personal introduction',avatar_url=$2,banner_url=$2,location='Europe',interests=array['Vehicles'],socials=jsonb_build_object('website','https://example.test/') where id=$1",[alice,avatar]);
assert.deepEqual((await db.query('select username,tagline,avatar_url,banner_url,location,interests from profiles where id=$1',[alice])).rows[0],
  {username:'alice',tagline:'Personal introduction',avatar_url:avatar,banner_url:avatar,location:'Europe',interests:['Vehicles']});
assert.equal((await db.query('select name from creators where id=$1',[creatorA])).rows[0].name,'A');
assert.deepEqual(await as(bob,"update profiles set tagline='Forbidden' where id=$1 returning id",[alice]),[]);
await assert.rejects(as(alice,"update profiles set socials=jsonb_build_object('role','admin') where id=$1",[alice]),/check constraint/);

await as(alice,"insert into storage.objects values ('profile-images',$1)",[alice+'/'+id(800)+'.png']);
await assert.rejects(as(alice,"insert into storage.objects values ('profile-images',$1)",[bob+'/'+id(801)+'.png']),/row-level security/);
await assert.rejects(as(alice,"insert into storage.objects values ('profile-images',$1)",[alice+'/'+id(802)+'.svg']),/row-level security/);
await assert.rejects(as(null,"insert into storage.objects values ('profile-images',$1)",[alice+'/'+id(802)+'.png']),/permission denied/);
assert.equal((await db.query("select file_size_limit from storage.buckets where id='profile-images'")).rows[0].file_size_limit,5242880);
console.log('Universal profile SQL checks passed: personal fields, identity counts, owner-only edits and scoped image uploads.');


const oldReferences = readFileSync(new URL('20261105203056_universal_discussion_references.sql', migrations),'utf8');
await db.exec(oldReferences.slice(oldReferences.indexOf('create view private.reference_entities'),
  oldReferences.indexOf('create function private.discussion_reference_display')));
const handlesMigration = readFileSync(new URL('20261111115443_universal_identity_handles.sql', migrations),'utf8');
await db.exec('begin');
await assert.rejects(db.exec(handlesMigration),/invalid or reserved handle/);
await db.exec('rollback');
await db.query("update profiles set username='fixture-moderator' where id=$1",[moderator]);
await db.exec(handlesMigration);
const handle = async (account,creator,value) =>
  (await as(account,'select set_identity_handle($1,$2) result',[creator,value]))[0].result;
const creatorHandle = async creator => (await as(null,'select get_creator_handle($1) result',[creator]))[0].result;
const personalHandle = async username => (await as(null,'select get_personal_handle($1) result',[username]))[0].result;
assert.equal(await personalHandle('alice'),'alice');
assert.equal(await creatorHandle(creatorA),null);
await assert.rejects(handle(null,creatorA,'anon-claim'),/permission denied/);
await assert.rejects(handle(outsider,creatorA,'stolen-creator'),/verified creator or team owner/);
await assert.rejects(handle(alice,teamCreator,'stolen-team'),/verified creator or team owner/);
await assert.rejects(handle(alice,creatorA,'MoDvAuLt-support'),/reserved/);
await assert.rejects(handle(alice,creatorA,'@invalid'),/3/);
await assert.rejects(handle(alice,creatorA,'ALICE'),/already in use/);
assert.equal(await handle(alice,creatorA,'Handle-A'),'handle-a');
assert.equal(await handle(alice,creatorA,'HANDLE-A'),'handle-a');
await assert.rejects(handle(bob,creatorOther,'HaNdLe-A'),/already in use/);
assert.equal(await creatorHandle(creatorA),'handle-a');
assert.equal(await handle(bob,teamCreator,'team-handle'),'team-handle');
assert.equal(await creatorHandle(teamCreator),'team-handle');
await as(bob,'select set_team_archived($1,true)',[team]);
await assert.rejects(handle(bob,teamCreator,'archived-team'),/archived or unavailable/);
assert.equal(await creatorHandle(teamCreator),'team-handle');
await as(bob,'select set_team_archived($1,false)',[team]);

await db.query("update creators set name='handle-a' where id=$1",[creatorOther]);
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[alice]);
const lookup = async query => (await db.query("select private.search_discussion_references('@',$1) result",[query])).rows[0].result;
assert.equal((await lookup('handle-a'))[0].id,creatorA,'exact handle outranks an identical display name');
assert.ok((await lookup('handle-a')).some(row=>row.id===creatorOther),'legacy display name still resolves');
assert.equal(await handle(alice,null,'alice-public'),'alice-public');
assert.equal(await personalHandle('alice'),'alice-public');
assert.equal((await db.query('select username from profiles where id=$1',[alice])).rows[0].username,'alice');
assert.equal((await lookup('alice'))[0].id,alice,'stable personal username is a fallback');
assert.equal((await lookup('alice-public'))[0].id,alice);
await assert.rejects(as(alice,"update profiles set username='changed-route' where id=$1",[alice]),/username is permanent/);
await assert.rejects(handle(bob,creatorOther,'alice'),/previously reserved/);
assert.equal(await handle(alice,creatorA,'handle-a-next'),'handle-a-next');
await assert.rejects(handle(bob,creatorOther,'handle-a'),/previously reserved/);
assert.equal((await db.query("select href from private.reference_entities where id=$1 and kind='creator'",[creatorA])).rows[0].href,'/creator/'+creatorA);
assert.equal((await db.query("select href from private.reference_entities where id=$1 and kind='user'",[alice])).rows[0].href,'/profile/alice');
assert.ok((await directory(null,'alice','creators')).items.some(row=>row.id===creatorOther));

await db.query("insert into profiles(id) values ($1)",[id(998)]);
await as(id(998),"update profiles set username='new-person' where id=$1",[id(998)]);
assert.equal(await personalHandle('new-person'),'new-person');
await db.query('delete from profiles where id=$1',[id(998)]);
await assert.rejects(handle(bob,creatorOther,'new-person'),/previously reserved/);
await assert.rejects(as(alice,'select * from private.identity_handles'),/permission denied/);
assert.equal((await as(alice,"select identity_handle_availability('admin') result"))[0].result,'reserved');
assert.equal((await as(alice,"select identity_handle_availability('Handle-A') result"))[0].result,'unavailable');
assert.equal((await as(alice,"select identity_handle_availability('fresh-handle') result"))[0].result,'available');
console.log('Universal handle SQL checks passed: personal backfill, namespace collisions, ownership, reservations, stable URLs and mention fallback.');


await db.exec(readFileSync(new URL('20261111121356_discussion_recognition.sql', migrations),'utf8'));
const award = async (viewer,mod,comment,request,action='award',reason=null) =>
  (await as(viewer,'select write_discussion_recognition($1,$2,$3,$4,$5) result',[mod,comment,action,request,reason]))[0].result;
const contributions = async (kind,identity) =>
  (await as(null,'select community_contributions($1,$2) result',[kind,identity]))[0].result;
const seedComment = (key,author,creator,mod,parent=null) => db.query(
  "insert into private.discussion_comments(id,author_account_id,author_creator_id,target_type,target_id,parent_comment_id,body) values($1,$2,$3,'mod',$4,$5,'Useful notes')",
  [key,author,creator,mod,parent]);
const recognitionAlerts = async key => (await db.query(
  "select n.profile_id,n.is_read,e.metadata from public.notifications n join public.activity_events e on e.id=n.activity_event_id where e.event_type='discussion_recognized' and e.target_id=$1",
  [key])).rows;
await seedComment(id(301),alice,null,modB);
await seedComment(id(302),alice,creatorA,modB,id(301));
await seedComment(id(303),bob,teamCreator,modA);
await seedComment(id(304),bob,creatorOther,modB);
await seedComment(id(305),alice,creatorA,modTeam);
await seedComment(id(306),alice,creatorB,modA);
await assert.rejects(award(outsider,modB,id(301),id(401)),/verified mod owner/);
await assert.rejects(award(alice,modTeam,id(305),id(401)),/verified mod owner/);
await assert.rejects(award(alice,modA,id(306),id(401)),/own contribution/);
await assert.rejects(award(bob,modA,id(301),id(401)),/Discussion unavailable/);
await assert.rejects(award(bob,modB,id(304),id(401)),/own contribution/);
assert.equal((await award(bob,modB,id(301),id(401),'award',' Helpful notes ')).reason,'Helpful notes');
await award(bob,modB,id(301),id(401));
await award(bob,modB,id(301),id(402));
assert.equal((await recognitionAlerts(id(301))).length,1);
assert.equal((await recognitionAlerts(id(301)))[0].profile_id,alice);
assert.equal((await recognitionAlerts(id(301)))[0].is_read,false);
assert.equal((await award(bob,modB,id(302),id(403))).active,true);
assert.equal((await contributions('user',alice)).count,1);
assert.equal((await contributions('creator',creatorA)).count,1);
assert.equal((await contributions('creator',creatorA)).recent[0].id,id(302));
assert.equal((await award(alice,modA,id(303),id(404))).active,true);
assert.equal((await recognitionAlerts(id(303)))[0].profile_id,bob);
assert.equal((await contributions('creator',teamCreator)).count,1);
assert.equal((await award(bob,modTeam,id(305),id(405))).active,true);
assert.equal((await contributions('creator',creatorA)).creators,2);
await assert.rejects(award(outsider,modB,id(301),id(401),'revoke'),/verified mod owner/);
await award(bob,modB,id(301),id(401),'revoke');
await award(bob,modB,id(301),id(401),'revoke');
assert.equal((await contributions('user',alice)).count,0);
assert.equal((await recognitionAlerts(id(301))).length,1);
assert.ok((await db.query('select revoked_at,revoked_account_id from private.discussion_recognitions where id=$1',[id(401)])).rows[0].revoked_at);
await award(bob,modB,id(301),id(401));
assert.equal((await contributions('user',alice)).count,0,'retry cannot revive revoked awards');
await db.query("update private.discussion_comments set status='hidden' where id=$1",[id(301)]);
assert.equal((await contributions('creator',creatorA)).count,1,'a reply under a hidden root is excluded');
assert.deepEqual((await as(null,'select discussion_recognition_state($1,$2) result',[modB,[id(301),id(302)]]))[0].result,{});
await assert.rejects(award(bob,modB,id(301),id(407)),/public contributions/);
await db.query("update private.discussion_comments set status='deleted' where id=$1",[id(305)]);
assert.equal((await contributions('creator',creatorA)).count,0);
await assert.rejects(as(alice,'select * from private.discussion_recognitions'),/permission denied/);
await assert.rejects(as(alice,"insert into public.activity_events(event_type,metadata) values ('discussion_recognized','{}')"),/generated by an award/);
console.log('Recognition SQL checks passed: authorization, retries, personal/creator/team attribution, moderation, audit and recipient delivery.');


await db.exec("alter type public.activity_target_type add value 'profile'; alter type public.activity_target_type add value 'team';");
await db.exec(\`
  create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
  create function public.handle_new_user() returns trigger language plpgsql security definer as $fixture$
    begin insert into public.profiles(id) values(new.id); return new; end $fixture$;
  create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
  alter table public.creators alter column id set default gen_random_uuid(), add column tagline text,
    add column bio text, add column creator_type text, add column games uuid[];
  alter table public.teams alter column id set default gen_random_uuid();
  alter table public.creator_members add column if not exists verified boolean;
\`);
const oldRelationships = await count('private.follows');
await db.exec(readFileSync(new URL('20261111153259_universal_profile_following.sql', migrations),'utf8'));
await db.exec(readFileSync(new URL('20261111153300_require_new_identity_handles.sql', migrations),'utf8'));
assert.equal(await count('private.follows'),oldRelationships);
assert.equal((await as(null,"select get_personal_handle('alice') handle"))[0].handle,'alice-public');
assert.equal((await as(null,"select signup_handle_availability('ALICE') result"))[0].result,'unavailable');
assert.equal((await as(null,"select signup_handle_availability('admin') result"))[0].result,'reserved');
const newUser=id(501);
await assert.rejects(db.query("insert into auth.users values($1,'{}')",[newUser]),/handle is required/);
await assert.rejects(db.query("insert into auth.users values($1,'{\\"handle\\":\\"ALICE\\"}')",[newUser]),/unique|duplicate/);
await db.query("insert into auth.users values($1,'{\\"handle\\":\\"New-Player\\"}')",[newUser]);
assert.equal((await as(null,"select get_personal_handle('new-player') handle"))[0].handle,'new-player');
const create = async (account,handle,founder=null) =>
  (await as(account,"select create_identity_with_handle($1,'New Identity','','','{}',$2) id",[handle,founder]))[0].id;
await assert.rejects(create(null,'no-auth'),/permission denied/);
await assert.rejects(create(alice,'admin'),/non-reserved/);
await assert.rejects(create(alice,'new-player'),/already in use/);
await assert.rejects(db.query("insert into public.creators(name,owner_type,owner_id) values('Bypass','user',$1)",[alice]),/handle is required/);
await assert.rejects(db.query("insert into public.teams(name,owner_id) values('Bypass',$1)",[creatorA]),/requires a team creator/);
const personalCreator = await create(alice,'first-creator');
await selectIdentity(alice,creatorA);
await assert.rejects(create(alice,'wrong-founder',creatorOther),/identity changed/);
const teamCount=await count('teams');
await assert.rejects(create(alice,'first-creator',creatorA),/already in use/);
assert.equal(await count('teams'),teamCount,'handle collision rolls back the team');
const aliceTeam=await create(alice,'first-team',creatorA);
assert.equal((await as(null,'select get_creator_handle($1) handle',[aliceTeam]))[0].handle,'first-team');
assert.equal((await db.query("select count(*)::int n from teams t join creators c on c.id=t.creator_id and c.team_id=t.id join creator_members cm on cm.creator_id=c.id where c.id=$1 and t.owner_id=$2 and cm.profile_id=$3 and cm.role='owner' and cm.status='approved'",[aliceTeam,creatorA,alice])).rows[0].n,1);
assert.equal((await db.query("select count(*)::int n from activity_events where event_type='team_created' and actor_id=$1",[aliceTeam])).rows[0].n,1);

const universalFollowEvents = async (actor,target) => (await db.query(
  "select e.actor_type,e.target_type,n.profile_id,n.is_read from activity_events e join notifications n on n.activity_event_id=e.id where e.event_type in ('creator_followed','profile_followed') and e.actor_id=$1 and e.target_id=$2",
  [actor,target])).rows;
const targetProfiles=[['user',bob,'/profile/bob'],['creator',creatorOther,'/creator/'+creatorOther],['creator',teamCreator,'/creator/'+teamCreator]];
for (const [identity,actor,actorHref] of [[null,alice,'/profile/alice'],[personalCreator,personalCreator,'/creator/'+personalCreator],[aliceTeam,aliceTeam,'/creator/'+aliceTeam]]) {
  await selectIdentity(alice,identity);
  for (const [kind,target,targetHref] of targetProfiles) {
    await identityFollow(alice,identity,kind,target,false);
    assert.equal((await state(alice,kind,target)).following,false);
    const previous=(await universalFollowEvents(actor,target)).length;
    await identityFollow(alice,identity,kind,target);
    await identityFollow(alice,identity,kind,target);
    assert.equal((await state(alice,kind,target)).following,true);
    assert.equal((await universalFollowEvents(actor,target)).length,previous+1);
    assert.deepEqual((await universalFollowEvents(actor,target)).at(-1),{actor_type:identity?'creator':'user',target_type:kind==='user'?'profile':'creator',profile_id:bob,is_read:false});
    assert.ok((await directory(kind==='creator'?target:null,kind==='user'?'bob':null,'followers')).items.some(row=>row.href===actorHref));
    assert.ok((await directory(identity,identity?null:'alice','creators')).items.some(row=>row.href===targetHref));
    await identityFollow(alice,identity,kind,target,false);
    assert.equal((await universalFollowEvents(actor,target)).length,previous+1);
    await identityFollow(alice,identity,kind,target);
    assert.equal((await universalFollowEvents(actor,target)).length,previous+2);
  }
  await assert.rejects(identityFollow(alice,identity,'user',alice),/cannot follow/);
  await assert.rejects(identityFollow(alice,identity,'creator',creatorA),/cannot follow/);
  await assert.rejects(identityFollow(alice,identity,'creator',aliceTeam),/cannot follow/);
}
assert.equal((await as(null,"select personal_relationship_counts('bob') result"))[0].result.followers,3);
assert.equal((await as(null,'select creator_relationship_counts($1) result',[aliceTeam]))[0].result.following,3);
assert.equal((await management(alice,aliceTeam,'user'))[0].attribution,'bob');
assert.ok((await directory(aliceTeam,null,'creators')).items.every(row=>!('account_id' in row)));
await assert.rejects(identityFollow(alice,null,'user',bob),/selected identity changed/);
await selectIdentity(alice,teamCreator);
await assert.rejects(identityFollow(alice,teamCreator,'user',outsider),/Only the team leader/);
await assert.rejects(identityFollow(alice,teamCreator,'user',outsider,false),/Only the team leader/);
await assert.rejects(as(alice,"insert into activity_events(event_type,metadata) values ('profile_followed','{}')"),/generated by publication/);
await selectIdentity(alice,null);
assert.ok((await management(alice,null,'mod')).some(row=>row.id===modB),'existing mod follows remain');
console.log('Universal profile following and mandatory handles passed: nine combinations, deduplication, re-follow, counts, public directories, signup, atomic creator and team creation, ownership and collision checks.');


await db.exec('alter table public.profiles add column bio text;');
await db.exec(readFileSync(new URL('20261111155323_creative_discovery_search.sql', migrations),'utf8'));
const discover = async (query,category,offset=0) =>
  (await as(null,'select creative_discovery_search($1,$2,$3) result',[query,category,offset]))[0].result;
const saveCollaboration = (account,creator,skills,interests,looking,availability) =>
  as(account,'select save_collaboration_profile($1,$2,$3,$4,$5)',[creator,skills,interests,looking,availability]);

await saveCollaboration(alice,null,'Texture Baking','Animated roofs',null,'open');
await saveCollaboration(alice,personalCreator,'Vehicle Rigging','Interior design',null,'selective');
await saveCollaboration(alice,aliceTeam,'Mesh Optimization','Racing models','Environment artists','unavailable');
await assert.rejects(saveCollaboration(bob,aliceTeam,'Bad edit',null,null,null),/verified creator or team owner/);
await assert.rejects(saveCollaboration(alice,null,'a'.repeat(201),null,null,null),/length/);
await assert.rejects(saveCollaboration(alice,null,null,null,null,'invalid'),/availability/);
await assert.rejects(as(null,'select * from private.collaboration_profiles'),/permission denied/);
assert.equal((await discover('@ALICE-PUBLIC','people')).items[0].href,'/profile/alice');
assert.equal((await discover('New Identity','people')).items[0].name,'New Identity');
assert.equal((await discover('texture baking','people')).items[0].availability,'open');
assert.equal((await discover('interior design','people')).items[0].identity_type,'creator');
assert.equal((await discover('mesh optimization','people')).items[0].identity_type,'team');
assert.equal((await discover('environment artists','people')).items[0].href,'/creator/'+aliceTeam);
const firstPeople=(await discover('','people')).items;
const morePeople=(await discover('','people',18)).items;
assert.equal(firstPeople.length,19);
assert.equal(morePeople[0].href,firstPeople[18].href);
assert.ok(!morePeople.some(row=>firstPeople.slice(0,18).some(first=>first.href===row.href)));
await assert.rejects(discover('x'.repeat(97),'people'),/Invalid discovery search/);
await assert.rejects(discover('mod','creations',901),/Invalid discovery search/);

await db.query("update mods set title='Classic Roadster', status='published', visibility='public', release_state='public' where id=$1",[modB]);
await db.query("update mods set title='Private Roadster', status='published', visibility='supporters', release_state='supporters' where id=$1",[unpublished]);
assert.deepEqual((await discover('roadster','creations')).items.map(row=>row.id),[modB]);
assert.equal((await discover('classic roadster','creations')).items[0].mod_creators[0].creators.id,creatorOther);
assert.equal((await discover('%','creations')).items.length,0);

await seedComment(id(601),alice,personalCreator,modB);
await seedComment(id(602),alice,null,modB,id(601));
await seedComment(id(603),alice,null,modB);
await seedComment(id(604),alice,null,modB,id(603));
await seedComment(id(605),alice,null,unpublished);
await seedComment(id(606),alice,null,modB);
await db.query("update private.discussion_comments set body='Try a custom livery for the Roadster' where id=any($1)",[[601,602,603,604,605,606].map(id)]);
await db.query("update private.discussion_comments set status='hidden' where id=$1",[id(603)]);
await db.query("update private.discussion_comments set status='deleted' where id=$1",[id(606)]);
await award(bob,modB,id(601),id(610));
const foundContributions=(await discover('custom livery','contributions')).items;
assert.deepEqual(new Set(foundContributions.map(row=>row.id)),new Set([id(601),id(602)]));
assert.equal(foundContributions.filter(row=>row.recognized_by).length,1);
assert.equal(foundContributions.find(row=>row.id===id(601)).author_href,'/creator/'+personalCreator);
assert.equal((await discover('roadster','all')).creations[0].id,modB);
await db.query("insert into private.discussion_comments(author_account_id,target_type,target_id,body) select $1,'mod',$2,'Unrelated rendering notes ' || n from generate_series(1,3000) n",[alice,modB]);
await db.exec('analyze private.discussion_comments;');
const plan = await db.exec("explain select id from private.discussion_comments where target_type='mod' and status='published' and to_tsvector('simple',body) @@ plainto_tsquery('simple','livery');");

assert.ok(plan.some(result=>result.rows.some(row=>Object.values(row).join().includes('discovery_discussion_body'))));
console.log('Creative Discovery passed: handles, all identity types, collaboration authorization, pagination, public creations, moderation, recognition and indexed contribution search.');


await db.exec("alter role service_role bypassrls; grant select on public.mods to anon; create policy fixture_anon_mod_read on public.mods for select to anon using(true); grant select on public.mod_creators,public.mod_files,public.activity_events to anon,authenticated; create policy fixture_link_read on public.mod_creators for select using(true); create policy fixture_file_read on public.mod_files for select using(true); create policy fixture_event_read on public.activity_events for select using(true);");
const ratingSchema = readFileSync(new URL('20261104090451_discussion_ux_notifications_mod_ratings.sql', migrations),'utf8');
await db.exec(ratingSchema.slice(0,ratingSchema.indexOf('create function private.record_mod_rating')));
await db.exec(oldReferences.slice(0,oldReferences.indexOf('-- Public fields only.')));
await db.exec(oldReferences.slice(oldReferences.indexOf('create function private.discussion_reference_display'),oldReferences.indexOf('create function private.save_discussion_references')));
await db.exec("create table public.platforms(id uuid primary key,slug text); alter table public.mods add column origin text; alter table public.mod_sources add column platform_id uuid, add column canonical_url text; alter table private.mod_ratings add column channel text;");
const channelSchema = readFileSync(new URL('20261105095308_rating_channels_and_creator_reputation.sql', migrations),'utf8');
await db.exec(channelSchema.slice(channelSchema.indexOf('create table private.external_rating_snapshots'),channelSchema.indexOf('revoke all on private.external_rating_snapshots')));
await db.exec("alter table private.external_rating_snapshots add column feedback_type text, add column positive_count integer, add column negative_count integer;");
await db.exec(readFileSync(new URL('20261111164116_restricted_release_policy.sql', migrations),'utf8'));
const restrictedKey=id(701), optedKey=id(702), teamKey=id(703), moderatedKey=id(704);
await upload(restrictedKey,{title:'Private workshop prototype',visibility:'supporters'});
await upload(optedKey,{title:'Release opt-in candidate',visibility:'supporters',notify_followers_on_publication:false});
await upload(teamKey,{title:'Team workshop prototype',visibility:'supporters',creator_id:aliceTeam,created_by:alice});
await upload(moderatedKey,{title:'Pending workshop prototype',visibility:'supporters',status:'pending'});
await db.query('insert into mod_files(mod_id) values($1)',[restrictedKey]);
const readMods = (account,key) => as(account,'select id,title from public.mods where id=$1',[key]);
const editRelease = (account,key,visibility) => as(account,'update public.mods set visibility=$2 where id=$1 returning id',[key,visibility]);
assert.equal((await readMods(bob,restrictedKey))[0].title,'Private workshop prototype');
assert.deepEqual(await readMods(null,restrictedKey),[]);
assert.deepEqual(await readMods(alice,restrictedKey),[]);
assert.deepEqual(await as(null,'select mod_id from mod_files where mod_id=$1',[restrictedKey]),[]);
assert.equal((await as(bob,'select mod_id from mod_files where mod_id=$1',[restrictedKey])).length,1, "owner file read");
assert.deepEqual(await as(null,'select mod_id from mod_creators where mod_id=$1',[restrictedKey]),[]);
assert.equal((await discover('private workshop','creations')).items.length,0);
assert.deepEqual(await recipients(restrictedKey),[]);
assert.deepEqual(await editRelease(alice,restrictedKey,'public'),[]);
assert.deepEqual(await editRelease(bob,restrictedKey,'early_access'),[{id:restrictedKey}]);
assert.equal((await readMods(null,restrictedKey)).length,1, "early access mod read");
assert.deepEqual(await recipients(restrictedKey),[],'stored true cannot opt in by itself');
assert.equal((await discover('private workshop','creations')).items[0].id,restrictedKey);
assert.equal((await as(null,'select mod_id from mod_files where mod_id=$1',[restrictedKey])).length,1, "early access file read");
await editRelease(bob,restrictedKey,'supporters');
assert.deepEqual(await readMods(null,restrictedKey),[]);
assert.equal((await discover('private workshop','creations')).items.length,0);
await editRelease(bob,restrictedKey,'public');
assert.equal((await readMods(null,restrictedKey)).length,1, "restored public mod read");
assert.deepEqual(await recipients(restrictedKey),[]);
assert.equal((await db.query("select creator_id from mods where id=$1",[restrictedKey])).rows[0].creator_id,creatorOther);
assert.equal((await db.query("select count(*)::int n from mod_files where mod_id=$1",[restrictedKey])).rows[0].n,1);

await as(bob,"update mods set visibility='public',notify_followers_on_publication=true where id=$1",[optedKey]);
const optedRecipients=await recipients(optedKey);
assert.ok(optedRecipients.includes(alice));
assert.equal(new Set(optedRecipients).size,optedRecipients.length);
assert.equal((await as(alice,"select id from activity_events where target_type='mod' and target_id=$1",[optedKey])).length,1, "public activity recipient read");
await editRelease(bob,optedKey,'supporters');
assert.deepEqual(await as(alice,"select id from activity_events where target_type='mod' and target_id=$1",[optedKey]),[]);
await editRelease(bob,optedKey,'public');
assert.deepEqual(await recipients(optedKey),optedRecipients,'publication recipients are retained without a second event');

assert.deepEqual(await readMods(bob,teamKey),[]);
assert.deepEqual(await editRelease(bob,teamKey,'public'),[]);
assert.equal((await as(alice,'select can_edit_mod($1) allowed',[teamKey]))[0].allowed,true);
assert.deepEqual(await editRelease(alice,teamKey,'public'),[{id:teamKey}]);
await assert.rejects(as(alice,'update mods set creator_id=$2 where id=$1',[teamKey,creatorA]),/cannot change mod ownership/);
await assert.rejects(as(bob,"update mods set status='published',visibility='public' where id=$1",[moderatedKey]),/cannot be overridden/);
await editRelease(bob,moderatedKey,'public');
assert.deepEqual(await readMods(null,moderatedKey),[]);
await editRelease(bob,modB,'supporters');
assert.equal((await discover('custom livery','contributions')).items.length,0);
assert.equal((await read(null,'target',{target:modB})).items.length,0);
assert.equal((await read(null,'thread',{target:modB,comment:id(601)})).rootId,null);
await assert.rejects(write(alice,'create',{target:modB}),/unavailable/);
assert.ok((await db.query('select id from private.discussion_comments where id=$1',[id(601)])).rows.length);
console.log('Restricted Release passed: upload, private owner/team edit, public APIs, transitions, moderation, historical preservation, and notification opt-in.');

await db.close();
`;
setup += `\ntry { await import('data:text/javascript;base64,' + Buffer.from(fixture + ${JSON.stringify(checks)}).toString('base64')); }
catch (error) { console.error(error.message); process.exitCode = 1; }`;
await import("data:text/javascript;base64," + Buffer.from(setup).toString("base64"));
