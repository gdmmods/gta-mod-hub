import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
let setup = readFileSync(new URL('scripts/test-team-archive.mjs', root), 'utf8').split('const checks =')[0];
setup = setup.replace("new URL('../', import.meta.url)", `new URL(${JSON.stringify(root.href)})`);
const checks = `
const migrations = new URL('supabase/migrations/', ${JSON.stringify(root.href)});
await db.exec(readFileSync(new URL('20261104090451_discussion_ux_notifications_mod_ratings.sql', migrations),'utf8'));
await db.exec("alter table public.mods add column visibility text not null default 'public', add column image text; alter table public.profiles add column avatar_url text");
await db.exec(readFileSync(new URL('20261105203056_universal_discussion_references.sql', migrations),'utf8'));

const save = async(account,body,refs,{action='create',comment=null,target=modB,parent=null,creator=null,rating=null}={})=>
  (await as(account,'select public.write_referenced_discussion($1,$2,$3,$4,$5,$6,$7,$8) result',
    [action,comment,target,creator,parent,body,rating,JSON.stringify(refs)]))[0].result;
const ref=(body,kind,id,label)=>{const start=[...body.slice(0,body.indexOf(label))].length;return {kind,id,start,end:start+[...label].length};};
const events=async comment=>(await db.query("select e.id,n.profile_id,metadata from activity_events e join notifications n on n.activity_event_id=e.id where metadata->>'discussionCommentId'=$1",[comment])).rows;
const age=async account=>{
  await db.exec('alter table private.discussion_comments disable trigger guard_discussion_identity');
  await db.query("update private.discussion_comments set created_at=now()-interval '31 seconds' where author_account_id=$1",[account]);
  await db.exec('alter table private.discussion_comments enable trigger guard_discussion_identity');
};

await assert.rejects(as(null,"select public.search_discussion_references('@','a')"),/permission denied/);
const choices=(await as(alice,"select public.search_discussion_references('@','team') result"))[0].result;
assert.ok(choices.some(x=>x.kind==='team'&&x.id===teamCreator));
assert.ok(choices.every(x=>!('owner_id' in x)));
const published=(await as(alice,"select public.search_discussion_references('#','mod') result"))[0].result;
assert.ok(!published.some(x=>x.id===unpublished));
await assert.rejects(as(alice,'select * from private.discussion_references'),/permission denied/);

const invalid='@Other';
await assert.rejects(save(alice,invalid,[ref(invalid,'creator',outsider,invalid)],{rating:5}),/reference is invalid/);
assert.equal(await count('private.discussion_comments'),0);
assert.equal(await count('private.mod_ratings'),0);
const body='😀 @Bob @Other @Team #Mod @plain';
const refs=[ref(body,'user',bob,'@Bob'),ref(body,'creator',creatorOther,'@Other'),ref(body,'team',teamCreator,'@Team'),ref(body,'mod',modTeam,'#Mod')];
await assert.rejects(save(alice,body,[...refs,refs[0]]),/duplicated/);
const saved=await save(alice,body,refs,{rating:5});
assert.equal(saved.item.references.length,4);
assert.equal(saved.item.rating_at_submission,5);
assert.equal((await events(saved.id)).length,1,'four references and mod-owner event consolidate');
assert.equal((await events(saved.id))[0].metadata.referenceKeys.length,4);
assert.equal((await read(alice,'target',{target:modB})).cooldownSeconds,30);
await selectIdentity(alice,creatorB);
await assert.rejects(write(alice,'create',{creator:creatorB,body:'Too soon'}),/wait before posting/);
await assert.rejects(save(alice,'Reply too soon',[],{parent:saved.id,creator:creatorB}),/wait before posting/);
await write(alice,'create',{creator:creatorB,target:modA,body:'A different mod works'});

await db.query("update creators set name='Renamed' where id=$1",[creatorOther]);
await db.query("update mods set title='Renamed mod' where id=$1",[modTeam]);
const current=(await read(null,'thread',{target:modB,comment:saved.id})).items[0];
assert.equal(current.references.find(r=>r.id===creatorOther).href,'/creator/'+creatorOther);
assert.equal(current.references.find(r=>r.id===modTeam).href,'/mods/'+modTeam);
const editedBody=body+' @Outsider';
const editedRefs=[...refs,ref(editedBody,'user',outsider,'@Outsider')];
await save(alice,editedBody,editedRefs,{action:'edit',comment:saved.id});
await save(alice,editedBody,editedRefs,{action:'edit',comment:saved.id});
assert.equal((await events(saved.id)).length,2);
await save(alice,body,refs,{action:'edit',comment:saved.id});
await save(alice,editedBody,editedRefs,{action:'edit',comment:saved.id});
assert.equal((await events(saved.id)).length,2,'remove and re-add does not resend');
const reply=await save(bob,'@Alice', [ref('@Alice','user',alice,'@Alice')],{parent:saved.id});
assert.equal((await events(reply.id)).length,1,'reply and mention consolidate');
assert.equal((await events(reply.id))[0].metadata.recipientReason,'reply');

await db.query("update mods set visibility='private' where id=$1",[modTeam]);
const unavailable=(await read(null,'thread',{target:modB,comment:saved.id})).items[0];
assert.equal(unavailable.references.find(r=>r.id===modTeam).href,null);

const many=[];
for(let i=100;i<122;i++) {
  const label='Person'+i, account=id(i);
  await db.query('insert into profiles(id,username,display_name) values($1,$2,$2)',[account,label]);
  many.push({account,label:'@'+label});
}
await age(alice);
const long=many.map(x=>x.label).join(' ');
const numerous=await save(alice,long,many.map(x=>ref(long,'user',x.account,x.label)),{creator:creatorB});
assert.equal(numerous.item.references.length,22);
assert.equal((await events(numerous.id)).length,23);
assert.equal((await events(numerous.id)).find(x=>x.profile_id===many[0].account).metadata.recipientReason,'reference');
const details=(await as(many[0].account,'select public.discussion_event_details(array[$1::uuid]) data',[(await events(numerous.id)).find(x=>x.profile_id===many[0].account).id]))[0].data;
assert.equal(Object.values(details)[0].referenceLabels[0],many[0].label);
await db.close();
console.log('Reference SQL checks passed: 22 distinct references, lookup privacy, rename, archive fallback, notification deduplication, rating rollback and per-account/mod cooldown.');
`;
setup += `\ntry { await import('data:text/javascript;base64,'+Buffer.from(fixture+${JSON.stringify(checks)}).toString('base64')); } catch(error) { console.error(error.message); process.exitCode=1; }`;
await import('data:text/javascript;base64,'+Buffer.from(setup).toString('base64'));

