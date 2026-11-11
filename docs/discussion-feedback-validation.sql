-- Read-only checks AFTER approval/application of 20261104090451.
select version,name from supabase_migrations.schema_migrations where version='20261104090451';
select n.nspname,c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='private' and c.relname in ('mod_ratings','mod_rating_totals','mod_rating_history','discussion_rating_submissions');
-- All four RLS=true. Deliberately no direct client table policies/grants.
select has_table_privilege('anon','private.mod_ratings','SELECT') anonymous_direct_read,
       has_table_privilege('authenticated','private.mod_ratings','INSERT') direct_vote,
       has_table_privilege('authenticated','private.mod_rating_totals','UPDATE') direct_totals,
       has_function_privilege('anon','public.submit_mod_feedback(uuid,uuid,text,integer)','EXECUTE') anonymous_write,
       has_function_privilege('authenticated','public.submit_mod_feedback(uuid,uuid,text,integer)','EXECUTE') authenticated_entrypoint;
-- false,false,false,false,true (ownership checks are inside the implementation).
select conname,pg_get_constraintdef(oid) from pg_constraint where conrelid='private.mod_ratings'::regclass;
select schemaname,tablename,indexname,indexdef from pg_indexes where schemaname='private' and tablename like '%rating%';
select n.nspname,p.proname,p.prosecdef,p.proconfig,p.proacl from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where p.proname in ('submit_mod_feedback','read_mod_rating','moderate_mod_rating','discussion_event_details','set_mod_rating','record_mod_rating');
-- Public wrappers invokers, private implementations definers with empty search_path.
with expected as (
  select mod_id,coalesce(sum(value) filter(where is_valid),0) rating_sum,count(*) filter(where is_valid) rating_count
  from private.mod_ratings group by mod_id
) select coalesce(e.mod_id,t.mod_id) mod_id from expected e full join private.mod_rating_totals t using(mod_id)
where coalesce(e.rating_sum,0)<>coalesce(t.rating_sum,0) or coalesce(e.rating_count,0)<>coalesce(t.rating_count,0);
-- Zero rows: cached totals agree with valid votes.
select account_id,mod_id,count(*) from private.mod_ratings group by account_id,mod_id having count(*)>1;
select value from private.mod_ratings where value not between 1 and 5;
-- Both zero rows.
select s.comment_id from private.discussion_rating_submissions s join private.discussion_comments c on c.id=s.comment_id
join private.mod_ratings r on r.id=s.rating_id where c.parent_comment_id is not null or c.target_id<>r.mod_id or c.author_account_id<>r.account_id;
-- Zero rows: snapshots belong to the same account/mod's top-level submission.
select n.profile_id,n.activity_event_id,count(*) from public.notifications n join public.activity_events e on e.id=n.activity_event_id
where e.event_type in ('comment_created','comment_reply_created') group by n.profile_id,n.activity_event_id having count(*)>1;
select c.id from private.discussion_comments c join public.activity_events e on e.metadata->>'discussionCommentId'=c.id::text
join public.notifications n on n.activity_event_id=e.id where n.profile_id=c.author_account_id;
-- Both zero rows.
select public.read_mod_rating(m.id) from public.mods m where m.status='published' limit 1;
-- Unrated state initially: average null/count 0; no automatic votes inferred from old comments.
