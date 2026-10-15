import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import type { Actor, Command, Input, Pack, State } from '../server/model.ts';
import { choices, command, expire, identify, newState, resolve, securityOutcome, stageKey } from '../server/engine.ts';
import { validatePack, digestPack } from '../server/packs.ts';
import { Store } from '../server/database.ts';
import { RoomService } from '../server/service.ts';
import { gmView, playerView, publicView } from '../server/projection.ts';
import { createApp, errorHandler } from '../server/app.ts';

const pack=validatePack(JSON.parse(readFileSync('server/content/last_lantern_delivery.json','utf8')));
const second=validatePack(JSON.parse(readFileSync('server/content/ferry_medicine_exchange.json','utf8')));
const gm:Actor={kind:'gm',id:'gm'};const startTime=1800000000000;
const stores:Store[]=[];after(()=>stores.forEach(s=>s.close()));
const envelope=(s:State,type:string,payload:Record<string,unknown>={}):Command=>({id:randomUUID(),instance:s.instance,stageKey:stageKey(s),type,payload});
function act(s:State,type:string,payload:Record<string,unknown>={},actor:Actor=gm,now=startTime,p=pack){command(s,p,actor,envelope(s,type,payload),now);}
function ballots(s:State,choice?:string,extra:Input={}){for(const player of s.players)act(s,'input',{...(choice?{choice}:{}),...extra,ready:true},{kind:'player',id:player.id});}
function fixture(stage:State['stage']='scene',scene=pack.mission.entryScene,mode:State['mode']='cooperative'){
  const s=newState(pack);s.players.forEach((p,i)=>p.token=`token_${i}`);s.mode=mode;s.phase='selection';s.stage=stage;s.scene=scene;s.deadline=startTime+60000;return s;
}
function intrigue(stage:State['stage']='W1') {const s=fixture(stage,'lantern_rest','intrigue');s.players[0].agenda='Saboteur';s.players[0].intrigue=2;s.players[1].agenda='Independent Broker';s.resumeScene='lantern_storm';return s;}
function serviceFixture(path=':memory:') {const store=new Store(path);stores.push(store);store.install(pack);store.install(second);let time=startTime;const service=new RoomService(store,'test_host_key_only',pack,()=>time);return {store,service,setTime:(t:number)=>{time=t;}};}
const connected=()=>true;

test('v3 contract: GM has no seat; eight editable profiles, two squads of four; anonymous cooperation override',()=>{
  const s=newState(pack);assert.equal(s.players.length,8);assert.equal(s.gm.name,'Thái Bảo');assert.equal(s.players.some(x=>x.name===s.gm.name),false);
  for(const squad of ['pathfinder','mechanics'])assert.equal(s.players.filter(x=>x.squad===squad).length,4);
  s.players.forEach(x=>x.token='joined');act(s,'configure',{mode:'intrigue'});
  act(s,'role',{role:'Guardian'},{kind:'player',id:s.players[0].id});assert.equal(s.players[0].role,'Guardian');
  act(s,'preference',{mode:'cooperative'},{kind:'player',id:s.players[3].id});
  const full=gmView(s,pack,connected);assert(!JSON.stringify(full).includes('preference'));assert(!JSON.stringify(full).includes('token'));
  act(s,'start');assert.equal(s.mode,'cooperative');assert(s.players.every(x=>x.agenda==='Loyal Crew'));assert.equal(s.phase,'reading');
  assert.throws(()=>act(s,'input',{choice:'signal'}),/GM command/);
  assert.throws(()=>act(s,'configure',{mode:'intrigue'}),/lock/);
  const t=newState(pack);t.players.forEach(x=>x.token='joined');act(t,'configure',{mode:'intrigue'});act(t,'start');assert.deepEqual(Object.fromEntries(['Loyal Crew','Saboteur','Independent Broker'].map(a=>[a,t.players.filter(x=>x.agenda===a).length])),{'Loyal Crew':6,Saboteur:1,'Independent Broker':1});
});

test('plurality: editable input, all-abstain fallback, twenty-second rotating tie and published priority',()=>{
  const s=fixture();assert.throws(()=>act(s,'resolve'),/eight/);
  act(s,'input',{choice:'aboard',ready:true},{kind:'player',id:s.players[0].id});assert.equal(s.resources.supplies,6);
  act(s,'input',{choice:'equipment',ready:false},{kind:'player',id:s.players[0].id});assert.equal(s.inputs[s.players[0].id].choice,'equipment');
  s.inputs={};resolve(s,pack,startTime,true);assert.equal(s.flags.family_pending,true);assert.equal(s.resources.alarm,1);
  assert.throws(()=>act(s,'input',{choice:'aboard'},{kind:'player',id:s.players[0].id}),/closed/);
  const t=fixture();t.players.forEach((p,i)=>act(t,'input',{choice:i<4?'equipment':'aboard',ready:true},{kind:'player',id:p.id}));act(t,'resolve');assert.equal(t.phase,'tie');assert.equal(t.tie!.seat,'seat_1');assert.equal(t.deadline,startTime+20000);
  assert.throws(()=>act(t,'tie',{choice:'aboard'},{kind:'player',id:'seat_2'}),/unavailable/);
  expire(t,pack,startTime+20000);assert.equal(t.flags.family_aboard,true);assert.equal(t.resources.supplies,5);assert.equal(t.priority,1);
});

