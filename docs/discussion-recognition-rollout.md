# Discussion Recognition V1 rollout

Target `zormnoamfexwnhhajzmx` on `creator-page-refactor`. The only new migration is `20261111121356_discussion_recognition.sql`.

Recognition reuses the existing announcement ownership resolver. Verified primary owners, recorded co-owners, and verified leaders of mod-owning teams can award or revoke. An active award is unique per comment. Each award and revocation retains timestamps and actor attribution. A retry using the same award ID does not recreate a revoked award. Team-authored comments notify the verified active team owner when one can be resolved. Personal and creator-authored comments notify the authenticated account recorded on the comment.

1. Confirm the linked project, that version `20261111121356` is absent, and that the existing Discussions, team lifecycle and Following migrations are recorded. Confirm `private.announcement_creator`, `private.follow_public_mod`, the private discussion table, and the Activity Hub tables are present.
2. After explicit approval, apply only `supabase/migrations/20261111121356_discussion_recognition.sql` with the atomic procedure in [Following and Announcements rollout](./following-rollout.md). Record version `20261111121356` and name `discussion_recognition` within the same transaction.
3. Confirm exactly one new migration-history entry. Check RLS and browser-role grants on the private recognition table, the partial unique index, the activity guard, and the read and write RPC grants. Confirm activation generated no recognition notifications.
4. Use designated accounts in the updated local app. Award a comment and a reply, retry the award, revoke it, and verify profile counts and Activity Hub deep links. Test an unauthorized account, a creator's alternate identity, a team-owned mod and a team-authored comment. Verify hidden or deleted entries disappear from public recognition lists while audit rows remain.
