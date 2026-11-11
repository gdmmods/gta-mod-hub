import { normalizeGta5ModsProjectUrl, normalizeGtaInsideProjectUrl } from '../../../lib/connectors/sourceProjectUrl.ts';
import { parseGta5ModsRating } from '../../../lib/ratings/gta5mods-rating.mjs';

import { parseGtaInsideVotes } from '../../../lib/ratings/gtainside-votes.mjs';

async function retrieve(url, deadline, parse) {
  try {
    const response = await fetch(url, {
      redirect: 'error', cache: 'no-store',
      signal: AbortSignal.any([deadline, AbortSignal.timeout(8000)]),
    });
    if (response.status === 429 || response.status === 403 || response.status === 401) {
      const header=response.headers.get('retry-after');
      const seconds=header && /^\d+$/.test(header) ? Number(header) : header ? Math.ceil((Date.parse(header)-Date.now())/1000) : 0;
      return { status: response.status === 429 ? 'rate_limited' : 'denied',
        retryAfter: Number.isFinite(seconds) ? Math.max(0,Math.min(2147483647,seconds)) : 0 };
    }
    if (response.status === 404 || response.status === 410) return { status: 'unavailable' };
    if (!response.ok) return { status: 'failed' };
    if (!response.headers.get('content-type')?.includes('text/html') || !response.body) return { status: 'invalid' };
    const reader = response.body.getReader();
    let size = 0;
    let html = '';
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2_000_000) {
        await reader.cancel();
        return { status: 'invalid' };
      }
      html += decoder.decode(value, { stream: true });
    }
    return parse(html + decoder.decode());
  } catch {
    return { status: 'failed' };
  }
}

export async function runRatingJob(rpc,modId,account,batchDeadline) {
  const claim=await rpc('claim_external_feedback_sync',{p_mod:modId??null,p_account:account??null});
  if (claim.status!=='claimed') return claim;
  const cutoff=claim.automaticUntil ? Date.parse(claim.automaticUntil) : Infinity;
  const deadlines=[AbortSignal.timeout(25_000)];
  if (batchDeadline) deadlines.push(batchDeadline);
  if (Number.isFinite(cutoff)) deadlines.push(AbortSignal.timeout(Math.max(0,Math.min(25_000,cutoff-Date.now()))));
  const deadline=AbortSignal.any(deadlines);
  const results=[];
  const fetched=new Map();
  const blocked=new Set();
  for (const source of claim.sources) {
    if (Date.now()>=cutoff) break;
    if (source.paused || blocked.has(source.platform)) {
      results.push({...source,status:'paused'});
      continue;
    }
    const gtaInside=source.platform==='gtainside';
    const url=source.platform==='gta5mods'?normalizeGta5ModsProjectUrl(source.url)
      :gtaInside?normalizeGtaInsideProjectUrl(source.url):null;
    let result=url?fetched.get(url):{status:'unsupported'};
    if (url && !result) {
      if (fetched.size) await new Promise(resolve=>setTimeout(resolve,1200));
      if (Date.now()>=cutoff) break;
      result=deadline.aborted?{status:'failed'}:await retrieve(url,deadline,gtaInside?parseGtaInsideVotes:parseGta5ModsRating);
      fetched.set(url,result);
    }
    results.push({...source,...result});
    if (['rate_limited','denied'].includes(result.status)) blocked.add(source.platform);
  }
  return rpc('finish_external_rating_sync',{p_mod:claim.modId,p_token:claim.token,p_results:results});
}