test('ferry outcomes expose and apply exact costs and family callback',()=>{
  for(const [choice,supply,alarm,flag] of [['aboard',5,0,'family_aboard'],['equipment',4,0,'family_by_boat'],['signal',6,1,'family_pending']] as const){const s=fixture();ballots(s,choice);act(s,'resolve');assert.equal(s.resources.supplies,supply);assert.equal(s.resources.alarm,alarm);assert.equal(s.flags[flag],true);assert.equal(s.next?.kind,'scene');}
});

test('bridge facts and uniqueness at six/seven; two incorrect attempts preserve instance and reach crossing',()=>{
  const scene=pack.scenes.find(x=>x.family==='deduction')!;
  for(const weight of [6,7])assert.deepEqual(scene.puzzle!.bridges.filter(b=>b.open&&b.capacity>=weight&&b.gate===scene.puzzle!.destination).map(b=>b.id),['north']);
  assert.equal(scene.cards.length,8);const s=fixture('scene',scene.id);const instance=s.instance;
  for(let attempt=1;attempt<=2;attempt++){ballots(s,'south');act(s,'resolve');assert.equal(s.attempts,attempt);assert.equal(s.resources.alarm,attempt);if(attempt===1){act(s,'continue');assert.equal(s.phase,'reading');assert.equal(s.instance,instance);act(s,'begin');}else assert.deepEqual(s.next,{kind:'scene',id:'lantern_crossing'});}
  act(s,'continue');assert.equal(s.scene,'lantern_crossing');
  const empty=fixture('scene',scene.id);resolve(empty,pack,startTime,true);assert.equal(empty.attempts,1);
});

test('evidence is immutable, owned, separately labeled from claims; Scout first hint and paid later hints',()=>{
  const s=fixture('scene','lantern_bridge');s.players[0].role='Scout';
  assert.throws(()=>act(s,'share',{card:'lantern_fact_2'},{kind:'player',id:'seat_1'}),/belong/);
  act(s,'share',{card:'lantern_fact_1',text:'forged'},{kind:'player',id:'seat_1'});assert.equal(s.shared[0].text,pack.scenes[1].cards[0].text);
  act(s,'claim',{text:'North cannot hold the wagon.'},{kind:'player',id:'seat_1'});assert.equal(s.claims[0].type,'unverified claim');assert.equal(s.shared[0].text,pack.scenes[1].cards[0].text);
  act(s,'hint',{}, {kind:'player',id:'seat_1'});assert.equal(s.resources.alarm,0);assert.equal(s.players[0].ability,false);assert.equal(s.hints,1);
  assert.throws(()=>act(s,'hint',{}, {kind:'player',id:'seat_1'}),/Scout/);
  ballots(s,'request_hint');act(s,'resolve');assert.equal(s.hints,2);assert.equal(s.resources.alarm,1);assert.equal(s.attempts,0);
});

test('Effort uses at most four eligible pledges in rotating order and saves one server roll',()=>{
  const s=fixture('scene','lantern_crossing');s.priority=6;ballots(s,'risk',{effort:true});act(s,'resolve');assert.equal(s.lastRoll!.contributors.length,4);assert.deepEqual(s.lastRoll!.contributors,['seat_7','seat_8','seat_1','seat_2']);assert.equal(s.players.filter(x=>x.effort).length,4);assert(s.lastRoll!.raw>=1&&s.lastRoll!.raw<=20);assert.equal(s.lastRoll!.success,s.lastRoll!.total>=13);assert.throws(()=>act(s,'resolve'),/closed/);
  const {service,store}=serviceFixture();service.state=fixture('scene','lantern_crossing');service.state.players.forEach(x=>{service.lastSeen.set(x.id,startTime);service.state.inputs[x.id]={choice:'risk',effort:true,ready:true};});store.commit(service.state,undefined,startTime);
  const cmd=envelope(service.state,'resolve');const ack=service.execute('test_host_key_only',cmd);const roll=structuredClone(service.state.lastRoll);const recovered=new RoomService(store,'test_host_key_only',pack,()=>startTime+1000);assert.deepEqual(recovered.state.lastRoll,roll);assert.deepEqual(recovered.execute('test_host_key_only',cmd),ack);assert.deepEqual(recovered.state.lastRoll,roll);assert.equal(recovered.state.players.filter(x=>x.effort).length,4);
});

