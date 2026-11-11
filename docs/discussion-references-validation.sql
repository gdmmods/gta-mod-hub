begin read only;
select version,name from supabase_migrations.schema_migrations
where version in ('20261031100736','20261104090451','20261105203056') order by version;

select relrowsecurity,
  has_table_privilege('authenticated',oid,'SELECT') as can_read_directly,
  has_table_privilege('authenticated',oid,'INSERT') as can_write_directly
from pg_class where oid='private.discussion_references'::regclass;

select has_function_privilege('anon','public.search_discussion_references(text,text)','execute') as anonymous_search,
  has_function_privilege('authenticated','public.search_discussion_references(text,text)','execute') as authenticated_search,
  has_function_privilege('authenticated','private.save_discussion_references(uuid,jsonb)','execute') as direct_reference_mutation;

select (select count(*) from private.discussion_comments) as comments,
       (select count(*) from private.discussion_references) as references,
       (select count(*) from public.notifications) as notifications,
       (select count(*) from private.mod_ratings) as ratings;
rollback;

