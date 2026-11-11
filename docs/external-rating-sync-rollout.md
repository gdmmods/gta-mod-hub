# Creator-centric external rating synchronization

ModVault automatically checks external ratings during a mod's first month. Afterward, creators decide when their external ratings should be refreshed.

## Lifecycle

The initial check is queued at first publication. Automatic checks then recur every 24 hours during the first seven days and every 168 hours afterward while age is less than 720 hours. Claims at or beyond 720 hours are rejected, even if an old due time survives. A due time on or after the cutoff is cleared. Older records remain available for manual refresh. The reconciliation can be repeated without changing first-publication times or deleting history. Historical first-publication dates still use the previous migration's added/created timestamp estimate.

Manual refresh stays in the yellow rating tooltip. The existing linked-creator owner check applies independently of navbar identity, with a shared per-mod 24-hour cooldown. Manual checks never move the automatic due time. Public visitors see the last successful source timestamp. An unsuccessful attempt leaves the old score visible.

GTA5-Mods is the only verified adapter. GTAInside displays ratings but has no verified structured feed in this implementation. Other sources are unsupported and do not receive repeated automatic fetches. The worker handles one provider request at a time, spaces requests by at least 1.2 seconds within a batch, rejects redirects, and bounds bodies and timeouts. Provider 401, 403 or 429 pauses new work for at least one hour and honors a longer Retry-After. Repeated denials trigger a 24-hour minimum pause. Other temporary failures receive up to three short retries before returning to the normal schedule.

## Rollout and operation

1. Verify project `zormnoamfexwnhhajzmx` in Frankfurt and apply only `20261105121317_creator_centric_external_rating_sync.sql` after `20261105113259_external_rating_synchronization`. Record the new version with its SQL in the same transaction. Use bounded lock and statement timeouts. The reconciliation retains all snapshots, internal votes, and queue rows.
2. Run `docs/external-rating-sync-validation.sql` read-only. Old rows with a non-null due time must be zero. Check the separate age-window and due counts. Verify the private queue, provider state, and worker RPC grants.
3. Deploy only the Supabase Edge Function `external-rating-sync` with entrypoint `supabase/functions/external-rating-sync/index.mjs` and gateway JWT verification disabled. The handler validates user JWTs against Supabase Auth and authenticates automatic calls through a dedicated 64-character hex secret in Vault. It uses the Edge runtime's `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The local Next.js proxy uses the existing public Supabase variables and cookie session. No Next.js deployment is required.
4. Create a random dedicated Vault secret named `modvault_external_rating_cron` using two random UUIDs with hyphens removed. Pass it only in the `x-modvault-cron` header on HTTPS POST requests to `https://zormnoamfexwnhhajzmx.supabase.co/functions/v1/external-rating-sync`. Enable the Supabase http extension for the supervised call. The request uses Vault directly without putting its credential into a shared request queue. Check unauthenticated rejection and, where a verified creator session is available, manual authorization. Supervise one invocation with `?limit=1`, or leave it idle if no eligible mods are due. Inspect HTTP status, job results, provider state, and queue deltas.
5. Enable pg_cron and register `modvault-external-rating-sync` on `*/10 * * * *` only after verification. Use `docs/external-rating-sync-cron.sql` to register the Vault-backed direct HTTPS invocation. It skips the network call when no eligible mod is due or the provider is paused. Each invocation claims at most five due first-month mods. The database lease also covers manual requests. Use Cron history, Edge logs and the validation query to monitor it.
6. Emergency stop by deactivating the named Cron job. To pause provider traffic for both manual and automatic calls, set the provider's `paused_until` in the private provider state. Retain snapshots and queue history. Scale only after observing legitimate first-month workload and provider limits.

[Supabase Edge authorization](https://supabase.com/docs/guides/functions/auth) · [Supabase Vault-backed scheduling](https://supabase.com/docs/guides/functions/schedule-functions)


## Live verification

Migration 20261105121317 was applied to the verified Frankfurt project. The queue retained 57 rows. Of those, 23 had aged out and had their due times cleared. Thirty were initially due and had a supported source. All four internal votes remained intact. Edge Function version 1 is active. The live endpoint rejected missing and invalid credentials, and read-only database checks allowed the linked owner and denied an unrelated account.

The supervised batch checked one eligible mod and saved one GTA5-Mods snapshot. Its GTAInside link was reported as unsupported. Cron job 1 was then activated every ten minutes. The supervised HTTPS call succeeded without a shared request queue. Signed-in browser submission remains unverified against the live Edge Function. The Next.js site stays local.