test('Engineer only spends for accepted effects; repair and shield discounts never stack with voucher',()=>{
  const s=fixture('scene','lantern_rest');s.players[0].role='Engineer';s.resources.supplies=2;
  act(s,'input',{engineer:true,ready:false},{kind:'player',id:'seat_1'});ballots(s,'repair_hull');act(s,'resolve');assert.equal(s.resources.supplies,0);assert.equal(s.resources.integrity,6);assert.equal(s.players[0].ability,false);
  const t=fixture('purchase','lantern_storm');t.flags.voucher=true;t.players[0].role='Engineer';act(t,'input',{engineer:true},{kind:'player',id:'seat_1'});ballots(t,'pathfinder');act(t,'resolve');assert.equal(t.resources.supplies,5);assert.equal(t.players[0].ability,true);assert.equal(t.flags.voucher_used,true);assert.equal(t.shields.pathfinder,1);
  const u=fixture('scene','lantern_rest');u.resources.supplies=1;u.players[0].role='Engineer';act(u,'input',{engineer:true},{kind:'player',id:'seat_1'});assert.throws(()=>act(u,'input',{choice:'repair_hull'},{kind:'player',id:'seat_1'}),/unavailable/);assert.equal(u.players[0].ability,true);
});

test('storm defaults preserve all eight actions; family modifier, supply/power and repel thresholds',()=>{
  const s=fixture('actions','lantern_storm');resolve(s,pack,startTime,true);assert.equal(s.resources.integrity,5);const actionEvent=s.events.find(x=>x.type==='storm_actions')!;assert.equal((actionEvent.data as any).actions.length,8);assert((actionEvent.data as any).actions.every((a:any)=>a.action==='Shield'));
  const t=fixture('actions','lantern_storm');t.round=2;t.flags.family_aboard=true;t.players.forEach(x=>x.role='Scout');
  const actions=['Supply','Supply','Supply','Repel','Shield','Shield','Repel','Repel'];t.players.forEach((p,i)=>act(t,'input',{choice:actions[i],ready:true},{kind:'player',id:p.id}));act(t,'resolve');assert.equal(t.resources.integrity,4);assert.equal(t.resources.supplies,7);assert.equal(t.power,1);assert.equal(t.resources.alarm,0);
});

test('Guardian priority resolves ten-second responses once and retains unselected uses',()=>{
  const s=fixture('actions','lantern_storm');s.players.forEach(x=>x.role='Scout');s.players[0].role='Guardian';s.players[1].role='Guardian';s.priority=1;ballots(s,'Supply');act(s,'resolve');assert.equal(s.phase,'guardian');
  for(const id of ['seat_1','seat_2'])act(s,'guardian',{use:true},{kind:'player',id});expire(s,pack,startTime+10000);assert.equal(s.resources.integrity,5);assert.equal(s.players[0].ability,true);assert.equal(s.players[1].ability,false);assert.equal(s.power,1);assert.throws(()=>act(s,'guardian',{use:true},{kind:'player',id:'seat_1'}),/unavailable/);
});

test('urgency survives later Repel; six Alarm preserves all rounds; loss/Repel clamp before urgency',()=>{
  const s=intrigue('W2');s.resources.alarm=5;ballots(s,'skip');s.inputs.seat_1={choice:'plot',ready:true};act(s,'resolve');assert.equal(s.resources.alarm,6);assert.equal(s.urgent,true);assert.equal(s.phase,'consequences');act(s,'continue');assert.equal(s.round,2); // Fixture W2 starts round one; engine advances, never skips to ending.
  s.phase='selection';s.stage='actions';s.round=3;s.players.forEach(x=>x.role='Scout');ballots(s,'Repel');act(s,'resolve');assert.equal(s.urgent,true);assert(s.resources.alarm<=6);assert.equal(s.outcome,undefined);
  const t=fixture('actions','lantern_storm');t.players.forEach(x=>x.role='Scout');t.resources.alarm=5;ballots(t,'Repel');act(t,'resolve');assert.equal(t.resources.alarm,5);assert.equal(t.urgent,false); // loss makes six, Repel makes five before the full event ends
});

