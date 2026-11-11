import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runRatingJob } from '../supabase/functions/external-rating-sync/worker.mjs';

const url='https://www.gta5-mods.com/vehicles/fixture';
const modId='00000000-0000-0000-0000-000000000020';
const token='a'.repeat(64);
const inside='https://www.gtainside.com/gta5/cars/12-fixture';
const calls=[];
let handler;
let authId=null;
let claim={status:'idle'};
let provider;
const realFetch=globalThis.fetch;
globalThis.Deno={env:{get:key=>key==='SUPABASE_URL'?'https://test.supabase.co':'test-key'},serve:fn=>{handler=fn}};
globalThis.fetch=async(input,init)=>{
  const target=new URL(input);
  if(target.href===url||target.href===inside){
    assert.equal(init.redirect,'error');
    calls.push(['provider']);
    return typeof provider==='function'?provider():provider;
  }
  if(target.pathname==='/auth/v1/user')return authId?Response.json({id:authId}):Response.json({}, {status:401});
  const name=target.pathname.split('/').at(-1);
  const body=JSON.parse(init.body);
  calls.push([name,body]);
  if(name==='authorize_external_rating_cron')return Response.json(body.p_token===token);
  if(name==='claim_external_feedback_sync')return Response.json(claim);
  if(name==='finish_external_rating_sync')return Response.json({status:body.p_results.find(r=>r.status!=='paused')?.status??'expired'});
  throw Error(target.href);
};
try{
  await import('../supabase/functions/external-rating-sync/index.mjs');
  const invoke=(headers={},query='')=>handler(new Request('https://test.supabase.co/functions/v1/external-rating-sync'+query,{method:'POST',headers}));
  assert.equal((await invoke()).status,401);
  assert.equal((await invoke({Authorization:'Bearer invalid'},'?modId='+modId)).status,401);
  assert.equal((await invoke({'x-modvault-cron':'b'.repeat(64)})).status,401);
  assert.deepEqual(await (await invoke({'x-modvault-cron':token})).json(),{results:['idle']});
  assert.ok(!calls.some(([name])=>name==='provider'));
  authId='00000000-0000-0000-0000-000000000001';
  claim={status:'forbidden'};
  assert.equal((await invoke({Authorization:'Bearer user'},'?modId='+modId)).status,403);
  assert.equal(calls.at(-1)[1].p_account,authId);
  claim={status:'claimed',modId,token:'lease',sources:[{platform:'gta5mods',url}]};
  provider=new Response('',{status:429,headers:{'Retry-After':'7200'}});
  assert.equal((await invoke({Authorization:'Bearer user'},'?modId='+modId)).status,429);
  assert.equal(calls.at(-1)[1].p_results[0].retryAfter,7200);
  provider=new Response('',{status:403});
  assert.equal((await invoke({Authorization:'Bearer user'},'?modId='+modId)).status,429);
  assert.equal(calls.at(-1)[1].p_results[0].status,'denied');
  provider=new Response(readFileSync(new URL('../gta5mods-sample.html',import.meta.url),'utf8'),{headers:{'content-type':'text/html'}});
  assert.equal((await invoke({Authorization:'Bearer user'},'?modId='+modId)).status,200);
  assert.equal(calls.at(-1)[1].p_results[0].value,4.86);
  const starClaim=claim;
  claim={...claim,sources:[{platform:'gta5mods',url,paused:true},{platform:'gtainside',url:inside}]};
  provider=new Response('<button class="ratingButton" value="1"><i class="fa-thumbs-up"></i> 0</button><button class="ratingButton" value="-1"><i class="fa-thumbs-down"></i> 3</button>',{headers:{'content-type':'text/html'}});
  assert.equal((await invoke({Authorization:'Bearer user'},'?modId='+modId)).status,200);
  assert.deepEqual(calls.at(-1)[1].p_results.map(x=>[x.platform,x.status]),[['gta5mods','paused'],['gtainside','success']]);
  assert.equal(calls.at(-1)[1].p_results[1].positive,0);
  assert.equal(calls.at(-1)[1].p_results[1].negative,3);
  claim=starClaim;
  claim={...claim,automaticUntil:new Date(Date.now()-1000).toISOString()};
  const networkBefore=calls.filter(([name])=>name==='provider').length;
  assert.equal((await runRatingJob(async(name)=>name.startsWith('claim')?claim:{status:'expired'})).status,'expired');
  assert.equal(calls.filter(([name])=>name==='provider').length,networkBefore);
} finally { globalThis.fetch=realFetch;delete globalThis.Deno; }
console.log('Edge handler and worker passed: authentication, account binding, idle, time fence, 403, 429 and Retry-After.');

