-- READ ONLY. Expected target: zormnoamfexwnhhajzmx, eu-central-1.
select version,name from supabase_migrations.schema_migrations
where version in ('20261031103144','20261031100736') order by version;

select status,count(*) from public.teams group by status;
select t.id,t.status,c.id creator_id,c.team_id,c.owner_type,c.owner_id,
       (c.team_id=t.id and c.owner_type='team' and c.owner_id=t.id) as identity_consistent
from public.teams t left join public.creators c on c.id=t.creator_id;

select has_function_privilege('anon','public.set_team_archived(uuid,boolean)','EXECUTE') anon_archive,
       has_function_privilege('authenticated','public.set_team_archived(uuid,boolean)','EXECUTE') owner_entrypoint,
       has_function_privilege('authenticated','public.delete_owned_team(uuid,uuid)','EXECUTE') legacy_delete,
       has_function_privilege('anon','public.get_archived_teams()','EXECUTE') anon_archive_list;
-- false,true,false,false. Owner verification is inside the entrypoint.

select n.nspname,p.proname,p.prosecdef,p.proconfig,p.proacl from pg_proc p
join pg_namespace n on n.oid=p.pronamespace where p.proname in
('set_team_archived','get_archived_teams','is_creator_operational','delete_owned_team',
 'guard_team_lifecycle','guard_archived_team_writes','guard_active_selection','guard_archived_team_activity');

select tgrelid::regclass,tgname,pg_get_triggerdef(oid) from pg_trigger
where not tgisinternal and tgname in ('guard_team_lifecycle','guard_archived_team_writes','guard_active_selection','guard_archived_team_activity');

select t.id,t.status,public.is_creator_operational(t.creator_id) operational from public.teams t;
-- false for archived, true for consistent active team links.

select t.id,count(*) pending_invitations from public.teams t join public.invitations i on i.team_id=t.id
where t.status='archived' and i.status='pending' group by t.id;
-- zero rows.

select conname,confdeltype,pg_get_constraintdef(oid) from pg_constraint
where conrelid='private.discussion_comments'::regclass and confrelid='public.creators'::regclass;
-- Original author_creator_id FK retained, confdeltype='a' (NO ACTION).

select c.id,c.author_creator_id,cr.name,cr.team_id,t.status
from private.discussion_comments c join public.creators cr on cr.id=c.author_creator_id
join public.teams t on t.id=cr.team_id where t.status='archived';

select profile_id,activity_event_id,count(*) from public.notifications
where activity_event_id in (select id from public.activity_events where metadata ? 'discussionCommentId')
group by profile_id,activity_event_id having count(*)>1;
-- zero rows. Also run the existing discussion guide validation.
