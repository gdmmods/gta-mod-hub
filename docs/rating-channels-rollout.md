# Rating channels and creator reputation rollout

Target: `zormnoamfexwnhhajzmx`, gdmmods's Project, Frankfurt.

## Product and security decisions

- Existing account/mod votes become Legacy Ratings and keep their category when edited or moderated. New votes are classified server-side on first insert. The existing vote, moderation, audit, and comment snapshot paths are retained. The old RPC response remains backward-compatible, while the updated UI uses separate channel summaries.
- Eligibility counts three distinct published listings across approved operational creator identities. Primary authors and recorded owners or collaborators qualify. Listings need a title and a release destination or mod file. Drafts, removed records, unpublished listings, and archived team-only contributions are excluded. Published supporter releases can qualify with a release destination. There is no separate placeholder flag in the current schema.
- External snapshots are keyed by mod, platform and listing URL. The read checks the current source association before showing a snapshot. An unsuccessful refresh retains the last successful score and timestamp for that listing.
- The on-demand GTA5-Mods refresh reads published structured five-star metadata from an existing primary or connected source. Run `node scripts/refresh-gta5mods-rating.mjs MOD_UUID SOURCE_URL` with the target Supabase URL and service-role key in the operator's environment. Keep the key private. The operator RPC accepts the exact registered URL and is service-role only. There is no scheduled job. Other platforms stay unavailable unless comparable rating data is verified.
- Reputation records are append-only by operator convention, with fields for contribution, reliability, community and recognition. The public lookup exposes only the latest tier. A later null assessment clears the public tier without erasing history. No tiers are seeded or assigned automatically.
- Rating read requests from cards are grouped into batches of up to 100 mod IDs. Cards omit unrated numeric scores and keep the existing likes and downloads. The detail view shows all current channels and optional Legacy, with internal links to Discussions.

## Application order

1. Reconfirm the target and read-only migration history. Dependencies already verified live are `20261031100736`, `20261031103144` and `20261104090451`. This iteration adds only `20261105095308_rating_channels_and_creator_reputation.sql`. Do not replay the earlier migrations.
2. Obtain the live approval specified in the replacement brief. Apply the exact single migration transactionally and record only version `20261105095308` and its name in migration history. Use bounded lock and statement timeouts. No blanket migration command.
3. Run the read-only validation SQL and compare pre/post rating, history and comment-snapshot counts. The first live preflight found one existing vote, which should appear under Legacy after applying. Check anonymous reads and denied ordinary-user writes. Deploy the app only if separately authorized.
4. Verify the live detail, grid, creator profile and desktop/mobile navigation. No test votes or assessments are required in production. Refresh external scores separately through the operator script when desired.

A failed transaction rolls back the migration and history entry together. After commit, roll back application presentation by reverting its release while keeping the additive schema. Removing the schema would lose newly collected channel classifications, external snapshots and assessment history, so review a corrective migration if necessary.

The latest live preflight used read-only queries. Real multi-session writes, mobile layout and signed-in browser acceptance are separate checks.

