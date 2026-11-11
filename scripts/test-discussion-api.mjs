import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

let user = { id: '00000000-0000-0000-0000-000000000001' };
let rpcResult = { data: { items: [], hasMore: false }, error: null };
let calls = [];
const client = { auth: { getUser: async () => ({ data: { user }, error: null }) },
  rpc: async (name,args) => { calls.push({name,args}); return rpcResult; } };
const compiled = ts.transpileModule(readFileSync(new URL('../app/api/discussions/route.ts',import.meta.url),'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const context = { exports: {}, Response,Request,URL,TextDecoder,console,
  require: name => { assert.equal(name,'@/lib/supabase/server'); return { createSupabaseServerClient: async () => client }; } };
vm.runInNewContext(compiled,context);
const { GET,POST } = context.exports;
const target='00000000-0000-0000-0000-000000000021';
const post = (body,origin='http://localhost:3000',headers={}) => POST(new Request('http://localhost:3000/api/discussions',{
  method:'POST',headers:{'Content-Type':'application/json',...(origin?{origin}:{}),...headers},body:JSON.stringify(body)
}));
assert.equal((await post({action:'create',body:'Hello'},'https://other.example')).status,403);
assert.equal((await post({action:'create',body:'Hello'},null)).status,403);
assert.equal(calls.length,0);
user=null;
assert.equal((await post({action:'create',body:'Hello'})).status,401);
assert.equal((await GET(new Request('http://localhost:3000/api/discussions?mode=account'))).status,401);
assert.equal(calls.length,0);
user={id:'00000000-0000-0000-0000-000000000001'};
assert.equal((await post({action:'create',body:'  '})).status,400);
assert.equal((await post({action:'create',body:'x'.repeat(4001)})).status,400);
assert.equal((await post({action:'create',body:'Hello',targetId:'bad'})).status,400);
assert.equal((await post({action:'create',body:'Hello'},undefined,{'content-length':'400001'})).status,413);
assert.equal((await post({action:'invalid'})).status,400);
rpcResult={data:target,error:null};
assert.equal((await post({action:'create',targetId:target,body:'Hello',authorAccountId:'forged'})).status,201);
assert.equal(calls.at(-1).name,'submit_mod_feedback');
assert.ok(!('authorAccountId' in calls.at(-1).args));
assert.equal(calls.at(-1).args.p_creator_id,null);
assert.equal((await post({action:'create',targetId:target,parentId:target,body:'Reply',rating:5})).status,400);
assert.equal((await post({action:'create',targetId:target,body:'Hello',rating:2.5})).status,400);
rpcResult={data:null,error:{code:'42501',message:'Identity mismatch'}};
assert.equal((await post({action:'create',body:'Hello'})).status,403);
rpcResult={data:null,error:{code:'P0001',message:'Posting limit'}};
assert.equal((await post({action:'create',body:'Hello'})).status,429);
rpcResult={data:null,error:{code:'PGRST202',message:'Missing RPC'}};
const setup=await GET(new Request(`http://localhost:3000/api/discussions?targetId=${target}`));
assert.equal(setup.status,503); assert.equal((await setup.json()).error,'Discussions are awaiting database setup.');
rpcResult={data:{items:[],hasMore:false},error:null};
const response=await GET(new Request(`http://localhost:3000/api/discussions?mode=identity&identityType=creator&identityId=${target}&page=2&category=mod`));
assert.equal(response.status,200); assert.equal(response.headers.get('cache-control'),'private, no-store');
assert.equal(calls.at(-1).args.p_page,2); assert.equal(calls.at(-1).args.p_category,'mod');

const linkModule={exports:{},encodeURIComponent};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/discussions/types.ts',import.meta.url),'utf8'),
  {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,linkModule);
const {discussionEventHref}=linkModule.exports;
assert.equal(discussionEventHref({event_type:'comment_created',metadata:{modId:target,discussionCommentId:target}}),`/mods/${target}?comment=${target}#comment-${target}`);
assert.equal(discussionEventHref({event_type:'comment_created',metadata:{modId:'javascript:bad',discussionCommentId:target}}),null);
assert.equal(discussionEventHref({event_type:'team_member_left',metadata:{modId:target,discussionCommentId:target}}),null);
rpcResult={data:[],error:null};
assert.equal((await GET(new Request('http://localhost:3000/api/discussions?mode=references&trigger=%40&query=test'))).status,200);
assert.equal(calls.at(-1).name,'search_discussion_references');
rpcResult={data:null,error:{code:'P0001',message:'Please wait',details:'24'}};
const wait=await post({action:'create',body:'@A',targetId:target,references:[{kind:'creator',id:target,start:0,end:2}]});
assert.equal(wait.status,429);assert.equal((await wait.json()).cooldownSeconds,24);
assert.equal(calls.at(-1).name,'write_referenced_discussion');
console.log('Discussion API checks passed: authentication, origin, validation, account spoofing, rate/setup responses and notification deep links.');
