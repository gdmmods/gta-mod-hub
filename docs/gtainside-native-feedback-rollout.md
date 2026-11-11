# GTAInside native feedback rollout

This update is local pending separate production approval. It preserves the existing first-month schedule, per-mod manual cooldown, provider-specific pauses, and private snapshot writes.

- GTAInside's public listing currently renders separate positive and negative counts in the two native rating controls. The adapter accepts only the allowlisted canonical listing URL and the complete matching pair. Zero is valid. Incomplete or changed markup is reported as unavailable or invalid, and the last valid snapshot remains visible. No vote, login, or download action is made.
- The snapshot table retains its existing source keys, star payloads, and timestamps. A discriminator and two nullable counts store native votes independently. The public reader exposes the recorded primary import URL or the explicit primary source URL. Additional sources appear separately in the tooltip.
- Existing Edge v1 keeps its GTA5-Mods-only claim interface during the upgrade. The revised worker uses the new service-role-only claim interface. The function retains its own authentication and shared lease. Old mods are manual-only and no publication dates or due times are reset.

## Authorized production sequence

1. Confirm project `zormnoamfexwnhhajzmx`, migration prerequisites, and a baseline of snapshot types, internal votes, and active Cron job. Apply only `20261105195510_gtainside_native_external_feedback.sql` in a bounded transaction, recording exactly that version. Confirm star values/counts/timestamps and internal votes are preserved.
2. Deploy only Edge `external-rating-sync`, retaining its existing JWT and cron authentication behavior. Include `worker.mjs`, the canonical URL helpers, and both provider parsers. Verify unauthenticated rejection. Run one authorized manual refresh or a supervised one-item due batch if an eligible GTAInside source is present.
3. Replace the existing named Cron job with `docs/external-rating-sync-cron.sql`. It retains the ten-minute cadence and due-only gate while allowing either unpaused provider. Validate the existing job name is reused, no duplicate scheduler exists, and older mods remain manual-only.
4. Use the updated local Next.js app for presentation checks. Roll back worker behavior to the former Edge version and restore the previous Cron command if necessary. The additive snapshot migration can stay in place to preserve native history.

Observed listing: https://www.gtainside.com/gta5/cars/other/223785-declasse-tulip-ss-add-on-tuning

