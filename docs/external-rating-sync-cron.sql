-- Run only after the supervised Edge check succeeds. The secret must already be in Vault.
begin;
create extension if not exists pg_cron;
select cron.schedule('modvault-external-rating-sync','*/10 * * * *',$job$
do $worker$
declare response record;
begin
  if not exists (
    select 1 from private.external_rating_sync q join public.mods m on m.id=q.mod_id
    where m.status='published' and m.visibility in ('public','early_access')
      and q.next_check_at<=now() and q.first_published_at+interval '720 hours'>now()
      and exists(select 1 from private.external_rating_sources(q.mod_id) s join private.external_rating_provider_state a on a.platform=s.platform
        where a.paused_until is null or a.paused_until<=now())
  ) then
    return;
  end if;
  perform set_config('http.curlopt_timeout_msec','80000',true);
  perform set_config('http.curlopt_connecttimeout_msec','4000',true);
  select r.status into strict response
  from vault.decrypted_secrets s cross join lateral extensions.http(row(
    'POST','https://zormnoamfexwnhhajzmx.supabase.co/functions/v1/external-rating-sync',
    array[extensions.http_header('x-modvault-cron',s.decrypted_secret)],'application/json','{}'
  )::extensions.http_request) r
  where s.name='modvault_external_rating_cron';
  if response.status<>200 then raise exception 'External rating Edge function returned HTTP %',response.status; end if;
end $worker$;
$job$) as job_id;
commit;

