import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const runtime = process.env.MODVAULT_FEEDBACK_TEST_RUNTIME ?? 'C:/Users/rodr_/AppData/Local/Temp/modvault-feedback-tests';
const runtimeRequire = createRequire(join(runtime, 'package.json'));
const React = runtimeRequire('react');
const Renderer = runtimeRequire('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { act } = Renderer;
const root = new URL('../', import.meta.url);
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const mod = id(20);
function comment(n, parent = null) { return { id:id(n), target_id:mod,target_type:'mod',target_title:'Ferrari',parent_comment_id:parent,body:`Comment ${n}`,status:'published',created_at:`2026-11-04T09:00:${String(n).padStart(2,'0')}Z`,updated_at:`2026-11-04T09:00:${String(n).padStart(2,'0')}Z`,author_name:`Author ${n}`,author_href:'/profile/person',author_creator_id:null,can_edit:true,can_moderate:false,reply_count:0 }; }
const older=comment(10), oldest=comment(9), loaded=comment(8), fresh=comment(11), reply=comment(12,older.id);
let latestRating={average:null,count:0,ownRating:null,canRate:true,canModerate:false,moderation:[],hasMore:false};
let channelFixture;
let channelRequests=0;
const requests=[]; const navigations=[]; const scrolled=[];
const location={href:`http://localhost:3000/mods/${mod}`,pathname:`/mods/${mod}`};
const listeners=new EventTarget();
const browser={ location, innerWidth:800, innerHeight:600, setTimeout,clearTimeout, addEventListener:listeners.addEventListener.bind(listeners),removeEventListener:listeners.removeEventListener.bind(listeners),
  history:{ pushState:(_a,_b,url)=>{navigations.push(String(url));location.href=new URL(url,location.href).href;},replaceState:(_a,_b,url)=>{location.href=new URL(url,location.href).href;} },dispatchEvent:listeners.dispatchEvent.bind(listeners) };
let cooldownReply=false;
const fetcher=async(url,options={})=>{
  const q=new URL(url,'http://localhost:3000');
  if(q.searchParams.get('mode')==='references') return Response.json([
    {kind:'creator',id:id(71),label:'Tom',avatar:null,context:null},
    {kind:'creator',id:id(72),label:'Tonebee',avatar:null,context:null},
  ]);
  if(options.method==='POST' && q.pathname==='/api/discussions' && cooldownReply) return Response.json({error:'Please wait',cooldownSeconds:24},{status:429});
  if(options.method==='POST') {
    const body=JSON.parse(options.body); requests.push({path:q.pathname,body});
    if(q.pathname==='/api/mod-ratings') {latestRating={...latestRating,average:body.value,count:1,ownRating:{value:body.value,isValid:true}};return Response.json({rating:latestRating});}
    if(body.parentId) return Response.json({id:reply.id,item:reply});
    return Response.json({id:fresh.id,item:{...fresh,rating_at_submission:body.rating},rating:latestRating});
  }
  if(q.pathname==='/api/mod-ratings') return Response.json(latestRating);
  if(q.searchParams.get('mode')==='replies') return Response.json({items:[],hasMore:false});
  if(q.searchParams.get('mode')==='thread') return Response.json({items:[older,reply],hasMore:false,rootId:older.id});
  return Response.json({items:q.searchParams.get('page')==='2'?[loaded]:[older,oldest],hasMore:q.searchParams.get('page')!=='2'});
};
const cache=new Map();
const identity={accountId:id(1),activeCreator:null,activeCreatorId:null,loading:false,selecting:false,error:null};
function load(path) {
  if(cache.has(path)) return cache.get(path);
  const exports={}; cache.set(path,exports);
  const compiled=ts.transpileModule(readFileSync(new URL(path,root),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const require=name=>{
    if(name==='@/lib/discussions/references') return load('lib/discussions/references.ts');
    if(name==='./ReferenceEditor') return load('components/discussions/ReferenceEditor.tsx');
    if(name==='@/lib/ratings/colors') return load('lib/ratings/colors.ts');
    if(name==='./ExternalRatingRefresh') return {__esModule:true,default:()=>null};
    if(name==='react-dom') return {createPortal:child=>child};
    if(name==='react'||name==='react/jsx-runtime') return runtimeRequire(name);
    if(name==='next/link') return {__esModule:true,default:props=>React.createElement('a',props,props.children)};
    if(name==='@/app/contexts/CreatorContext') return {useCreatorContext:()=>identity};
    if(name==='@/lib/supabase/client') return {supabase:{rpc:async()=>{channelRequests++;return {data:{[mod]:channelFixture??{internal:latestRating.count?{user:{average:latestRating.average,count:latestRating.count}}:{},external:[]}}};}}};
    const files={'@/lib/discussions/types':'lib/discussions/types.ts','@/lib/discussions/thread-state':'lib/discussions/thread-state.ts','@/components/ratings/StarSelector':'components/ratings/StarSelector.tsx','@/components/ratings/RatingChannels':'components/ratings/RatingChannels.tsx','./DiscussionCard':'components/discussions/DiscussionCard.tsx','./types':'lib/discussions/types.ts'};
    assert.ok(files[name],name);return load(files[name]);
  };
  vm.runInNewContext(compiled,{exports,require,window:browser,document:{body:{},addEventListener:listeners.addEventListener.bind(listeners),removeEventListener:listeners.removeEventListener.bind(listeners),getElementById:key=>({scrollIntoView:()=>scrolled.push(key)})},fetch:fetcher,AbortController,URL,URLSearchParams,Event,CustomEvent,setTimeout,clearTimeout,setInterval,clearInterval,requestAnimationFrame:fn=>fn(),console,Map,Date});
  return exports;
}
const ModDiscussions=load('components/discussions/ModDiscussions.tsx').default;
let view;
async function flush() {await act(async()=>{await new Promise(resolve=>setTimeout(resolve,35));});}
const text=node=>typeof node==='string'?node:(node.children??[]).map(text).join('');
const button=label=>view.root.findAllByType('button').find(node=>text(node)===label);
const exists=key=>view.root.findAll(node=>node.type==='article'&&node.props.id===`comment-${key}`).length>0;
await act(async()=>{view=Renderer.create(React.createElement(ModDiscussions,{targetId:mod}));});await flush();
assert.ok(exists(older.id)&&exists(oldest.id));
await act(async()=>{button('Load more comments').props.onClick();});await flush();assert.ok(exists(loaded.id));
await act(async()=>{view.root.findByProps({'aria-label':'Your comment'}).findByType('textarea').props.onChange({target:{value:'New comment'}});});
await act(async()=>{view.root.findAllByType('form')[0].props.onSubmit({preventDefault(){}});});await flush();
assert.equal(navigations.length,0,'comment must not navigate');
assert.ok(exists(fresh.id)&&exists(older.id)&&exists(oldest.id)&&exists(loaded.id),'all loaded roots retained');
assert.equal(view.root.findByProps({'aria-label':'Your comment'}).props.value,'');
const articles=view.root.findAllByType('article');assert.equal(articles[0].props.id,`comment-${fresh.id}`,'newest root is first');
const originalArticle=view.root.findByProps({id:`comment-${older.id}`});
await act(async()=>{originalArticle.findAllByType('button').find(node=>text(node)==='Reply').props.onClick();});await flush();
await act(async()=>{view.root.findByProps({'aria-label':`Reply to ${older.author_name}`}).findByType('textarea').props.onChange({target:{value:'Inline reply'}});});
await act(async()=>{view.root.findByProps({id:`comment-${older.id}`}).findByType('form').props.onSubmit({preventDefault(){}});});await flush();
assert.equal(navigations.length,0,'reply must not navigate');
assert.ok(exists(oldest.id)&&exists(loaded.id)&&exists(reply.id));
assert.ok(view.root.findByProps({id:`comment-${older.id}`}).parent.parent.findByProps({id:`comment-${reply.id}`}), 'reply remains in parent container');
// Rating-only interaction uses a separate endpoint and leaves comment count unchanged.
const commentsBefore=requests.filter(r=>r.path==='/api/discussions').length;
await act(async()=>{view.root.findByProps({'aria-label':'4 stars'}).props.onChange();});
await act(async()=>{button('Save rating only').props.onClick();});await flush();
assert.equal(requests.filter(r=>r.path==='/api/discussions').length,commentsBefore);
assert.ok(JSON.stringify(view.toJSON()).includes('4.0'),'aggregate refreshes after rating-only save');
await act(async()=>{view.root.findByProps({'aria-label':'2 stars'}).props.onChange();});
await act(async()=>{button('Update rating only').props.onClick();});await flush();
assert.equal(requests.at(-1).body.value,2);
const explicit=view.root.findByProps({id:`comment-${older.id}`}).findAllByType('a').find(node=>text(node).startsWith('View thread'));
await act(async()=>{explicit.props.onClick({preventDefault(){}});});await flush();
assert.equal(navigations.length,1);assert.ok(exists(older.id)&&exists(reply.id));assert.ok(!exists(oldest.id));
const back=view.root.findAllByType('a').find(node=>text(node)==='Back to all comments');
await act(async()=>{back.props.onClick({preventDefault(){}});});await flush();assert.ok(exists(loaded.id),'back preserves previously loaded roots');
await act(async()=>{view.unmount();});
location.href=`http://localhost:3000/mods/${mod}?comment=${reply.id}#comment-${reply.id}`;
await act(async()=>{view=Renderer.create(React.createElement(ModDiscussions,{targetId:mod}));});await flush();await flush();await flush();
assert.ok(exists(older.id)&&exists(reply.id));assert.ok(!exists(oldest.id));assert.ok(scrolled.includes(`comment-${reply.id}`));
await act(async()=>{view.unmount();});
const presentation=load('lib/notifications/discussionPresentation.ts').discussionPresentation;
assert.equal(presentation({event_type:'comment_created',metadata:{publishingName:'P3AK',modTitle:'Ferrari 488 Pista'}}).summary,'P3AK commented on Ferrari 488 Pista.');
assert.equal(presentation({event_type:'comment_reply_created',metadata:{publishingName:'Akmos',modTitle:'Ferrari 488 Pista',recipientReason:'reply'}}).title,'New reply to your comment');
assert.equal(presentation({event_type:'team_member_invited',metadata:{}}),null);
assert.match(presentation({event_type:'comment_created',metadata:{contentAvailable:false}}).summary,/no longer available/);
console.log('React interaction checks passed: persistent loaded roots, newest-first insert, inline reply, explicit thread/back navigation, deep-link scroll, rating-only updates and shared identity-aware notifications.');

const RatingChannels=load('components/ratings/RatingChannels.tsx').default;
const ModHero=load('components/mod/ModHero.tsx').default;
const mockOptions={createNodeMock:()=>({contains:()=>false,getBoundingClientRect:()=>({top:300,bottom:330,left:380,right:420,width:40})})};
const labels=renderer=>renderer.root.findAllByType('button').map(node=>node.props['aria-label']).filter(label=>label?.includes('Rating:'));
const vote=(average,count=1)=>({average,count});
const external=(platform,value,scale,normalized)=>({platform,url:'https://example.test/'+platform,value,scale,normalized,count:4,updatedAt:'2026-10-05T12:00:00Z'});
channelFixture={externalPrimary:{platform:'gta5mods',url:'https://example.test/gta5mods'},internal:{creator:vote(5),user:vote(4,2),legacy:vote(3)},external:[external('gta5mods',4.8,5,4.8),external('other',8,10,4)]};
let card,hero;
const before=channelRequests;
await act(async()=>{
  card=Renderer.create(React.createElement(RatingChannels,{modId:mod}),mockOptions);
  hero=Renderer.create(React.createElement(ModHero,{mod:{id:mod,title:'Test Mod',image:'/one.jpg'},images:['/two.jpg']}),mockOptions);
});
await flush();
assert.equal(channelRequests,before+1,'gallery and card share one batch');
const expected=['External Rating: 4.8','Creator Rating: 5.0','User Rating: 4.0','Legacy Rating: 3.0'];
assert.deepEqual(labels(card),expected); assert.deepEqual(labels(hero),expected);
const indicator=card.root.findByProps({'aria-label':expected[0]});
await act(async()=>indicator.props.onPointerEnter({pointerType:'mouse'}));
let detail=text(card.root.findByProps({role:'tooltip'}));
assert.match(detail,/GTA5-Mods/); assert.match(detail,/8 \/ 10/); assert.match(detail,/Last updated/);
await act(async()=>listeners.dispatchEvent(Object.assign(new Event('keydown'),{key:'Escape'})));
assert.equal(card.root.findAllByProps({role:'tooltip'}).length,0);
const creator=card.root.findByProps({'aria-label':expected[1]});
await act(async()=>creator.props.onFocus());
assert.match(text(card.root.findByProps({role:'tooltip'})),/eligible, experienced/);
await act(async()=>creator.props.onBlur({relatedTarget:null}));
await act(async()=>indicator.props.onClick());
assert.equal(card.root.findAllByProps({role:'tooltip'}).length,1,'tap opens details');
await act(async()=>indicator.props.onClick());
assert.equal(card.root.findAllByProps({role:'tooltip'}).length,0);
await act(async()=>hero.root.findAllByType('button').find(node=>text(node)==='→').props.onClick({stopPropagation(){}}));
assert.equal(hero.root.findAllByType('img')[0].props.src,'/two.jpg');
assert.deepEqual(labels(hero),expected,'image changes retain gallery indicators');
await act(async()=>{card.unmount();hero.unmount();});

for(const category of ['user','creator','legacy',null]){
  channelFixture={internal:category?{[category]:vote(4)}:{},external:[]};
  await act(async()=>{card=Renderer.create(React.createElement(RatingChannels,{modId:mod}),mockOptions);});
  await flush();
  assert.equal(labels(card).length,category?1:0);
  if(category)assert.match(labels(card)[0],new RegExp(category+' Rating: 4.0','i'));
  await act(async()=>card.unmount());
}
channelFixture={internal:{},external:[]};
await act(async()=>{hero=Renderer.create(React.createElement(RatingChannels,{modId:mod,variant:'gallery'}),mockOptions);});
await flush();
assert.deepEqual(labels(hero),['External Rating: Unavailable','Creator Rating: Unavailable','User Rating: Unavailable']);
await act(async()=>hero.unmount());

channelFixture={
  internal:{},
  externalPrimary:{platform:'gtainside',url:'https://example.test/gtainside'},
  external:[
    external('gta5mods',4.8,5,4.8),
    {...external('gtainside',null,null,null),type:'votes',positive:0,negative:3},
  ],
};
await act(async()=>{hero=Renderer.create(React.createElement(RatingChannels,{modId:mod,variant:'gallery'}),mockOptions);});
await flush();
const nativeBadge=hero.root.findByProps({'aria-label':'External Rating: 0 positive votes'});
await act(async()=>nativeBadge.props.onFocus());
assert.match(text(hero.root.findByProps({role:'tooltip'})),/0 positive.*3 negative/);
assert.match(text(hero.root.findByProps({role:'tooltip'})),/GTA5-Mods/);
await act(async()=>hero.unmount());
console.log('Rating visuals and gallery checks passed: category order, single and missing channels, multiple external sources, batching, hover/focus/tap and image navigation.');

const ReferenceEditor=load('components/discussions/ReferenceEditor.tsx').default;
let editorView;
let draft='';
let spans=[];
function DraftFixture(){
  const [state, setState] = React.useState({body:'',refs:[]});
  return React.createElement(ReferenceEditor,{value:state.body,references:state.refs,
    onDraft:(body,refs)=>{draft=body;spans=refs;setState({body,refs});}});
}
await act(async()=>{editorView=Renderer.create(React.createElement(DraftFixture));});
const editField=()=>editorView.root.findByType('textarea');
await act(async()=>editField().props.onChange({target:{value:'😀 @To',selectionStart:6,selectionEnd:6}}));
await act(async()=>{await new Promise(resolve=>setTimeout(resolve,220));});
assert.equal(editorView.root.findAllByProps({role:'option'}).length,2);
await act(async()=>editField().props.onKeyDown({key:'ArrowDown',nativeEvent:{},preventDefault(){}}));
await act(async()=>editField().props.onKeyDown({key:'Enter',nativeEvent:{},preventDefault(){}}));
assert.equal(draft,'😀 @Tonebee ');
assert.equal(spans.length,1);
assert.equal(spans[0].start,3);
assert.equal(load('lib/discussions/references.ts').toStoredReferences(draft,spans)[0].start,2);
await act(async()=>editField().props.onChange({target:{value:'😀 @Tonbee ',selectionStart:10,selectionEnd:10}}));
assert.equal(spans.length,0,'editing the token removes the structured reference');
await act(async()=>editorView.unmount());

cooldownReply=true;
location.href=`http://localhost:3000/mods/${mod}`;
await act(async()=>{view=Renderer.create(React.createElement(ModDiscussions,{targetId:mod}));});
await flush();
await act(async()=>view.root.findByProps({'aria-label':'Your comment'}).findByType('textarea').props.onChange({target:{value:'Draft survives cooldown'}}));
await act(async()=>view.root.findAllByType('form')[0].props.onSubmit({preventDefault(){}}));
await flush();
assert.match(text(view.root.findByProps({role:'timer'})),/wait|post again/);
assert.equal(view.root.findByProps({'aria-label':'Your comment'}).props.value,'Draft survives cooldown');
assert.ok(button('Post comment').props.disabled);
await act(async()=>view.unmount());
console.log('Reference editor keyboard selection, Unicode spans, removal and cooldown draft preservation passed.');
