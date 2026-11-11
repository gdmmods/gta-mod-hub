# Universal discussion references rollout

Target: Supabase project `zormnoamfexwnhhajzmx` in Frankfurt. This iteration is prepared locally and awaits explicit approval for live migration.

## Contract

The existing comment body remains plain text. A private sidecar stores unique entity kind/ID pairs, Unicode code-point spans, the original label, and active state. Editors convert textarea UTF-16 offsets before sending. Search returns public labels, images, and routing context. A literal @ or # token remains text unless the editor selected a result. The current registry resolves user, creator, team, and published public or early-access mod references. Future kinds can extend the registry and recipient resolver without separate editors or Activity Hubs.

The existing discussion owner resolver supplies personal and team recipients. Mod references also include registered mod co-owners. The writer excludes the author and consolidates by recipient account and comment, reusing any existing reply or mod-owner event. A newly introduced entity can notify on edit. A historical key, including a removed and re-added key, never resends for that comment. Old notification recipients are retained. Unavailable targets render a safe label without a link and their reference names are omitted from notification enrichment.

A 30-second per-account, per-mod check applies under the existing database advisory lock to all comment writes, including old RPC clients. A failed post or rating-plus-comment rolls back without consuming the cooldown. Edits and rating-only submissions do not start it. Existing global discussion limits remain in effect.

## Rollout

1. Confirm the live project, baseline row counts and migrations for unified discussions and discussion feedback. Review only `20261105203056_universal_discussion_references.sql`.
2. After approval, apply that single migration in one bounded transaction and record only its version and exact SQL in migration history. Do not bulk-push pending migrations.
3. Run `docs/discussion-references-validation.sql` read-only. Confirm the new table has RLS, private rows are inaccessible, authenticated clients have only the intended wrappers, and the old comment, notification, and rating counts match baseline.
4. Reload the local app. Using approved test accounts or isolated data, check selection, cross-identity cooldown, exact deep links, and the unread count. A production write test needs authorization for the chosen test accounts and data.
5. No new environment variables or scheduled jobs are required. The previous app can still read and post comments after the migration. If an application rollback is needed, retain the sidecar and event history. Review a corrective migration if SQL changes are required.

Source compatibility: the new autocomplete and reference edits require the migration. Existing comments need no conversion. The 30-second timer is enforced by the database after rollout, regardless of browser version.