test('Integrity zero takes priority, suppresses power/W2/Theft, and all eight receive salvage',()=>{
  const s=intrigue('actions');s.scene='lantern_storm';s.round=2;s.resources.integrity=1;s.players.forEach(x=>x.role='Scout');ballots(s,'Supply');act(s,'resolve');assert.equal(s.phase,'selection');assert.equal(s.stage,'salvage');assert.equal(s.resources.supplies,6);assert.equal(s.power,0);assert.equal(s.players[0].plots,0);
  ballots(s,'tools');act(s,'resolve');assert.equal(s.outcome!.mission,'Evacuated');assert.equal(s.outcome!.security,'Not Applicable');assert(s.outcome!.agendas.every(x=>!x.success));assert.equal(s.outcome!.salvage,'tools');assert.equal(s.players.length,8);
});

test('bounded private windows spend only committed resources, preserve normal actions and mint no false trace',()=>{
  const s=intrigue();ballots(s,'skip');s.inputs.seat_1={choice:'plot',ready:true};s.inputs.seat_2={choice:'deal_effort',ready:true};act(s,'resolve');assert.equal(s.resources.supplies,5);assert.equal(s.players[0].intrigue,1);assert.equal(s.players[0].plots,1);assert.equal(s.players[1].coins,1);assert.equal(s.players[1].effort,false);assert.equal(s.traces.length,1);assert.equal(s.traces[0].seats.length,4);assert(s.traces[0].seats.includes('seat_1'));assert.throws(()=>act(s,'resolve'),/closed/);
  const t=intrigue();t.resources.supplies=0;resolve(t,pack,startTime,true);assert.equal(t.players[0].intrigue,2);assert.equal(t.traces.length,0);assert(t.summary.includes('No confirmed tampering.'));
  const u=intrigue('W2');u.resources.alarm=6;u.inputs.seat_1={choice:'plot',ready:true};resolve(u,pack,startTime,true);assert.equal(u.players[0].plots,0);assert.equal(u.players[0].intrigue,2);assert.match(u.players[0].notice,/unavailable/);
});

test('two traces always include actor and leave at least two candidates in intersection',()=>{
  for(let run=0;run<50;run++){const s=intrigue();ballots(s,'skip');s.inputs.seat_1={choice:'plot',ready:true};act(s,'resolve');s.stage='W2';s.phase='selection';s.inputs={seat_1:{choice:'plot'}};resolve(s,pack,startTime,true);assert.equal(s.traces.length,2);for(const t of s.traces){assert.equal(new Set(t.seats).size,4);assert(t.seats.includes('seat_1'));}assert(s.traces[0].seats.filter(x=>s.traces[1].seats.includes(x)).length>=2);}
});

test('Watch threshold four versus five, separate cost, no removal; watched Broker/Saboteur only lose W2',()=>{
  for(const votes of [4,5]){const s=intrigue('watch');s.players.forEach((p,i)=>s.inputs[p.id]={choice:i<votes?'seat_1':'abstain',ready:true});act(s,'resolve');assert.equal(s.resources.supplies,6);if(votes===4){assert.equal(s.nominated,undefined);assert.equal(s.next!.kind,'scene');}else{assert.equal(s.nominated,'seat_1');act(s,'continue');ballots(s,'yes');act(s,'resolve');assert.equal(s.watched,'seat_1');assert.equal(s.resources.supplies,5);}}
  for(const target of ['seat_1','seat_2']){const s=intrigue('W2');s.watched=target;s.inputs[target]={choice:target==='seat_1'?'plot':'deal_role',ready:true};resolve(s,pack,startTime,true);assert.equal(s.players[0].plots,0);assert.equal(s.players[1].coins,0);assert(s.players.every(p=>p.effort&&p.ability));assert.equal(s.watched,undefined);assert.equal(s.players.length,8);}
  const t=intrigue('watch_confirm');t.nominated='seat_1';t.resources.supplies=0;ballots(t,'no');act(t,'resolve');assert.equal(t.watched,undefined);
});

test('Broker pays both distinct unused resources across windows; cannot double deal or spend a used ability',()=>{
  const s=intrigue();s.inputs.seat_2={choice:'deal_effort'};resolve(s,pack,startTime,true);s.stage='W2';s.phase='selection';s.inputs={seat_2:{choice:'deal_role'}};resolve(s,pack,startTime,true);assert.equal(s.players[1].coins,2);assert.equal(s.players[1].effort,false);assert.equal(s.players[1].ability,false);
  const t=intrigue();t.players[1].effort=false;t.players[1].ability=false;assert(choices(t,pack,t.players[1]).filter(x=>x.id!=='skip').every(x=>!x.available));t.inputs.seat_2={choice:'deal_role'};resolve(t,pack,startTime,true);assert.equal(t.players[1].coins,0);
});

