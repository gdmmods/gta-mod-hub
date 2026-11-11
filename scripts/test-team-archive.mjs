import { readFileSync } from 'node:fs';

// Reuse the isolated discussion fixture, then apply the actual lifecycle and
// discussion files. Never connects to Supabase or writes production fixtures.
const root = new URL('../', import.meta.url);
let fixture = readFileSync(new URL('scripts/test-discussions.mjs',root),'utf8').split("await assert.rejects(write(null,'create')")[0];
fixture = fixture.replace("await db.exec(readFileSync(new URL('../supabase/migrations/20261031100736_unified_discussions.sql',import.meta.url),'utf8'));", `
await db.exec(\`
  create role service_role; create schema private;
  alter table creators add column avatar text, add column status text default 'active';
  alter table teams add column name text default 'Fixture Team', add column slug text,
    add column updated_at timestamptz;
  create table team_members(id uuid primary key default gen_random_uuid(), team_id uuid references teams(id),
    creator_id uuid references creators(id),role text,membership_status text,joined_at timestamptz default now(),
    left_at timestamptz,removed_at timestamptz,removed_by uuid,leave_reason text,
    can_upload boolean,can_manage_members boolean,can_manage_team boolean);
  create table invitations(id uuid primary key default gen_random_uuid(),invitation_type text,status text,
    sender_creator_id uuid,recipient_creator_id uuid,recipient_profile_id uuid,team_creator_id uuid,team_id uuid,
    message text,expires_at timestamptz,activity_event_id uuid,accepted_at timestamptz,rejected_at timestamptz,
    accepted_by_creator_id uuid,created_at timestamptz default now());
  alter table creator_members add foreign key(profile_id) references profiles(id) on delete cascade;
  alter table notifications add column archived_at timestamptz;
  alter table mods add column downloads integer default 0, add column likes integer default 0;
  create table mod_creators(mod_id uuid,creator_id uuid,role text);
  create table mod_sources(mod_id uuid);
  create table mod_files(mod_id uuid);
  create table creator_aliases(creator_id uuid,alias text);
  create table external_identities(creator_id uuid);
  grant select,update on teams to authenticated;
  grant select on creators to authenticated;
  alter table teams enable row level security;
  create policy fixture_active_read on teams for select to anon,authenticated using(status='active');
  create policy fixture_owner_update on teams for update to authenticated using(true) with check(true);
\`);
const baseline=JSON.parse(readFileSync(new URL('../docs/team-archive-live-audit.json',import.meta.url),'utf8'));
for(const f of baseline.functions) await db.exec(f.definition);
if(process.env.MODVAULT_ARCHIVE_TEST_BUNDLE==='1') {
  await db.exec('create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text primary key,name text,statements text[]);');
  await db.exec(readFileSync(new URL('../docs/team-archive-apply.sql',import.meta.url),'utf8'));
  assert.equal((await db.query('select count(*)::int n from supabase_migrations.schema_migrations')).rows[0].n,2);
} else {
await db.exec(readFileSync(new URL('../supabase/migrations/20261031103144_team_archive_lifecycle.sql',import.meta.url),'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/20261031100736_unified_discussions.sql',import.meta.url),'utf8'));
}
`);
// Resolve fixture-relative assets from this test rather than from a data URL.
fixture=fixture.replaceAll("new URL('../",`new URL('${root.href}`).replaceAll(',import.meta.url)',')');
const checks = `
await db.query("insert into creator_members values ($1,$2,'approved','owner')",[teamCreator,bob]);
await db.query("insert into team_members(team_id,creator_id,role,membership_status,can_upload) values ($1,$2,'member','active',true)",[team,creatorA]);
await db.query("insert into invitations(invitation_type,status,team_id,recipient_creator_id,recipient_profile_id,expires_at) values ('team_invite','pending',$1,$2,$3,now()+interval '1 day')",[team,creatorB,alice]);
await selectIdentity(bob,teamCreator);
const authored=await write(bob,'create',{creator:teamCreator,target:modA});
await assert.rejects(db.query('delete from creators where id=$1',[teamCreator]),/foreign key constraint/);
const historic=await read(null,'identity',{type:'creator',identity:teamCreator});
assert.equal(historic.items[0].author_href,'/creator/'+teamCreator);
const before={comments:await count('private.discussion_comments'),members:await count('team_members'),notifications:await count('notifications'),events:await count('activity_events')};
await assert.rejects(as(null,'select set_team_archived($1,true)',[team]),/permission denied|Authentication/);
await assert.rejects(as(alice,'select set_team_archived($1,true)',[team]),/verified team owner/);
await assert.rejects(as(bob,'select delete_owned_team($1,$2)',[team,teamCreator]),/permission denied/);
await assert.rejects(as(bob,"update teams set status='archived' where id=$1",[team]),/Use the team archive/);
await as(bob,'select set_team_archived($1,true)',[team]);
assert.equal((await db.query('select status from teams where id=$1',[team])).rows[0].status,'archived');
assert.equal((await db.query('select default_creator_id from profiles where id=$1',[bob])).rows[0].default_creator_id,teamCreator,'saved reference is harmless: lifecycle denies its use');
assert.equal((await db.query('select status from invitations where team_id=$1',[team])).rows[0].status,'expired');
assert.equal((await read(null,'identity',{type:'creator',identity:teamCreator})).items[0].id,authored);
assert.equal((await read(null,'identity',{type:'creator',identity:teamCreator})).items[0].author_creator_id,teamCreator);
assert.equal((await read(bob,'identity',{type:'creator',identity:teamCreator})).items[0].can_edit,false);
assert.equal((await as(bob,'select * from get_archived_teams()')).length,1);
assert.equal((await as(alice,'select * from get_archived_teams()')).length,0);
assert.equal((await as(null,'select is_creator_operational($1) active',[teamCreator]))[0].active,false);
assert.equal((await as(null,'select * from get_public_team_members($1)',[team])).length,2);
await assert.rejects(selectIdentity(bob,teamCreator),/archived or unavailable/);
// Reproduce a stale session without changing its saved selection: create is still denied.
await assert.rejects(write(bob,'create',{creator:teamCreator}),/Archived team/);
await selectIdentity(bob,null); // Match CreatorContext refresh after archive.
await assert.rejects(write(bob,'edit',{comment:authored}),/read-only/);
await assert.rejects(write(bob,'delete',{comment:authored}),/read-only/);
for (const action of ['join','leave','remove']) await assert.rejects(as(bob,'select set_team_membership($1,$2,$3)',[team,creatorA,action]),/archived or unavailable/);
await assert.rejects(as(bob,"select create_team_invitation($1,$2,null)",[team,creatorB]),/team owner|active team/);
await assert.rejects(as(bob,'select get_my_team_access($1)',[team]),/permission denied|not active/);
await assert.rejects(db.query("insert into mods values ($1,'Forbidden','published',$2,0,0)",[id(99),teamCreator]),/archived or unavailable/);
await assert.rejects(db.query("update mods set title='Forbidden' where id=$1",[modTeam]),/archived or unavailable/);
await db.query('update mods set downloads=downloads+1 where id=$1',[modTeam]);
await assert.rejects(db.query("update creators set name='Forbidden' where id=$1",[teamCreator]),/archived or unavailable/);
await assert.rejects(db.query("update creators set owner_type='user',team_id=null,owner_id=$1 where id=$2",[bob,teamCreator]),/permanent/);
await assert.rejects(db.query('insert into mod_sources values ($1)',[modTeam]),/archived or unavailable/);
await assert.rejects(db.query('insert into mod_files values ($1)',[modTeam]),/archived or unavailable/);
await assert.rejects(db.query("insert into creator_aliases values ($1,'Forbidden')",[teamCreator]),/archived or unavailable/);
await assert.rejects(db.query('insert into external_identities values ($1)',[teamCreator]),/archived or unavailable/);
await assert.rejects(db.query("insert into activity_events(event_type,actor_type,actor_id,target_type,target_id) values ('team_changed','creator',$1,'team',$2)",[teamCreator,team]),/archived or unavailable/);
await as(bob,'select set_team_archived($1,true)',[team]);
const pending=(await db.query('select id from invitations where team_id=$1',[team])).rows[0];
assert.equal((await as(alice,'select respond_to_team_invitation($1,true) result',[pending.id]))[0].result.status,'expired');
await assert.rejects(as(bob,'select private.require_active_team($1)',[team]),/permission denied/);
for (const [key,table] of Object.entries({comments:'private.discussion_comments',members:'team_members',notifications:'notifications',events:'activity_events'})) assert.equal(await count(table),before[key],key+' preserved without duplicates');
await assert.rejects(as(alice,'select set_team_archived($1,false)',[team]),/verified team owner/);
// Existing personal-account deletion cascades are not converted into team lifecycle actions.
await db.query('insert into profiles(id,username) values ($1,$2)',[id(80),'Disposable']);
// Temporarily restore to create a historical team-identity membership through admin fixtures.
await as(bob,'select set_team_archived($1,false)',[team]);
await db.query("insert into creator_members values ($1,$2,'approved','member')",[teamCreator,id(80)]);
await as(bob,'select set_team_archived($1,true)',[team]);
await db.query('delete from profiles where id=$1',[id(80)]);
assert.equal((await db.query('select count(*)::int n from creator_members where profile_id=$1',[id(80)])).rows[0].n,0,'pre-existing profile FK cascade preserved');

// Invalid retained identity authorization blocks restoration, without changing lifecycle.
await db.query("update creator_members set status='pending' where creator_id=$1 and profile_id=$2",[creatorA,alice]);
await assert.rejects(as(bob,'select set_team_archived($1,false)',[team]),/memberships require review/);
await db.query("update creator_members set status='approved' where creator_id=$1 and profile_id=$2",[creatorA,alice]);
await as(bob,'select set_team_archived($1,false)',[team]);
await as(bob,'select set_team_archived($1,false)',[team]);
assert.equal((await as(null,'select is_creator_operational($1) active',[teamCreator]))[0].active,true);
assert.equal((await db.query('select status from invitations where team_id=$1',[team])).rows[0].status,'expired');
assert.equal((await db.query('select default_creator_id from profiles where id=$1',[bob])).rows[0].default_creator_id,null,'restore never silently selects an identity');
assert.equal(await count('notifications'),before.notifications);
assert.equal(await count('activity_events'),before.events);
await selectIdentity(bob,teamCreator);
await write(bob,'edit',{comment:authored,body:'Restored attribution'});
assert.equal((await read(null,'identity',{type:'creator',identity:teamCreator})).items[0].author_creator_id,teamCreator);
await write(bob,'create',{creator:teamCreator,target:modA});
assert.equal(await count('notifications'),before.notifications+1,'restored publishing emits exactly one new recipient notification');
// Restore refuses duplicates, leaving the transaction safely rollbackable.
await db.exec('begin');
await db.query("select set_config('request.jwt.claim.sub',$1,true)",[bob]);
await db.query("insert into team_members(team_id,creator_id,role,membership_status) values ($1,$2,'member','active')",[team,creatorA]);
await db.query('select set_team_archived($1,true)',[team]);
await assert.rejects(db.query('select set_team_archived($1,false)',[team]),/memberships require review/);
await db.exec('rollback');
assert.equal((await db.query('select status from teams where id=$1',[team])).rows[0].status,'active');
await db.close();
console.log('Team lifecycle PostgreSQL checks passed: archive/restore, retained attribution/FKs, stale identities, permissions, all content writes, memberships, invitations, history, counters and notification idempotence.');
`;
try { await import('data:text/javascript;base64,'+Buffer.from(fixture+checks).toString('base64')); }
catch(error) { console.error(error.message); process.exitCode=1; }
