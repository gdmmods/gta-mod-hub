# Universal Identity Handles V1 rollout

Target project `zormnoamfexwnhhajzmx`, branch `creator-page-refactor`. Pending migration `20261111115443_universal_identity_handles.sql`.

## Namespace and compatibility

- Existing personal usernames are registered verbatim. The live audit found three registered usernames and no case-insensitive collisions, invalid names, or reserved-name conflicts. The migration repeats its checks while holding a profiles write lock. Accounts that have yet to set a username can claim one in Profile Settings.
- New handles use 3–32 ASCII letters, digits, dots, underscores, or hyphens, starting with a letter or digit. New handles are stored lowercase. The database reserves system, support, moderation, and route names plus the `modvault` prefix. The authoritative list lives in the migration.
- Personal profile URLs keep their original username. Changing a public handle never changes that route. Creator and team profile URLs continue to use their UUIDs. Authorized personal users and verified creator or team owners can change their public handles. Retired handles, including those of deleted identities, remain reserved. V1 imposes no cooldown.
- The registry keeps identity IDs and ownership private. Public lookups return only the active handle. Existing mention records keep their labels, UUIDs, and destinations. Autocomplete ranks an exact current handle first and still searches legacy display names and personal usernames. Retired handles do not become autocomplete aliases.

## Activation after approval

1. Verify the linked target, the pending version, and the existing Discussions reference view plus lifecycle and ownership functions. Repeat the legacy format, reservation, and case-insensitive collision checks. Stop if any legacy conflict appears.
2. Apply only `supabase/migrations/20261111115443_universal_identity_handles.sql` using the atomic procedure in [Following and Announcements rollout](./following-rollout.md). Record version `20261111115443` and name `universal_identity_handles` in the same transaction.
3. Verify that all existing usernames have matching initial registry rows, the registry has RLS enabled with no direct browser access, and the lookup and mutation grants match the migration. Check that the new version is the only added migration-history entry.
4. With designated signed-in test accounts, check personal and creator claims, team leader authorization, competing claims from separate sessions, same-handle retry, and retirement after a rename. Verify display at desktop and mobile widths and test both exact-handle and legacy-name mention search. Reopen a historical Discussion reference and follow notification after renaming to verify the old destinations.
