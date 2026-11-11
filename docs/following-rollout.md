# Following and Announcements rollout

Target Supabase project `zormnoamfexwnhhajzmx` on branch `creator-page-refactor`.

The schema audit found a placeholder Follow Creator button and an existing `favorites` table. There is no creator or mod subscription table to backfill. The migration creates account-scoped subscriptions and announcement records and reuses `activity_events` and `notifications`.

## Verify locally

Run `node scripts/test-following.mjs` using the isolated PostgreSQL runtime documented in `scripts/test-discussions.mjs`. Run `node scripts/test-following-ui.mjs` using the React test runtime configured for `scripts/test-feedback-ui.mjs`.

## Activate after approval

1. Confirm the Supabase project reference. Verify that the three prerequisites are recorded and version `20261111093456` is absent.

   ```sql
   select version, name from supabase_migrations.schema_migrations
   where version in ('20261031103144','20261031100736','20261105203056','20261111093456')
   order by version;
   ```

2. From the canonical checkout, generate the transaction with the PowerShell below. Review the result, then execute it as one request in the approved project's SQL editor. The migration and exact history entry commit together. The version's primary key rejects reapplication.

   ```powershell
   $followingSource = Get-Content -Raw -LiteralPath 'supabase/migrations/20261111093456_following_and_announcements.sql'
   $followingDelimiter = '$modvault_following_migration$'
   if ($followingSource.Contains($followingDelimiter)) { throw 'Migration contains the transaction delimiter' }
   $followingTransaction = @(
     'begin;'
     "set local lock_timeout = '5s';"
     "set local statement_timeout = '60s';"
     'lock table supabase_migrations.schema_migrations in share row exclusive mode;'
     "insert into supabase_migrations.schema_migrations(version,name,statements) values ('20261111093456','following_and_announcements',array["
     ($followingDelimiter + $followingSource + $followingDelimiter + ']);')
     $followingSource
     'commit;'
   ) -join "`n"
   $followingTransaction
   ```

3. Run the read-only checks below. If execution fails, inspect the error and verify the migration history before any retry.

   ```sql
   select version, name from supabase_migrations.schema_migrations
   where version = '20261111093456';

   select relname, relrowsecurity from pg_class
   where relnamespace = 'private'::regnamespace
     and relname in ('follows','announcements');

   select
     has_function_privilege('anon', 'public.follow_state(text,uuid)', 'execute') as anon_can_read_state,
     has_function_privilege('anon', 'public.set_follow(text,uuid,boolean)', 'execute') as anon_can_write_follow,
     has_function_privilege('authenticated', 'public.list_following(text,integer,integer)', 'execute') as account_can_list,
     has_function_privilege('authenticated', 'public.publish_uploaded_mod(uuid,jsonb,uuid[])', 'execute') as account_can_call_upload_rpc,
     has_function_privilege('service_role', 'public.publish_uploaded_mod(uuid,jsonb,uuid[])', 'execute') as server_can_call_upload_rpc;

   select tgname from pg_trigger where not tgisinternal
     and tgname in ('guard_publication_choice','notify_mod_publication','guard_following_activity');
   ```

   Both tables should have RLS enabled, the three triggers should be present, and the grant results should be true, false, true, false, true.

4. Run the compatible app locally against the migrated database and complete the signed-in checks below with authorized test accounts. Production test writes and deployment require separate authorization.

## Signed-in acceptance checks

- Follow a creator and a mod, switch Active Creator, and refresh. Verify both subscriptions under Account → Following. Check that owners cannot follow their own targets and Favorites remain independent.
- Publish a creator announcement, mod announcement, and version update. Check the unchecked default, opt-in delivery, correct category, read state and exact destination in both Activity Hub surfaces. Edit or archive an entry and compare delivery counts.
- Upload a public mod with the default checked and a second mod with it cleared. Save an upload draft and a Discovery-import draft, then verify the checkbox and delivery at each first public publication. Save a routine metadata edit and verify that the event count stays the same.
- Verify publishing as the owner of an active team and historical attribution for an archived team. Use a fixture team for writes.