test('security truth table: wrong accusation alone never steals; all five conditions are necessary',()=>{
  for(const delivered of [false,true])for(const plot of [false,true])for(const theft of [false,true])for(const chest of [false,true])for(const caught of [false,true]){
    const s=intrigue('finale');s.resources.integrity=delivered?5:0;s.players[0].plots=plot?1:0;s.chest=chest;s.inputs.seat_1={theft};for(let i=1;i<6;i++)s.inputs[s.players[i].id]={accusation:caught?'seat_1':'seat_3'};
    assert.equal(securityOutcome(s),!delivered?'Not Applicable':plot&&theft&&!chest&&!caught?'Stolen':'Secured');
  }
  const s=intrigue('finale');s.players[0].plots=1;s.players[1].coins=2;s.inputs.seat_1={theft:true};resolve(s,pack,startTime,true);assert.equal(s.outcome!.mission,'Delivered');assert.equal(s.outcome!.security,'Stolen');assert.equal(s.outcome!.agendas[0].success,true);assert.equal(s.outcome!.agendas[1].success,true);assert(s.outcome!.agendas.slice(2).every(x=>!x.success));
  const t=intrigue('finale');t.inputs.seat_1={theft:true};for(let i=1;i<=4;i++)t.inputs[t.players[i].id]={accusation:'seat_1'};assert.equal(identify(t.inputs,'accusation',t.players),undefined);t.inputs.seat_6={accusation:'seat_1'};assert.equal(identify(t.inputs,'accusation',t.players),'seat_1');
  const u=intrigue('chest');u.resources.supplies=2;ballots(u,'yes');act(u,'resolve');assert.equal(u.resources.supplies,0);assert.equal(u.chest,true);assert.throws(()=>act(u,'resolve'),/closed/);act(u,'continue');u.players[0].plots=1;ballots(u,'finish');u.inputs.seat_1.theft=true;act(u,'resolve');assert.equal(u.outcome!.security,'Secured');
  const poor=intrigue('chest');poor.resources.supplies=1;assert.throws(()=>act(poor,'input',{choice:'yes'},{kind:'player',id:'seat_1'}),/unavailable/);resolve(poor,pack,startTime,true);assert.equal(poor.chest,false);assert.equal(poor.resources.supplies,1);
});

test('server projections contain no tokens, invitations, other private actions, answer keys or unshared cards',()=>{
  const s=intrigue('W1');s.players[0].notice='private explanation';s.inputs.seat_1={choice:'plot',ready:true};s.scene='lantern_bridge';
  const tv=JSON.stringify(publicView(s,pack,connected));for(const secret of ['invite','token','private explanation','"plot"','canonical answer','lantern_fact_1','"agenda"'])assert(!tv.includes(secret),secret);
  assert.equal(publicView(s,pack,connected).readyCount,null);assert.deepEqual(publicView(s,pack,connected).choices,[]);
  const own=playerView(s,pack,s.players[1],connected);assert.equal(own.own.agenda,'Independent Broker');assert.equal(own.own.cards[0].id,'lantern_fact_2');assert(!JSON.stringify(own).includes('lantern_fact_1'));assert(!JSON.stringify(own).includes('private explanation'));assert(!JSON.stringify(own).includes('"plot"'));
  const host=gmView(s,pack,connected);assert.equal(host.private.answer,'north');assert(!JSON.stringify(host).includes('preference'));assert(!JSON.stringify(host).includes('token'));
});

test('pack validator rejects executable code, unsafe paths, loops, wrong rosters, duplicate IDs and ambiguous puzzles',()=>{
  for(const mutate of [(p:any)=>p.assets.push('../secret.png'),(p:any)=>p.mission.rosterRange=[7,8],(p:any)=>p.intrigue=null,(p:any)=>p.scenes[0].options[0].effects.push({op:'eval',code:'process.exit()'}),(p:any)=>p.scenes[0].options[0].next=p.scenes[0].id,(p:any)=>p.scenes[1].puzzle.bridges[2].gate='Sun',(p:any)=>p.scenes[1].puzzle.bridges[0].capacity=6,(p:any)=>p.scenes[0].id=p.scenes[1].id,(p:any)=>p.scenes[0].options[2].cost=12]){const bad=structuredClone(pack);mutate(bad);assert.throws(()=>validatePack(bad),/Pack:/);}
  assert.equal(validatePack(second).id,second.id);assert(!second.mission.allowedModes.includes('intrigue'));
  const {store,service}=serviceFixture();const changed=structuredClone(pack);changed.title='Changed without a version bump';assert.throws(()=>store.install(changed),/already exists/);assert.equal(store.packs().length,2);
  const skipped=structuredClone(pack);skipped.scenes[0].options[0].next='lantern_end';assert.throws(()=>validatePack(skipped),/bypass/);
  changed.version='3.0.1';store.install(changed);assert.equal(store.packs().length,3);assert.equal(service.state.pack.version,'3.0.0');assert.equal(store.pack(pack.id,pack.version).title,pack.title);assert.equal(service.state.pack.digest,digestPack(pack));
  assert.throws(()=>store.pack(pack.id,pack.version,'wrong-digest'),/exact saved pack/);
});

