# Team archiving and unified discussions rollout

Prepared locally on 31 October 2026 in `C:\Users\rodr_\gta-mod-hub`, branch `creator-page-refactor`. **No live migration applied. No commit, push or deployment.** Existing edits were preserved.

## Audit and decisions

- Deletion was `TeamDangerZone` → `lib/team/deleteTeam.ts` → direct `delete_owned_team(uuid,uuid)` RPC. Both dashboard Team Controls and creator settings mount it. There is no separate deletion HTTP route. The live RPC physically deletes membership rows, clears `teams.creator_id`, deletes the team creator, then the team. The pending discussions FK correctly prevents the creator deletion after it authors a comment, even if the comment is soft-deleted.
- A team has a `teams` operational record and a `creators` publishing identity: `teams.creator_id` ↔ `creators.team_id`. `teams.owner_id` identifies a personal creator; that creator's `owner_id` identifies the account. Approved owner memberships independently prove account control. Team `creators.owner_id` conventionally equals the team UUID. No individual creator is archived or personal account deletion workflow changed.
- Existing `creator_members` approval alone admitted identities into Active Creator, dashboard counts and editor selectors. Lifecycle is now checked independently. Upload authorization already required `teams.status='active'`; database triggers additionally protect service-role content writes. Public directory/search/profile reads remain historical access paths, not publishing eligibility.
- Membership, creator, mod, contribution, comment, activity and notification records are retained. Archive expires pending invitation rows without deleting them; restore does not revive invitations. Retained memberships resume only after validation. Existing public roster reads now include archived teams; private invitation messages/permissions remain governed by their existing access rules.
- Existing team RPCs already guard invitation creation and acceptance against inactive teams. Membership mutations and the access/controls RPCs needed additional lifecycle checks. Invitation acceptance now locks team before invitation, matching archive/create lock order. Archive does not update profile rows while holding the team lock: that would invert the existing profile → team selection lock order. The UI refresh removes the archived choice and clears its saved selection. Offline/stale saved references are rejected by database publishing and selection checks; restore never silently selects the identity.
- Content guards cover creators, team memberships/invitations, creator membership changes concerning the team identity, mods, mod creator links, sources/files, aliases and external identities. Old and new references are checked, preventing reassignment to escape a guard. Existing account/creator foreign-key membership cascades retain their prior behavior; an actual missing parent row is required for that exception, not a caller-supplied bypass flag. Download/like counters on preserved mods still work. New team activity is blocked while archived. Existing activity/alerts/read state are not rewritten or replayed.
- Archived-authored comments remain attributed to the original creator UUID/profile. Creation, editing and author deletion under an archived team identity are blocked. Existing authorized moderation remains available. Public reads continue to enforce published-target and hidden/deleted-content rules. The FK is unchanged: no cascade, nullification, identity reassignment or body copy.
- `delete_owned_team` is replaced with an error-only implementation and client/service-role execute privileges revoked. The unused old TypeScript helper also fails explicitly. A stale client cannot physically delete a team through it.

## Live preflight finding requiring separate review

