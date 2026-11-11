begin read only;

select version,name from supabase_migrations.schema_migrations
where version in ('20261031100736','20261031103144','20261104090451','20261105095308')
order by version;

select channel,is_valid,count(*) from private.mod_ratings group by channel,is_valid order by channel,is_valid;
select (select count(*) from private.mod_rating_history) as history_rows,
       (select count(*) from private.discussion_rating_submissions) as comment_snapshots,
       (select count(*) from private.external_rating_snapshots) as external_snapshots,
       (select count(*) from private.creator_reputation_assessments) as tier_assessments;

select n.nspname,c.relname,c.relrowsecurity,
       has_table_privilege('anon',c.oid,'SELECT') as anon_direct_read,
       has_table_privilege('authenticated',c.oid,'INSERT') as authenticated_direct_write
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='private' and c.relname in ('mod_ratings','external_rating_snapshots','creator_reputation_assessments');

select n.nspname,p.proname,p.prosecdef,
       has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
       has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where p.proname in ('classify_mod_rating','read_creator_tier','read_mod_rating_channels','record_gta5mods_rating')
order by n.nspname,p.proname;

select tgname from pg_trigger where tgrelid='private.mod_ratings'::regclass and not tgisinternal;

set local role anon;
select public.read_mod_rating_channels(array(select id from public.mods where status='published' order by id limit 3),true);
rollback;