test('SQLite service: authenticated seats, serialized commands, stable retry acknowledgement and transactional rollback',async()=>{
  const {service,store}=serviceFixture();const s=service.state;const joins=await Promise.all(s.players.map(p=>service.ordered(()=>service.join(p.id,p.invite))));assert.equal(joins.length,8);
  assert.throws(()=>service.join(s.players[0].id,s.players[0].invite),/used/);
  const start=envelope(service.state,'start');const ack=service.execute('test_host_key_only',start);assert.equal(service.state.phase,'reading');assert.deepEqual(service.execute('test_host_key_only',start),ack);
  assert.throws(()=>service.execute(joins[0].token,envelope(service.state,'pause')),/Player command/);
  const before=JSON.stringify(service.state);assert.throws(()=>service.execute('test_host_key_only',envelope(service.state,'configure',{mode:'intrigue'})),/lock/);assert.equal(JSON.stringify(service.state),before);
  service.execute('test_host_key_only',envelope(service.state,'begin'));const cmd=envelope(service.state,'input',{choice:'aboard',ready:true});const result=service.execute(joins[0].token,cmd);assert.deepEqual(service.execute(joins[0].token,cmd),result);assert.throws(()=>service.execute(joins[1].token,cmd),/different actor/);
  const rows=store.db.prepare('SELECT * FROM accepted_commands WHERE command_id=?').all(cmd.id);assert.equal(rows.length,1);
  service.execute('test_host_key_only',envelope(service.state,'reassign',{seat:'seat_1'}));assert.throws(()=>service.view('player',joins[0].token),/credential/);const replacement=service.state.players[0];service.join(replacement.id,replacement.invite);assert.equal(service.state.inputs.seat_1.choice,'aboard');
});

test('crash recovery pins agendas, acknowledged deal, roll, trace and unresolved phase without duplicate spending',()=>{
  const folder=mkdtempSync(join(tmpdir(),'mistbound-recovery-'));const path=join(folder,'room.sqlite');const {service,store}=serviceFixture(path);
  const s=intrigue();s.players[0].token='sab_token';s.players[1].token='broker_token';s.lastRoll={raw:9,dc:13,total:13,contributors:['seat_3','seat_4','seat_5','seat_6'],success:true};store.commit(s);service.state=s;
  const deal=envelope(s,'input',{choice:'deal_role',ready:true});const ack=service.execute('broker_token',deal);const plot=envelope(s,'input',{choice:'plot',ready:true});service.execute('sab_token',plot);service.mutate(copy=>{for(const x of copy.players)copy.inputs[x.id]={...copy.inputs[x.id],ready:true};});const close=envelope(service.state,'resolve');const closed=service.execute('test_host_key_only',close);
  const recovered=new RoomService(store,'test_host_key_only',pack,()=>startTime);assert.equal(recovered.state.paused,true);assert.equal(recovered.state.players[1].coins,1);assert.equal(recovered.state.players[1].ability,false);assert.equal(recovered.state.resources.supplies,5);assert.equal(recovered.state.traces.length,1);assert.equal(recovered.state.lastRoll!.raw,9);assert.deepEqual(recovered.execute('broker_token',deal),ack);assert.deepEqual(recovered.execute('test_host_key_only',close),closed);assert.equal(recovered.state.players[1].coins,1);
  const backup=store.backup();const saved=new Store(backup);assert.equal(saved.active()!.players[0].agenda,'Saboteur');assert.equal(saved.packs().length,2);saved.close();
});

test('disconnect pauses once per stage; resumed deadline and timeout use saved inputs/defaults',()=>{
  const {service,setTime}=serviceFixture();service.state.players.forEach(p=>service.join(p.id,p.invite));service.execute('test_host_key_only',envelope(service.state,'start'));service.execute('test_host_key_only',envelope(service.state,'begin'));
  setTime(startTime+10001);service.tick();assert.equal(service.state.paused,true);assert.equal(service.state.remaining,79999);service.execute('test_host_key_only',envelope(service.state,'pause'));service.tick();assert.equal(service.state.paused,false);setTime(startTime+90000);service.tick();assert.equal(service.state.phase,'consequences');assert.equal(service.state.flags.family_pending,true);
});

