import { createSupabaseServerClient } from '@/lib/supabase/server';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function id(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !uuid.test(value)) throw new Error('Invalid discussion identifier.');
  return value;
}
function reply(payload: unknown, status = 200) {
  return Response.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
function failure(error: { code?: string; message: string; details?: string }) {
  const unavailable = ['PGRST202', '42883', '42P01'].includes(error.code ?? '');
  const limited = error.code === 'P0001';
  const wait = limited ? Number(error.details) : 0;
  return reply({ ...(wait > 0 && wait <= 30 ? { cooldownSeconds: wait } : {}), error: unavailable ? 'Discussions are awaiting database setup.' : error.message },
    unavailable ? 503 : limited ? 429 : error.code === '42501' ? 403 : 400);
}

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams;
    const client = await createSupabaseServerClient();
    const mode = q.get('mode') ?? 'target';
    if (mode === 'references') {
      const trigger = q.get('trigger');
      const query = q.get('query') ?? '';
      if ((trigger !== '@' && trigger !== '#') || [...query].length > 100) return reply({ error: 'Invalid reference search.' }, 400);
      const { data: { user } } = await client.auth.getUser();
      if (!user) return reply({ error: 'Sign in to search references.' }, 401);
      const { data, error } = await client.rpc('search_discussion_references', { p_trigger: trigger, p_query: query });
      return error ? failure(error) : reply(data);
    }
    if (['account', 'moderation'].includes(mode)) {
      const { data: { user }, error } = await client.auth.getUser();
      if (error || !user) return reply({ error: 'Sign in to view your discussions.' }, 401);
    }
    const { data, error } = await client.rpc('read_discussions', {
      p_mode: mode, p_identity_type: q.get('identityType'), p_identity_id: id(q.get('identityId')),
      p_target_id: id(q.get('targetId')), p_direction: q.get('direction') ?? 'written',
      p_category: q.get('category') || null, p_page: Number(q.get('page') ?? 1),
      p_limit: Number(q.get('limit') ?? 20), p_comment_id: id(q.get('commentId')),
    });
    return error ? failure(error) : reply(data);
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Could not load discussions.' }, 400);
  }
}

export async function POST(request: Request) {
  // Reject cross-site cookie-authenticated writes before parsing a body.
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return reply({ error: 'Request origin could not be verified.' }, 403);
  if (Number(request.headers.get('content-length') ?? 0) > 400000) return reply({ error: 'Comment is too large.' }, 413);
  try {
    const client = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return reply({ error: 'Sign in to join the discussion.' }, 401);
    const reader = request.body?.getReader();
    const decoder = new TextDecoder();
    let raw = '';
    let size = 0;
    if (reader) {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 400000) {
          await reader.cancel();
          return reply({ error: 'Comment is too large.' }, 413);
        }
        raw += decoder.decode(chunk.value, { stream: true });
      }
      raw += decoder.decode();
    }
    const body = JSON.parse(raw);
    if (!body || !['create', 'edit', 'delete', 'hide', 'restore'].includes(body.action)) return reply({ error: 'Unknown discussion action.' }, 400);
    if (['create', 'edit'].includes(body.action) && (typeof body.body !== 'string' || !body.body.trim() || [...body.body.trim()].length > 4000)) {
      return reply({ error: 'Write between 1 and 4,000 characters.' }, 400);
    }
    if (body.category != null && body.category !== 'mod') return reply({ error: 'This discussion category is not available yet.' }, 400);
    if (body.rating != null && (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5 || body.action !== 'create' || body.parentId != null)) return reply({ error: 'Ratings are only available with top-level comments.' }, 400);
    if (body.references != null && (!Array.isArray(body.references) || !['create','edit'].includes(body.action))) {
      return reply({ error: 'Invalid discussion references.' }, 400);
    }
    if (body.references && (body.references.length || body.action === 'edit')) {
      const { data, error } = await client.rpc('write_referenced_discussion', {
        p_action: body.action, p_comment: id(body.commentId), p_mod: id(body.targetId),
        p_creator: id(body.creatorId), p_parent: id(body.parentId), p_body: body.body.trim(),
        p_rating: body.rating ?? null, p_refs: body.references,
      });
      return error ? failure(error) : reply({ ...data, cooldownSeconds: body.action === 'create' ? 30 : 0 }, body.action === 'create' ? 201 : 200);
    }
    if (body.action === 'create' && body.parentId == null) {
      const { data, error } = await client.rpc('submit_mod_feedback', {
        p_mod_id: id(body.targetId), p_creator_id: id(body.creatorId), p_body: body.body, p_rating: body.rating ?? null,
      });
      return error ? failure(error) : reply({ ...data, cooldownSeconds: 30 }, 201);
    }
    const { data, error } = await client.rpc('write_discussion', {
      p_action: body.action, p_comment_id: id(body.commentId), p_target_id: id(body.targetId),
      p_creator_id: id(body.creatorId), p_parent_id: id(body.parentId),
      p_body: typeof body.body === 'string' ? body.body : null, p_target_type: body.category ?? 'mod',
    });
    if (error) return failure(error);
    // A failed refresh must not turn a committed mutation into a retryable failure.
    const { data: updated } = await client.rpc('read_discussions', {
      p_mode: 'thread', p_target_id: id(body.targetId), p_comment_id: data,
    });
    const item = updated?.items?.find((entry: { id: string }) => entry.id === data) ?? null;
    return reply({ id: data, item, cooldownSeconds: body.action === 'create' ? 30 : 0 }, body.action === 'create' ? 201 : 200);
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Your comment could not be saved.' }, 400);
  }
}
