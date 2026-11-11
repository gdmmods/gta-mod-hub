# Discussion UX, notification presentation and mod ratings

Prepared 4 November 2026 in `C:\Users\rodr_\gta-mod-hub`, branch `creator-page-refactor`. **Migration applied and verified on 4 November 2026. No commit, push or deployment. No production test posts/votes or P3AK´D repairs.** Existing unrelated work was preserved.

## Audit

The live history on `zormnoamfexwnhhajzmx` (gdmmods's Project, Frankfurt / `eu-central-1`) contains `20261031100736_unified_discussions` and `20261031103144_team_archive_lifecycle`. Existing live read/write discussion functions and team lifecycle helpers were inspected read-only. No rating/review/score/reputation columns or tables were found in the public/private application schemas.

The automatic navigation came from `ModDiscussions.mutate`: every successful create called `setFocus(payload.id)`, reset the page and replaced the URL with that comment. The single `replyTo` state also moved reply composition to the top composer. Fetching replaced the current list, and switching modes discarded the visible conversation.

The bell and Activity Hub had separate generic title/summary branches. Existing event metadata had comment/mod IDs but no publishing-name or mod-title snapshots. Delivery was already account-wide and deduplicated; it was reused rather than replaced.

Existing personal/creator profile histories and account-wide history use the same `read_discussions` RPC. Navbar identity, approved memberships, immutable author/context fields, published-target checks, one-level replies, rate limits, private storage, team restrictions, deep-link checks and notification read state are preserved.

## Implemented behavior

- Main roots stay newest-first. Successful posting merges the returned item above the loaded roots, clears the composer and reports success without navigation or a whole-page reload. Load more appends/deduplicates roots. Reply composition is beneath the selected parent, uses separate text state, and submitted replies are merged beneath their parent without changing view mode. Root and reply collections remain distinct.
- Replies load in chronological pages of twenty. View thread explicitly pushes the focused URL. Direct comment/reply URLs resolve to the parent thread and retain the highlighted entry even when it is outside the usual first page. Focused rendering sorts loaded replies chronologically. Back to all comments restores the retained main collection. Fetch cancellation/version checks prevent stale responses overwriting locally saved items. Explicit reload remains available for external changes.
- Editing, soft deletion, hiding and restoration update loaded state. Removed bodies are not copied into notifications. Archived-authored comments remain read-only to their authors, and existing authorized moderation still works. Navbar selection is the only publishing selector; personal accounts without creators remain supported.
- `discussionPresentation` is shared by the bell and Activity Hub. It distinguishes parent-author replies from mod-owner notices and identifies the original publishing identity and mod. New events store structured publishing identity/name, mod-title, parent-root and recipient-reason metadata; they never store comment bodies/previews. Existing events are enriched in one bounded RPC per 100 IDs at read time, restricted to that account's notifications, without rewriting historical rows or switching author identities. Unavailable/hidden/deleted content has a clear fallback. Team formatting/categories/unread behavior are unchanged.
- A native radio-based five-star selector supports touch/mouse and standard keyboard radio navigation, outlined/selected stars and hover preview. Rating is optional. Rating-only save/update is a separate explicit button and never creates a comment. Selecting a score can instead attach it atomically to a new top-level comment. Replies cannot submit ratings. Existing rating is shown to its account. Mod owners see an explanation instead of a rating control.
- The mod discussion header displays a reusable aggregate: average to one decimal and valid count, or Not rated yet. No votes are inferred from older comment text such as `5*`.

## Rating architecture and authorization

All new storage is private with RLS enabled and direct client privileges revoked:

- `private.mod_ratings`: UUID, account owner, mod, integer 1–5 value, validity/moderation reason, creation/update times; database unique `(account_id,mod_id)` and value check. Different personas cannot produce extra votes.
- `private.mod_rating_totals`: per-mod sum/count, maintained transactionally by rating changes and validity transitions; public summary reads do not scan the complete rating table.
- `private.mod_rating_history`: append-only through the internal mutation trigger, with old/new score/validity, authenticated actor, time and reason. No reputation calculation is implemented.
- `private.discussion_rating_submissions`: immutable score-at-submission association for a top-level comment. It is not a vote. Later rating changes never rewrite historical badges. Comment soft deletion preserves the independent rating. Invalidated ratings' snapshots are omitted from public reads. Comment badges deliberately do not expose an account-linked rating UUID.

Public RPCs are invokers over private definer implementations with empty search paths and explicit ownership checks. `submit_mod_feedback` atomically saves a comment plus optional rating, or a rating alone. It accepts no caller-supplied account ID. Publishing selection must match the persisted navbar identity, membership must still be approved, and archived team identities fail lifecycle checks. Scores on the primary owner's or any explicitly linked owner's mod are rejected independently of persona. Invalidated ratings cannot be re-enabled by their author changing score.

Only explicitly provisioned site moderators in the existing `private.discussion_moderators` table may invalidate/restore a rating with a reason. Mod ownership alone does not let an owner suppress low scores. The mod-page moderation section is paginated and reveals rating IDs/values/state/reasons only to that moderator; ordinary public summaries reveal no rating account list. No new moderator was provisioned.

## Files changed by this iteration

- `components/discussions/ModDiscussions.tsx`, `DiscussionCard.tsx`; `lib/discussions/types.ts`, new `thread-state.ts`.
- New `components/ratings/StarSelector.tsx`, `ModRatingSummary.tsx`, `lib/ratings/types.ts`, `app/api/mod-ratings/route.ts`.
- `app/api/discussions/route.ts`: atomic top-level feedback, reply-rating rejection, return saved items for local merging.
- `lib/notifications/getNotifications.ts`, new `discussionPresentation.ts`; `components/notifications/NotificationDropdown.tsx`, `app/activity/page.tsx`.
- New incremental migration, this report and `docs/discussion-feedback-validation.sql`.
- New `scripts/test-mod-feedback.mjs`, `test-feedback-ui.mjs`, `test-rating-api.mjs`; updated `test-discussion-api.mjs` for the intentional new RPC contract.

Neither applied migration file was edited. CreatorContext/team lifecycle/profile/history routes were reused.

## Verification results

Passed:

- Actual new SQL applied in isolated PGlite over the existing discussion/team fixture and captured team functions: atomic rollback, optional/rating-only submission, constraints/uniqueness, account/identity controls, owner/co-owner rejection, preserved snapshots, comment-deletion independence, cached totals, moderation/history, direct-access denial, archived-team restrictions, reply ordering/pagination, identity-aware recipient metadata, no self/duplicate notification fan-out, and recipient-only event enrichment.
- Actual React component interactions with a temporary React 19.2.4 renderer: newest-first insertion, preservation of loaded root pages, inline replies in the parent container, no navigation after mutation, explicit thread/back, direct-link scrolling, aggregate updates and rating-only requests. The test renderer emits its upstream deprecation notice; it is a test-only temporary dependency and no package/lockfile was changed.
- Rating/discussion API tests: verified auth, same-origin writes, identifiers/value validation, no spoofed account field, reply-rating rejection, moderation dispatch, error/setup/rate responses and uncached reads.
- Existing team notification, team membership, creator-specific invitation, team archive, discussion SQL and discussion API/deep-link regressions.
- TypeScript, focused lint on the changed discussion/rating/API/helpers/tests, and normal repository whitespace checks. Existing uncommitted work was preserved.

Browser review was read-only in the existing signed-in local Brave session on the Ferrari J50 page. The new main list/layout, original author links, navbar identity, inline reply composer with other roots retained, explicit thread view and Back control were inspected. No live comment/rating/moderation/team/ownership actions were submitted. Ratings show the explicit setup message until migration approval; inline reply loading needs the new `replies` RPC mode. The new notification enrichment also requires the migration, so old live notices retain fallback descriptions during this local preparation state.

Still pending: actual signed-in posting/voting/moderation against the applied new Supabase schema, two-account/identity switching and mobile/touch/keyboard browser acceptance, and multi-session concurrency/load testing. PGlite and component tests do not prove production network timing or true concurrent sessions. Root pagination retains the existing offset model; simultaneous external insert/delete operations can shift later page boundaries, while already-loaded client items are retained/deduplicated. Use reload to reconcile external moderation/deletions.

## Exact migration approval/application plan

**Do not apply automatically.** The only new migration is:

`supabase/migrations/20261104090451_discussion_ux_notifications_mod_ratings.sql`

1. Reconfirm target `zormnoamfexwnhhajzmx`, name and region. Refresh relevant live definitions/history and check that this new version, four tables, new functions and trigger do not already exist. Verify the two previous migrations remain applied. Preserve the known P3AK´D inconsistency; no repair is included.
2. Verify a usable recovery point/logical backup and save a pre-application schema/policy/function/history snapshot. Read/review this single incremental migration. No old migrations or blanket pending set are authorized.
3. After explicit approval, apply only this file transactionally with bounded lock/statement timeouts and record this single version through the chosen migration workflow. If using SQL Editor, history is not automatic; record only `20261104090451` with name `discussion_ux_notifications_mod_ratings` and the exact file SQL in the same controlled transaction. Do not modify earlier history rows or reuse the older two-migration archive bundle.
4. Run `docs/discussion-feedback-validation.sql` read-only and compare relevant advisors/grants. New tables intentionally have RLS with no direct user policies. Existing team/notification policies must remain unchanged.
5. Reload/restart the local app and perform the pending signed-in acceptance checks before any separately approved deployment. Do not create production test votes/posts without appropriate test-account authorization. Do not infer old ratings or replay historical notifications.

If application or validation fails, stop and retain diagnostics. No destructive rollback or unrelated repair is authorized. There is no product/architecture decision blocking the prepared implementation; live application awaits approval.

## Live application record — 4 November 2026

Applied version `20261104090451`, name `discussion_ux_notifications_mod_ratings`, to verified project `zormnoamfexwnhhajzmx` (gdmmods's Project, eu-central-1). The user explicitly waived backups for this beta project. The verified source SQL and its sole original-version migration-history entry executed together in one transaction with lock/statement timeouts; the command completed successfully. No unrelated versions were applied.

Live validation passed: four private RLS tables, score range and account/mod uniqueness constraints, public invoker/private definer function boundaries with fixed search paths, denied direct/anonymous writes, aggregate consistency, no self/duplicate discussion notifications, public unrated summary and inline reply reads. Existing row counts remained: comments 5, teams 3, memberships 5, invitations 6, notifications 12, activity events 17. Ratings initially 0, as intended. Isolated feedback SQL, rating/discussion APIs and React interaction tests were rerun successfully after application.

The database integration is applied; refresh the local application. No application deployment occurred. Real browser posting/voting/moderation, mobile and concurrent-session acceptance remain unperformed; no production test data was created. P3AK´D was untouched. Earlier preparation/approval instructions above are retained as the rollout record, not an instruction to reapply.