test('server downtime does not consume the timer remaining at the last durable input',()=>{
  const {service,store,setTime}=serviceFixture();service.state.players.forEach(p=>service.join(p.id,p.invite));service.execute('test_host_key_only',envelope(service.state,'start'));service.execute('test_host_key_only',envelope(service.state,'begin'));
  setTime(startTime+30000);service.state.players.forEach(p=>service.touch({kind:'player',id:p.id}));service.execute(service.state.players[0].token!,envelope(service.state,'input',{choice:'signal'}));
  const restored=new RoomService(store,'test_host_key_only',pack,()=>startTime+300000);assert.equal(restored.state.paused,true);assert.equal(restored.state.remaining,60000);assert.equal(restored.state.inputs.seat_1.choice,'signal');
});

test('stale round/stage commands are rejected and a failed SQLite transaction cannot acknowledge or apply input',()=>{
  const s=fixture('actions','lantern_storm');const stale=envelope(s,'input',{choice:'Shield'});s.round=2;assert.throws(()=>command(s,pack,{kind:'player',id:'seat_1'},stale,startTime),/earlier round/);
  const {service,store}=serviceFixture();const p=service.state.players[0];const joined=service.join(p.id,p.invite);service.mutate(copy=>{copy.phase='selection';copy.stage='scene';copy.deadline=startTime+60000;});
  const cmd=envelope(service.state,'input',{choice:'aboard',ready:true});const prior=JSON.stringify(service.state);
  store.db.exec("CREATE TRIGGER reject_ack BEFORE INSERT ON accepted_commands BEGIN SELECT RAISE(ABORT,'injected commit failure'); END");
  assert.throws(()=>service.execute(joined.token,cmd),/injected/);assert.equal(JSON.stringify(service.state),prior);assert.equal(store.active()!.inputs.seat_1,undefined);assert.equal(store.db.prepare('SELECT count(*) AS n FROM accepted_commands').get()!.n,0);
  store.db.exec('DROP TRIGGER reject_ack');assert.equal(service.execute(joined.token,cmd).accepted,true);assert.equal(service.state.inputs.seat_1.choice,'aboard');
});

test('actual process exits recover an acknowledged deal, a resolved storm stage and pre-reveal finale',()=>{
  for(const scenario of ['ack','storm','finale']){
    const path=join(mkdtempSync(join(tmpdir(),'mistbound-process-')),'room.sqlite');
    const child=spawnSync(process.execPath,['--import','tsx','scripts/crash-fixture.ts',path,scenario],{cwd:process.cwd(),windowsHide:true,encoding:'utf8'});assert.equal(child.status,23,child.stderr);
    const store=new Store(path);stores.push(store);const service=new RoomService(store,'crash_host',pack);assert.equal(service.state.paused,true);assert.equal(service.state.players[0].agenda,'Saboteur');
    if(scenario==='ack'){assert.equal(service.state.inputs.seat_2.choice,'deal_effort');assert.equal(service.state.players[1].coins,0);assert.equal(service.state.players[1].effort,true);service.execute('crash_host',envelope(service.state,'pause'));service.mutate(copy=>copy.players.forEach(x=>copy.inputs[x.id]={...copy.inputs[x.id],ready:true}));service.execute('crash_host',envelope(service.state,'resolve'));assert.equal(service.state.players[1].coins,1);assert.equal(service.state.players[1].effort,false);}
    if(scenario==='storm'){assert.equal(service.state.phase,'consequences');assert.equal(service.state.resources.integrity,4);assert.equal(service.state.power,1);service.execute('crash_host',envelope(service.state,'pause'));service.execute('crash_host',envelope(service.state,'continue'));assert.equal(service.state.stage,'W2');assert.equal(service.state.resources.integrity,4);assert.equal(service.state.power,1);}
    if(scenario==='finale'){assert.equal(service.state.outcome,undefined);assert.equal(service.state.inputs.seat_1.theft,true);service.execute('crash_host',envelope(service.state,'pause'));service.execute('crash_host',envelope(service.state,'resolve'));assert.equal(service.state.outcome!.security,'Stolen');assert.equal(service.state.outcome!.mission,'Delivered');}
  }
});

