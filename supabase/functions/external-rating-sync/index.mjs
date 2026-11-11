import { runRatingJob } from './worker.mjs';

const base = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reply = (data, status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store'}});

async function rpc(name, args) {
  const response = await fetch(new URL('/rest/v1/rpc/'+name,base),{
    method:'POST',headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'},
    body:JSON.stringify(args),signal:AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(name+' returned '+response.status);
  return response.json();
}

Deno.serve(async request => {
  if (request.method!=='POST') return reply({error:'Method not allowed.'},405);
  try {
    const query=new URL(request.url).searchParams;
    const cron=request.headers.get('x-modvault-cron');
    if (cron!==null) {
      if (!/^[0-9a-f]{64}$/.test(cron) || !await rpc('authorize_external_rating_cron',{p_token:cron})) return reply({error:'Unauthorized.'},401);
      const max=query.get('limit')==='1'?1:5;
      const results=[];
      const deadline=AbortSignal.timeout(65_000);
      for (let index=0; index<max && !deadline.aborted; index++) {
        const result=await runRatingJob(rpc,undefined,undefined,deadline);
        results.push(result.status);
        if (['idle','busy','paused','rate_limited','denied','expired'].includes(result.status)) break;
        if (index+1<max) await new Promise(resolve=>setTimeout(resolve,1200));
      }
      console.info('External rating batch',JSON.stringify(results));
      return reply({results});
    }
    const authorization=request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return reply({error:'Sign in to refresh ratings.'},401);
    const modId=query.get('modId');
    if (!modId||!uuid.test(modId)) return reply({error:'Invalid mod.'},400);
    const verified=await fetch(new URL('/auth/v1/user',base),{
      headers:{apikey:publicKey,authorization},signal:AbortSignal.timeout(8000),
    });
    if (!verified.ok) return reply({error:'Sign in to refresh ratings.'},401);
    const user=await verified.json();
    if (!uuid.test(user.id??'')) return reply({error:'Sign in to refresh ratings.'},401);
    const result=await runRatingJob(rpc,modId,user.id);
    return reply(result,result.status==='forbidden'?403
      : ['cooldown','paused','rate_limited','denied'].includes(result.status)?429
      : ['busy','expired'].includes(result.status)?409:200);
  } catch(error) {
    console.error('External rating worker error',error instanceof Error?error.message:'unknown');
    return reply({error:'External rating synchronization is temporarily unavailable.'},503);
  }
});