Read-only inspection of target `zormnoamfexwnhhajzmx` (gdmmods's Project, Frankfurt) found three active teams and no discussion tables. Owner authorization checks passed and no duplicate active member identities were found. **P3AK´D** (`21fefb18-d3d6-42dc-84d5-bf5917369dab`) has a linked team creator whose `owner_id` is an account UUID rather than the team UUID. Archive/restore rejects this inconsistent identity; it does not silently repair it. The existing authorized active-team settings save may still correct owner_id to the team ID; the guard permits that canonical correction while prohibiting reassignment. No such save or repair was performed here. Review and authorize any repair separately. The other two inspected teams satisfy this identity check.

`docs/team-archive-live-audit.json` records the inspected function definitions/policies and aggregate state used for regression fixtures. It is a schema reference, **not a full database backup**. Refresh live state before applying.

## Final behavior

- **Active:** normal authorized publishing, membership, invitations, settings and selectors continue.
- **Archive:** only the verified owner account can act; team/creator identity must be consistent. Existing members need not be removed. The team becomes `archived`, archive time and owner creator ID are recorded, pending invitations expire, normal writes stop, and it drops out of operational selectors/dashboard data. Public historical profile and roster remain readable under existing public-content rules.
- **Archived Teams:** account-wide owner-only management section on the dashboard, independent of Active Creator. It links to the historical profile and provides Restore Team. Failures remain inline; there is no invented conversion to a personal creator.
- **Restore:** revalidates verified owner, reciprocal team identity, owner membership of team identity and every retained active personal member's approved control; rejects duplicate/legacy-owner member rows. Returns the team to `active` and records restoration metadata. Does not recreate membership rows, change capabilities, resend notifications, revive invitations or select a publishing identity. Repeated requests are no-ops.
- `archived_by`/`restored_by` store public owner **creator IDs**, not new public account identifiers. Ownership comes from current verified relationships, never these audit fields or editable profile roles.

## Required migrations and exact approval plan

**Await explicit approval. Do not run `db push`, bulk pending migrations, history repair, or any deployment.**

1. Reconfirm the configured URL/project reference and connected project are **`zormnoamfexwnhhajzmx`**, gdmmods's Project, `eu-central-1`. Refresh relevant definitions/policies/history and stop if they differ from the reviewed baseline. Confirm the pre-existing P3AK´D inconsistency is understood; no automatic repair is included.
2. Take/verify a recoverable database backup using the project's approved backup procedure. Preserve a fresh schema/function/policy/migration-history snapshot. The checked-in audit snapshot is insufficient as a backup.
3. Review and apply only these two files, in this explicit operational order, preferably in one transaction:
   1. `supabase/migrations/20261031103144_team_archive_lifecycle.sql`
   2. `supabase/migrations/20261031100736_unified_discussions.sql` (updated, still unapplied).
   The lifecycle migration disables destructive deletion before discussions become available. Discussions does not depend on a new lifecycle helper, so the filename timestamp order is not a hidden dependency. Explicit application avoids the unrelated pending/timestamp differences.
4. `docs/team-archive-apply.sql` is the reviewable **single-transaction bundle** of exactly those files. It has bounded lock/statement timeouts and refuses already-existing lifecycle/discussion objects or either new history version. It records **only these two original versions**, names and exact SQL in `supabase_migrations.schema_migrations`, in the same transaction. The live history table's columns were inspected before preparing it. A failure rolls back schema and history together. Do not run it against any other project, and do not use it if either migration has already been applied. Regenerate it if a source migration changes; compare the SHA-256 manifest at `docs/team-archive-migration-hashes.json`.
5. After explicit approval and successful application, run `docs/team-archive-validation.sql` and the discussion guide's read-only validation. Compare advisors to the preflight baseline. Private RLS tables intentionally have no direct client policies/grants. Preserve pre-existing team/notification RLS; do not treat unrelated advisories as authorization to change them.
6. Restart/reload the local app and complete authenticated desktop/mobile acceptance before any separately authorized deployment. No live test content is created by the read-only SQL.

## Files and database functions

- SQL: the new lifecycle migration, updated discussion migration, read-only validation, atomic application bundle and hash manifest.
- New/changed lifecycle functions: `set_team_archived`, `get_archived_teams`, `is_creator_operational`, disabled `delete_owned_team`; `set_team_membership`, `respond_to_team_invitation`, `get_my_team_access`, `get_team_members_for_owner`, `get_public_team_members`; private lifecycle/selection/content/activity guards and active-team lookup helpers.
- Discussions: private `write_discussion` and `read_discussions` lifecycle checks; permanent author FK unchanged.
- API/UI: `app/api/team-lifecycle/route.ts`, `components/team/{TeamDangerZone,ArchivedTeams}.tsx`, Team Controls, dashboard and creator settings callback/ownership guard; historical creator profile archive banner.
- Eligibility: `lib/team/operational-creators.ts`, CreatorContext, dashboard data and upload/edit creator lists. Upload HTTP authorization already checks active team status and is retained.
- Tests: `scripts/test-team-archive.mjs`, `scripts/test-team-lifecycle-api.mjs`, discussion fixture updated to model existing team status; existing team/notification/API regressions retained.

## Validation and remaining manual checks

Run from the repository (temporary PGlite runtime is outside application dependencies):

```powershell
$env:MODVAULT_DISCUSSION_TEST_RUNTIME='C:\Users\rodr_\AppData\Local\Temp\modvault-discussion-tests'
$env:MODVAULT_NOTIFICATION_TEST_RUNTIME=$env:MODVAULT_DISCUSSION_TEST_RUNTIME
node scripts/test-team-archive.mjs
node scripts/test-discussions.mjs
node scripts/test-team-lifecycle-api.mjs
node scripts/test-operational-creators.mjs
node scripts/test-team-member-notifications.mjs
node scripts/test-team-membership-model.mjs
node scripts/test-creator-team-invitations.mjs
node scripts/test-discussion-api.mjs
node scripts/test-team-profile-stats.mjs
node scripts/test-team-featured-mods.mjs
npx tsc --noEmit --incremental false
```

The archive test applies the actual files against the discussion fixture plus the captured deployed team functions. It covers the original physical-deletion FK failure, successful archive/restore with that reference retained, forbidden unauthenticated/nonowner/direct status/helper calls, archived content writes and stale identity creation, pending invitation expiration, preserved rows/attribution, restoration validation, operational eligibility, public historical roster, counters and repeated-request notification idempotence. PGlite checks are isolated, not a live multi-session Supabase test.

Browser review could not be completed: computer use stopped because it could not reliably determine the browser URL. No archive/restore UI actions were submitted. After approval/application, manually check:

- Owner vs member/outsider: Archive Team confirmation, inline rejection, Archived Teams listing, historical profile banner and Restore Team.
- Two signed-in tabs and another owner-controlled identity: archived team disappears from publishing/edit/upload/dashboard selectors; stale API/RPC writes fail; refresh clears its saved selection; restore makes it selectable without selecting it automatically.
- Comments before/after archive: original author/profile links and hidden/deleted moderation remain correct; no activity/notification duplication or read-state reset.
- Archive with pending invitations and existing members; old invite acceptance stays expired after restore, new invitation works once, and member capabilities/rows remain unchanged.
- Retained public profiles/roster/mod links, downloads and privacy rules on desktop/mobile. Existing roster presentation derives member portfolios from current published data; this change does not introduce historical snapshots of names or portfolios.
- Real concurrent archive vs publishing/acceptance. Lock ordering is aligned, but isolated PGlite does not prove all multi-session races.

If validation fails, stop and retain diagnostics. Do not drop discussion tables or erase content as rollback. No rollback that destroys new history is authorized.

### Recorded local results

Passed: actual lifecycle/discussion migrations separately and as the exact transaction/history bundle; archive/restore/authorization/content/history/idempotence regressions; discussion SQL identity/notification tests; lifecycle API and operational selector tests; existing team membership, creator-specific invitation, team notification, discussion API/deep-link, team statistics and featured-mod checks; TypeScript; focused lint for new lifecycle code, CreatorContext and new tests. Broader dashboard-hook lint still reports two pre-existing explicit `any` declarations; they were not refactored for this change. Whitespace checked with the repository's normal line-ending configuration.

Live post-migration checks and signed-in browser smoke checks remain pending. The bundle is prepared for approval, not applied.
