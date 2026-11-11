# Discussion foundation: audit and rollout

Audited 31 October 2026 against `C:\Users\rodr_\gta-mod-hub`, branch `creator-page-refactor`, and read-only inspection of Supabase project `zormnoamfexwnhhajzmx`. Existing uncommitted team, notification, dashboard and stylesheet edits were preserved. No commit, push, deployment or live database mutation was performed.

## Audit findings and implementation decisions

- The live public schema had no comments/discussions tables. `components/Tabs.tsx` has a legacy placeholder, but mod details actually render `components/mod/ModTabs.tsx`. Discussions are mounted immediately below those existing mod information tabs, with directly addressable comment anchors.
- Personal profiles live at `/profile/[username]`; creator profiles at `/creator/[id]`. They now share the same Recent Discussions component, with three authored entries, expansion to ten, context links, and public identity-specific histories at `/discussions` beneath each profile route. Creator placement is between the hero and Featured Creations. Empty recent sections disappear.
- The shared navbar context previously selected creators only and silently chose the first creator when the saved selection was null. Null now intentionally means personal identity; approved `creator_members` remains the creator eligibility rule. The stored selection is verified again in PostgreSQL when posting. Other browser tabs with a stale selection receive a clear error rather than publishing under a different identity.
- `profiles.role` is writable by its account under current grants/RLS, so it is unsafe as moderation authority. Discussion moderation is limited to the actual mod creator owner (including a team's leader account) and explicitly provisioned rows in `private.discussion_moderators`. No editable profile role or JWT user metadata authorizes moderation.
- Existing mod SELECT policies are permissive. The new discussion read/write functions independently require a published mod, so comments cannot expose unpublished targets. This does not change existing mod policies.
- Existing activity INSERT policy accepts any authenticated account. A narrowly scoped trigger rejects direct insertion of discussion event types/metadata through that path. Discussion creation writes its activity and notifications atomically. Existing team events and notification policies stay intact.
- Notifications remain account-wide. Mod creator owner and parent author are unioned, self excluded and account duplicates collapsed, preferring the reply identity on overlap. Unclaimed creators have no owner account to notify; imported `mods.created_by` is not treated as creator ownership. Team mods resolve to the team's leader account. Events carry comment/target/recipient identity IDs, never comment bodies.
- Discussion storage lives in `private`, with RLS enabled and all direct client table privileges revoked. Public RPC wrappers are invokers; private definer implementations have an empty search path, fixed operations and explicit auth/ownership checks. Public reads expose publishing identity, not a creator comment's underlying account ID. No service-role secret is used by the web app.
- Categories are constrained to mod/asset/knowledge/showcase in storage. Only mod writes are enabled. Filters show All categories and Mods until other target integrations exist. No private-message system or inactive category pages were built.

## Behavior and limits

Comments and replies use permanent publishing identity and account ownership. Edits change only the body; deletion removes its body. Replies are one level and must target a published root on the same mod. Public histories include authored roots and replies on both own and other mods, newest `created_at` first with ID as a stable tie-breaker. Hidden/deleted entries are excluded from public histories; a deleted root has a body-free tombstone in its thread when visible replies remain. Hiding a root hides its thread; restoring it reveals any replies not themselves hidden/deleted.

Full histories and the private Communication Hub use 20 entries/page. Recent Discussions fetches at most ten, showing three initially. The private hub filters owned identity and Written by me / Replies received independently of the navbar's publishing selection. Reply notifications link to the original comment; a deep-linked reply is included on the first thread page even in a large thread. Links to removed content give an unavailable state.

The database serializes writes per account across identities and targets: at most five new posts/minute, fifty/hour, and thirty total changes/minute. Bodies are plain text, 1–4,000 characters. Comments never render HTML. Browser writes require the same origin and a verified server session; RPCs independently enforce all data rules.

## Changed source groups

- `supabase/migrations/20261031100736_unified_discussions.sql`: private tables, indices, privileges/RLS, read/write RPCs, event integrity trigger.
- `app/api/discussions/route.ts`: validated authenticated writes and public/private reads, no-store responses and inline-friendly errors.
- `lib/discussions/types.ts`, `components/discussions/*`: shared cards, histories, mod composer/thread/moderation interface and safe deep links.
- `app/discussions/page.tsx`, `app/creator/[id]/discussions/page.tsx`, `app/profile/[username]/discussions/page.tsx`: private hub and public identity histories.
- `app/contexts/CreatorContext.tsx`, `components/navbar/CreatorProfileSwitcher.tsx`: explicit personal publishing selection alongside Active Creator.
- Existing mod/profile pages, navbar menus, `app/activity/page.tsx` and `components/notifications/NotificationDropdown.tsx`: focused mounts, entry links and comment destinations. Pre-existing edits in the activity/notification files were retained.
- `scripts/test-discussions.mjs`, `scripts/test-discussion-api.mjs`: isolated SQL behavior and API/deep-link checks.

## Apply after review

**Superseded application plan:** apply only after explicit approval using [team-archiving-rollout.md](team-archiving-rollout.md). The prepared team lifecycle migration disables physical team deletion while preserving creator identities and the discussion author foreign key. Both migrations remain unapplied.

The exact approved bundle is `docs/team-archive-apply.sql`: lifecycle `20261031103144_team_archive_lifecycle.sql`, then this updated `20261031100736_unified_discussions.sql`, in one transaction with only those two original migration history versions recorded. Do not bulk push pending migrations or repair unrelated timestamp differences. Verify a recoverable backup and refresh target schema/history before applying.

Archived team identities cannot create/edit/delete their authored comments. Read-only history keeps the original creator UUID, profile link and existing privacy/moderation rules. Authorized moderation is preserved. Active Creator eligibility separately checks team lifecycle; a stale saved selection cannot publish.

### Read-only validation SQL

```sql
select to_regclass('private.discussion_comments') as comments,
       to_regclass('private.discussion_moderators') as moderators,
       to_regclass('private.discussion_mutations') as rate_ledger;

select n.nspname,c.relname,c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='private' and c.relname like 'discussion_%';
-- All three tables: relrowsecurity = true.

select has_table_privilege('anon','private.discussion_comments','SELECT') as anon_direct_read,
       has_table_privilege('authenticated','private.discussion_comments','INSERT') as direct_insert,
       has_table_privilege('authenticated','private.discussion_comments','UPDATE') as direct_update,
       has_table_privilege('authenticated','private.discussion_comments','DELETE') as direct_delete,
       has_table_privilege('authenticated','private.discussion_moderators','INSERT') as self_promote;
-- All false.

select has_function_privilege('anon','public.write_discussion(text,uuid,uuid,uuid,uuid,text,text)','EXECUTE') as anon_write,
       has_function_privilege('authenticated','public.write_discussion(text,uuid,uuid,uuid,uuid,text,text)','EXECUTE') as signed_in_write,
       has_function_privilege('anon','public.read_discussions(text,text,uuid,uuid,text,text,integer,integer,uuid)','EXECUTE') as public_read;
-- false, true, true.

select n.nspname,p.proname,p.prosecdef,p.proconfig
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where p.proname in ('read_discussions','write_discussion','discussion_owner','guard_discussion_events')
order by n.nspname,p.proname;
-- Public read/write wrappers are invokers; private read/write/owner implementations
-- are definers with search_path="". Event guard is an invoker.

select tgname,pg_get_triggerdef(oid)
from pg_trigger where tgrelid='public.activity_events'::regclass
and tgname='guard_discussion_events';

select public.read_discussions(p_mode=>'target',p_target_id=>m.id)
from public.mods m where status='published' limit 1;
-- Valid JSON with items/hasMore/canModerate, including an empty list initially.

select profile_id,activity_event_id,count(*)
from public.notifications
where activity_event_id in (
  select id from public.activity_events where metadata ? 'discussionCommentId'
)
group by profile_id,activity_event_id having count(*)>1;
-- Zero rows.

select c.id,count(n.id) filter (where n.profile_id=c.author_account_id) as self_notifications
from private.discussion_comments c
join public.activity_events e on e.metadata->>'discussionCommentId'=c.id::text
join public.notifications n on n.activity_event_id=e.id
group by c.id having count(n.id) filter (where n.profile_id=c.author_account_id)>0;
-- Zero rows.
```

Moderators are optional; mod owners can already hide/restore their mod's discussions. Provision any site moderator only through an approved administrative SQL change to `private.discussion_moderators(profile_id)`, never from a public settings form. No moderator account was provisioned in this task. The rate ledger can be periodically pruned by deleting entries older than a day; retain at least the most recent hour. No scheduler was added.

## Verification

Run from the canonical repository:

```powershell
npm install --prefix "$env:TEMP/modvault-discussion-tests" --no-save --package-lock=false @electric-sql/pglite@0.3.14
node scripts/test-discussions.mjs
node scripts/test-discussion-api.mjs
npx tsc --noEmit --incremental false
npx eslint app/api/discussions/route.ts app/discussions/page.tsx components/discussions lib/discussions app/contexts/CreatorContext.tsx components/navbar/CreatorProfileSwitcher.tsx "app/creator/[id]/discussions/page.tsx" "app/profile/[username]/discussions/page.tsx"
node scripts/test-creator-team-invitations.mjs
node scripts/test-team-membership-model.mjs
$env:MODVAULT_NOTIFICATION_TEST_RUNTIME = Join-Path $env:TEMP 'modvault-discussion-tests'
node scripts/test-team-member-notifications.mjs
```

The SQL tests apply the actual migration to an isolated PGlite PostgreSQL instance with fixture versions of the audited pre-existing tables and roles. They test both allowed and forbidden operations. They do not replace a Supabase integration run against the applied schema. No application dependency or lockfile was changed for the test runtime.

### Manual acceptance after migration

Use two accounts, with two creator identities on one account, plus an account without creators. Publish personal/A/B comments on own and others' mods; reply; switch identity and edit an older comment. Confirm permanent identity, correct profile histories, latest 3/expand 10 and 20/page. On a thread with more than twenty replies, follow a deep link to an old reply. Verify private hub identity/direction/category filters, notification recipients and no self/duplicate alerts. Hide/restore a root and a reply, then delete a root and confirm no removed body appears in profiles, hub or alerts. Attempt an unauthorized write directly via RPC. Confirm team invitations, accept/decline/leave and notification read state still work, including on mobile.

Browser review during implementation covered signed-out Communication Hub and the mod discussion setup state, plus public profile/history availability. Populated signed-in browser flows remain pending application of the migration and an authenticated test session. The new API responds 503 with a clear setup message until the migration is applied; empty/unconfigured recent sections stay hidden on established profiles.
