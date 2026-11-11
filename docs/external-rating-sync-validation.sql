begin read only;
select version,name from supabase_migrations.schema_migrations where version in ('20261105113259','20261105121317') order by version;
select count(*) as total,
  count(*) filter(where q.first_published_at+interval '720 hours'<=now()) as older_manual_only,
  count(*) filter(where q.first_published_at+interval '720 hours'<=now() and q.next_check_at is not null) as stale_old_due_times,
  count(*) filter(where q.first_published_at+interval '720 hours'>now() and q.next_check_at<=now()
    and m.status='published' and m.visibility in ('public','early_access')
    and exists(select 1 from private.external_rating_sources(q.mod_id) s where s.platform='gta5mods')) as due
from private.external_rating_sync q join public.mods m on m.id=q.mod_id;
select last_status,count(*) from private.external_rating_sync group by last_status;
select platform,strikes,paused_until from private.external_rating_provider_state;
select (select count(*) from private.external_rating_snapshots) as external_snapshots,
       (select count(*) from private.mod_ratings) as internal_votes,
       has_table_privilege('authenticated','private.external_rating_sync','select') as user_queue,
       has_function_privilege('authenticated','public.claim_external_rating_sync(uuid,uuid)','execute') as user_claim,
       has_function_privilege('anon','public.authorize_external_rating_cron(text)','execute') as anon_cron_auth,
       has_function_privilege('service_role','public.finish_external_rating_sync(uuid,uuid,jsonb)','execute') as service_finish;
rollback;

