import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  new URL("../supabase/migrations/20261018131942_protected_click_analytics.sql", import.meta.url),
  "utf8",
);

function functionBody(name) {
  const start = sql.indexOf("create or replace function public." + name);
  assert.notEqual(start, -1, "migration defines " + name);
  const end = sql.indexOf("$$;", start);
  assert.notEqual(end, -1, name + " function body closes");
  return sql.slice(start, end);
}

assert.match(sql, /alter table public\.mod_click_events enable row level security/i);
assert.match(sql, /revoke all on table public\.mod_click_events from public, anon, authenticated/i);
assert.match(sql, /grant all on table public\.mod_click_events to service_role/i);
assert.match(sql, /revoke all on table public\.mod_click_totals from public, anon, authenticated/i);
assert.match(sql, /grant select on table public\.mod_click_totals to anon, authenticated/i);
assert.match(sql, /revoke all on table analytics_private\.mod_click_target_totals from public, anon, authenticated, service_role/i);
assert.match(sql, /public\.mods.*m\.status = 'published'.*m\.visibility in \('public', 'early_access'\)/s);

const route = readFileSync(new URL("../app/api/outbound-click/route.ts", import.meta.url), "utf8");
assert.match(route, /supabaseAdmin\.rpc\("record_mod_click"/);
assert.match(route, /!isCreatorSelfClick\(user\?\.id, creatorOwnerId\)/);

const recorder = functionBody("record_mod_click");
assert.match(recorder, /security definer/i);
assert.match(recorder, /set search_path = ''/i);
assert.match(recorder, /current_setting\('request\.jwt\.claim\.role', true\).*service_role/s);
assert.match(recorder, /p_target_url = v_download_url/);
assert.match(recorder, /p_target_url = v_source_url/);
assert.match(recorder, /p_target_url = v_creator_backup_url/);
assert.match(recorder, /where e\.event_id = p_event_id/);
assert.match(recorder, /interval '30 minutes'/);
assert.match(recorder, /interval '1 hour'/);
assert.match(recorder, /hashtextextended\(p_session_hash, 0\)/);
assert.doesNotMatch(recorder, /p_session_hash \|\| p_mod_id/);
assert.match(recorder, />= 60/);
assert.match(recorder, /interval '90 days'/);
assert.match(recorder, /on conflict \(mod_id, action_type\).*do update set click_count = public\.mod_click_totals\.click_count \+ 1/s);
assert.match(sql, /insert into public\.mod_click_totals \(mod_id, action_type, click_count\)\s*select id, 'download', downloads\s*from public\.mods\s*where downloads > 0\s*on conflict \(mod_id, action_type\)\s*do update set click_count = excluded\.click_count/is);
assert.match(sql, /revoke execute on function public\.increment_downloads\(uuid\) from public, anon, authenticated/i);

console.log("Protected click analytics migration contract checks passed.");