function fullJourney(p:Pack,intrigueMode=false) {
  const s=newState(p);s.players.forEach(x=>x.token='joined');if(intrigueMode)act(s,'configure',{mode:'intrigue'},gm,startTime,p);act(s,'start',{},gm,startTime,p);
  let steps=0;
  while(s.phase!=='ended'&&steps++<150){
    if(s.phase==='reading'){act(s,'begin',{},gm,startTime,p);continue;}
    if(s.phase==='consequences'){act(s,'continue',{},gm,startTime,p);continue;}
    if(s.phase==='guardian'){expire(s,p,startTime+10000);continue;}
    if(s.phase==='discussion'){act(s,'resolve',{},gm,startTime,p);continue;}
    if(s.phase==='tie'){expire(s,p,startTime+20000);continue;}
    assert.equal(s.phase,'selection');
    const scene=p.scenes.find(x=>x.id===s.scene)!;
    let choice='';
    if(s.stage==='scene')choice=scene.family==='deduction'?'north':scene.family==='rest'?scene.default:scene.family==='negotiation'?scene.default:scene.options.find(x=>x.id==='aboard')?.id||scene.default;
    if(s.stage==='purchase')choice='none';
    if(s.stage==='watch')choice='abstain';if(s.stage==='watch_confirm'||s.stage==='chest')choice='no';if(s.stage==='finale')choice='finish';
    for(const [i,player] of s.players.entries()){
      let own=choice;
      if(s.stage==='actions')own=s.round===1?(i<2?'Shield':i<5?'Supply':'Repel'):s.round===2?(i>=4&&i<=6?'Shield':i<3?'Supply':'Repel'):(i===0||i===1||i===4||i===5?'Shield':'Supply');
      if(s.stage==='W1'||s.stage==='W2')own=player.agenda==='Saboteur'?'plot':player.agenda==='Independent Broker'?(s.stage==='W1'?'deal_effort':'deal_role'):'skip';
      act(s,'input',{choice:own,ready:true,...(s.stage==='finale'&&player.agenda==='Saboteur'?{theft:true}:{})},{kind:'player',id:player.id},startTime,p);
    }
    act(s,'resolve',{},gm,startTime,p);
  }
  assert(steps<150);return s;
}

test('complete cooperative mission and certified intrigue both play to distinct mission/security/agenda outcomes',()=>{
  const coop=fullJourney(pack);assert.equal(coop.outcome!.mission,'Delivered');assert.equal(coop.power,3);assert.equal(coop.flags.family_aboard,true);assert(coop.outcome!.agendas.every(x=>x.success));assert.equal(coop.events.filter(x=>x.type==='storm_actions').length,3);
  const hidden=fullJourney(pack,true);assert.equal(hidden.outcome!.mission,'Delivered');assert.equal(hidden.outcome!.security,'Stolen');assert.equal(hidden.players.find(x=>x.agenda==='Independent Broker')!.coins,2);assert.equal(hidden.events.filter(x=>x.type==='storm_actions').length,3);assert.equal(hidden.traces.length,2);
});

test('second JSON mission completes with the unchanged engine and creates its own negotiation consequences',()=>{
  const s=fullJourney(second);assert.equal(s.outcome!.mission,'Delivered');assert.equal(s.flags.medicine_obtained,true);assert.equal(s.flags.return_promise,true);assert.match(s.summary[0],/medicine/);assert.equal(s.journal[0].title,second.title);
  const {service}=serviceFixture();service.state=s;service.store.commit(s);const identities=s.players.map(x=>x.memberId);service.newMission('test_host_key_only',pack.id,pack.version);assert.deepEqual(service.state.players.map(x=>x.memberId),identities);assert.equal(service.state.journal.length,1);assert.deepEqual(service.state.resources,{supplies:6,integrity:5,alarm:0});
});

test('HTTP room: eight independent client tokens, public/GM/player permissions and cross-origin rejection',async()=>{
  const {service}=serviceFixture();const app=createApp(service);app.use(errorHandler);const server=app.listen(0,'127.0.0.1');await new Promise<void>(done=>server.once('listening',done));const address=server.address() as any;const base=`http://127.0.0.1:${address.port}`;
  const http=async(path:string,token='',body?:unknown,origin?:string)=>{const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:`Bearer ${token}`} :{}),...(body===undefined?{}:{'Content-Type':'application/json'}),...(origin?{Origin:origin}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,json:await res.json()};};
  try{
    const clients=await Promise.all(service.state.players.map(p=>http('/api/join','',{seat:p.id,invite:p.invite})));assert(clients.every(x=>x.status===200));
    const tv=await http('/api/state?view=tv');assert.equal(tv.json.players.filter((x:any)=>x.joined).length,8);assert.equal((await http('/api/state?view=gm',clients[0].json.token)).status,400);assert.equal((await http('/api/packs')).status,400);
    const host=await http('/api/state?view=gm','test_host_key_only');assert(host.json.private);assert(!tv.json.private);
    assert.equal((await http('/api/command','test_host_key_only',envelope(service.state,'start'),'https://untrusted.example')).status,403);
    assert.equal((await http('/api/command','test_host_key_only',envelope(service.state,'start'))).status,200);
    const phones=await Promise.all(clients.map(c=>http('/api/state?view=player',c.json.token)));assert.equal(new Set(phones.map(x=>x.json.own.id)).size,8);assert(phones.every(x=>!x.json.private));
  }finally{await new Promise<void>(done=>server.close(()=>done()));}
});
