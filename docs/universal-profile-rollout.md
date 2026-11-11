# Universal Profile Foundation rollout

Target project `zormnoamfexwnhhajzmx`, branch `creator-page-refactor`.

The existing identity Following, Social Discovery, and creator relationship migrations are live. The new migration `20261111113433_universal_profile_foundation.sql` remains pending.

1. Confirm the project and check that version `20261111113433`, bucket `profile-images`, and RPC `public.personal_relationship_counts(text)` are absent. Confirm the identity-following indexes, `private.follow_public_mod`, and `storage.foldername` exist.
2. After approval, apply only that file using the atomic procedure in [Following and Announcements rollout](./following-rollout.md). Set the source file to `supabase/migrations/20261111113433_universal_profile_foundation.sql`, version to `20261111113433`, and migration name to `universal_profile_foundation`. The SQL adds five optional or defaulted public profile fields and does not copy profile data between identities.
3. Check the exact history entry, added columns, public image bucket MIME and 5 MB size restrictions, account-scoped upload policy, and execute grants for the counts RPC. Confirm direct reads of `private.follows` remain denied.
4. In the updated local app, use designated test accounts to save a personal profile and a creator profile. Upload a new avatar and banner in each editor, reload, and confirm both sets of images persist independently. Switch Active Creator and verify the personal profile's outgoing counts stay tied to its personal identity. Check the creator, team and account directory destinations at desktop and mobile widths.

Personal user targets are unavailable in the current Following schema. Supporting Follow User later requires a new target reference, identity-target uniqueness and authorization rules, recipient resolution, and a public personal Followers directory. Project targets remain outside this migration.
