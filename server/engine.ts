import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import type { Actor, Agenda, Card, Command, Input, Mode, Next, Option, Outcome, Pack, Resources, Seat, Squad, Stage, State } from './model.ts';
import { digestPack } from './packs.ts';

export class RuleError extends Error {}
export function requireRule(ok: unknown, message: string): asserts ok { if (!ok) throw new RuleError(message); }
export const secret = () => randomBytes(24).toString('base64url');
export const squads: Squad[] = ['pathfinder','mechanics'];
export const names = ['Việt Hùng','Hòa Hiệp','Bảo Trân','Hoàng Phúc','Minh Trung','Phương Quyên','Minh Phương','Kim Hân'];
const roles = ['Scout','Engineer','Guardian'] as const;
export const shuffle = <T>(array: T[]): T[] => {
  const out = [...array]; for (let i=out.length-1;i>0;i--) { const j=randomInt(i+1); [out[i],out[j]]=[out[j],out[i]]; } return out;
};
export const sceneOf = (s: State,p: Pack) => p.scenes.find(scene=>scene.id===s.scene)!;
export const stageKey = (s: State) => `${s.instance}:${s.round}:${s.stage}:${s.attempts}:${s.hints}`;
export function event(s: State,type: string,data: unknown,actor='server',visibility: 'public'|'gm'='public',key=stageKey(s)) {
  s.events.push({ordinal:s.events.length+1,key,actor,type,visibility,data,at:Date.now()});
}
export function newState(pack: Pack, previous?: State): State {
  const players: Seat[] = names.map((name,i)=>({id:`seat_${i+1}`,memberId:previous?.players[i]?.memberId || randomUUID(),name:previous?.players[i]?.name || name,squad:previous?.players[i]?.squad || (i<4?'pathfinder':'mechanics'),role:previous?.players[i]?.role || roles[i%3],invite:secret(),token:null,agenda:'Loyal Crew',effort:true,ability:true,coins:0,plots:0,intrigue:0,preference:null,notice:''}));
  return {id:randomUUID(),revision:1,rulesVersion:3,pack:{id:pack.id,version:pack.version,digest:digestPack(pack)},seed:secret(),gm:previous?.gm || {memberId:randomUUID(),name:'Thái Bảo'},mode:'cooperative',phase:'lobby',stage:'scene',instance:randomUUID(),round:1,deadline:null,paused:false,remaining:null,disconnectPauseKeys:[],players,resources:{...pack.mission.resources},urgent:false,flags:{bell:true},power:0,scene:pack.mission.entryScene,inputs:{},shared:[],claims:[],attempts:0,hints:0,priority:0,chest:false,traces:[],shields:{pathfinder:0,mechanics:0},losses:{pathfinder:0,mechanics:0},pendingPower:false,pendingRepel:false,summary:[],events:[],resolved:[],journal:previous?.journal || []};
}
function change(s: State,key: keyof Resources,delta: number) { const max = key==='supplies'?12:6; s.resources[key]=Math.max(0,Math.min(max,s.resources[key]+delta)); }
function urgency(s: State) { if (s.resources.alarm===6) s.urgent=true; }
function resetInputs(s: State) { s.inputs={}; s.tie=undefined; s.deadline=null; s.remaining=null; }
function select(s: State,stage: Stage,seconds: number,now: number) { resetInputs(s); s.stage=stage; s.phase='selection'; s.deadline=now+seconds*1000; }
function enter(s: State,id: string,p: Pack) { const scene=p.scenes.find(x=>x.id===id); requireRule(scene,'Pinned content has no such scene'); s.scene=id; s.instance=randomUUID(); s.round=1; s.attempts=0; s.hints=0; resetInputs(s); s.stage='scene'; s.phase='reading'; s.summary=[]; }
function consequence(s: State,summary: string[],next: Next) { s.summary=summary; s.phase='consequences'; s.deadline=null; s.next=next; }
function emergency(s: State,now: number) {
  if (s.resources.integrity>0) return false;
  s.next=undefined; s.watched=undefined; select(s,'salvage',60,now);
  s.summary=['Integrity is zero. Delivery and further private arrangements are disabled. Everyone chooses a final salvage.'];
  event(s,'evacuation',{resources:{...s.resources}}); return true;
}
function priorityPlayers(s: State) { return [...s.players].sort((a,b)=>(s.players.indexOf(a)-s.priority+8)%8-(s.players.indexOf(b)-s.priority+8)%8); }
function engineers(s: State) { return priorityPlayers(s).filter(p=>p.role==='Engineer'&&p.ability&&s.inputs[p.id]?.engineer); }
function conditions(s: State,o: Option) { return o.conditions.every(c=>c.op==='resource'?s.resources[c.key]>=c.min:Boolean(s.flags[c.key])===c.equals) && (!o.effects.some(e=>e.op==='repair') || s.resources.integrity<6); }
function optionCost(s: State,o: Option) { return Math.max(o.cost>0?1:0,o.cost-(o.engineer&&engineers(s).length?1:0)); }
function shieldQuote(s: State,choice: string) {
  const targets = choice==='both'?squads:squads.includes(choice as Squad)?[choice as Squad]:[];
  let voucher=Boolean(s.flags.voucher&&!s.flags.voucher_used); const available=engineers(s); const uses: string[]=[]; let cost=0;
  for (const squad of targets) { if (voucher) {cost+=1;voucher=false;} else if (available.length) {cost+=1;uses.push(available.shift()!.id);} else cost+=2; }
  return {targets,cost,uses,voucherUsed:Boolean(targets.length&&s.flags.voucher&&!s.flags.voucher_used)};
}
export function choices(s: State,p: Pack,player?: Seat) {
  const pair = (id: string,title: string,detail='',available=true) => ({id,title,detail,available});
  switch (s.stage) {
    case 'W1': case 'W2': {
      if (!player) return [pair('skip','Skip'),pair('deal_effort','Personal deal — spend Effort'),pair('deal_role','Personal deal — spend role use')];
      const watched=s.stage==='W2'&&s.watched===player.id;
      return [pair('skip','Skip','No cost.'),pair('deal_effort','Personal deal — spend Effort','Earn 1 Coin; Effort is unavailable for the rest of this mission.',player.effort&&!watched),pair('deal_role','Personal deal — spend role use','Earn 1 Coin; public role ability is unavailable for the rest of this mission.',player.ability&&!watched),...(player.agenda==='Saboteur'?[pair('plot','Plot',s.stage==='W1'?'Spend 1 Intrigue, lose 1 shared Supply.':'Spend 1 Intrigue, add 1 Alarm.',!watched&&player.intrigue>0&&(s.stage==='W1'?s.resources.supplies>0:s.resources.alarm<6))]:[])];
    }
    case 'watch': return [pair('abstain','Abstain'),...s.players.map(x=>pair(x.id,x.name,'Requires at least five votes; paid confirmation follows.'))];
    case 'watch_confirm': return [pair('no','Do not purchase Watch'),pair('yes','Purchase temporary Watch','Spend 1 Supply. Only this seat’s W2 arrangement is blocked.',s.resources.supplies>=1)];
    case 'chest': return [pair('no','Keep Supplies'),pair('yes','Secure the seal chest','Spend 2 Supplies. Prevents Theft.',s.resources.supplies>=2)];
    case 'finale': return [pair('finish','Finish','Select one seat or abstain below; all final choices share this deadline.')];
    case 'salvage': return [pair('people','Rescue the passenger records'),pair('tools','Recover the tools'),pair('bell','Recover the crew’s mementos')];
    case 'purchase': return ['none','pathfinder','mechanics','both'].map(id=>pair(id,id==='none'?'Buy no shields':`Buy Shield: ${id}`,`${shieldQuote(s,id).cost} Supplies. One contribution per selected squad, this round only.`,shieldQuote(s,id).cost<=s.resources.supplies));
    case 'actions': return [pair('Shield','Shield',`Protect your own squad: ${player?.squad || 'own squad'}.`),pair('Supply','Supply','Three actions together gain 1 Supply and a power round.'),pair('Repel','Repel','Three actions together remove 1 Alarm.')];
    default: { const scene=sceneOf(s,p); return [...scene.options.map(o=>pair(o.id,o.title,`${o.cost?`Cost ${optionCost(s,o)} Supplies. `:''}${o.consequence}`,conditions(s,o)&&optionCost(s,o)<=s.resources.supplies)),...(scene.puzzle&&s.hints<scene.puzzle.hints.length?[pair('request_hint','Open the next hint','Shared vote; costs 1 Alarm. A Scout can instead open the first hint free.')]:[])]; }
  }
}
export function defaultChoice(s: State,p: Pack) { return ({purchase:'none',actions:'Shield',W1:'skip',W2:'skip',watch:'abstain',watch_confirm:'no',chest:'no',finale:'finish',salvage:'people'} as Partial<Record<Stage,string>>)[s.stage] || sceneOf(s,p).default; }
function plurality(s: State,p: Pack,now: number): string | null {
  const opts=choices(s,p).filter(o=>o.available).map(o=>o.id); const counts=new Map(opts.map(o=>[o,0]));
  for (const i of Object.values(s.inputs)) if (i.choice&&counts.has(i.choice)) counts.set(i.choice,counts.get(i.choice)!+1);
  const highest=Math.max(0,...counts.values()); if (!highest) return defaultChoice(s,p);
  const tied=opts.filter(o=>counts.get(o)===highest); if (tied.length===1) return tied[0];
  s.tie={options:tied,seat:s.players[s.priority].id}; s.phase='tie'; s.deadline=now+20000; s.priority=(s.priority+1)%8;
  event(s,'tie',{options:tied,seat:s.tie.seat,fallback:tied[0]}); return null;
}
export function identify(inputs: Record<string,Input>,key: 'choice'|'accusation',players: Seat[]): string | undefined {
  return players.find(p=>Object.values(inputs).filter(i=>i[key]===p.id).length>=5)?.id;
}
export function securityOutcome(s: State): Outcome['security'] {
  if (s.resources.integrity<=0) return 'Not Applicable';
  const sab=s.players.find(p=>p.agenda==='Saboteur');
  return s.mode==='intrigue'&&sab&&sab.plots>0&&s.inputs[sab.id]?.theft===true&&!s.chest&&identify(s.inputs,'accusation',s.players)!==sab.id?'Stolen':'Secured';
}
function finish(s: State,p: Pack,salvage?: string,interrupted=false) {
  const mission=interrupted?'Interrupted':s.resources.integrity<=0?'Evacuated':s.urgent?'Urgent Delivery':'Delivered';
  const security=interrupted?'Not Applicable':securityOutcome(s); const delivered=mission==='Delivered'||mission==='Urgent Delivery';
  s.outcome={mission,security,late:Boolean(s.flags.late),flags:{...s.flags},salvage,agendas:s.players.map(x=>({seat:x.id,name:x.name,agenda:x.agenda,coins:x.coins,plots:x.plots,success:delivered&&(s.mode==='cooperative'||(x.agenda==='Loyal Crew'?security==='Secured':x.agenda==='Saboteur'?security==='Stolen'&&x.plots>0:x.coins>=2))}))};
  s.phase='ended'; s.deadline=null; s.paused=false; s.remaining=null;
  s.summary=[interrupted?'The GM ended this mission as interrupted. No hidden role was played on a missing person’s behalf.':mission==='Evacuated'?p.mission.endings.evacuated:mission==='Urgent Delivery'?p.mission.endings.urgent:p.mission.endings.delivered];
  s.journal.push({session:s.id,title:p.title,outcome:structuredClone(s.outcome)}); event(s,'outcome',s.outcome);
}
function markResolved(s: State) { const key=stageKey(s); requireRule(!s.resolved.includes(key),'Stage already resolved'); s.resolved.push(key); }
function trace(s: State,actor: Seat) {
  const others=s.players.filter(x=>x.id!==actor.id).map(x=>x.id); let group: string[];
  if (s.traces.length) { const shared=shuffle(s.traces[0].seats.filter(x=>x!==actor.id))[0]; group=[actor.id,shared,...shuffle(others.filter(x=>x!==shared)).slice(0,2)]; }
  else group=[actor.id,...shuffle(others).slice(0,3)];
  const seats=shuffle(group); const card={id:`trace_${s.traces.length+1}`,seats,text:'Authenticated access trace: these four seats had access. Access is not proof of sabotage.'}; s.traces.push(card); return card;
}
function privateWindow(s: State,p: Pack,now: number) {
  markResolved(s); let deals=0; let plotted=false; const before={...s.resources};
  for (const player of s.players) {
    const input=s.inputs[player.id]?.choice || 'skip'; player.notice='Arrangement resolved: Skip.';
    if (s.stage==='W2'&&s.watched===player.id) { player.notice='Watch blocked this private arrangement only. Your normal actions and final vote remain available.'; continue; }
    if (input==='deal_effort'&&player.effort || input==='deal_role'&&player.ability) {
      if (input==='deal_effort') player.effort=false; else player.ability=false;
      player.coins++; deals++; player.notice='Deal committed: +1 Coin. Your offered resource is spent.';
      event(s,'deal',{resource:input,coins:player.coins},player.id,'gm');
    } else if (input==='plot'&&player.agenda==='Saboteur'&&player.intrigue>0) {
      const available=s.stage==='W1'?s.resources.supplies>=1:s.resources.alarm<6;
      if (!available) {player.notice='Plot unavailable at closure; no Intrigue spent. Skip applied.';continue;}
      change(s,s.stage==='W1'?'supplies':'alarm',s.stage==='W1'?-1:1); player.intrigue--; player.plots++; plotted=true;
      player.notice='Plot committed: 1 Intrigue spent; shared resource effect applied.'; event(s,'plot',{window:s.stage,before,after:{...s.resources}},player.id,'gm'); trace(s,player);
    }
  }
  urgency(s); const window=s.stage;
  const summary=[`${deals} personal deal${deals===1?'':'s'} completed.`,plotted?'Confirmed tampering; an authenticated access trace is available.':'No confirmed tampering.',`Shared change: Supplies ${s.resources.supplies-before.supplies}; Alarm ${s.resources.alarm-before.alarm}.`];
  event(s,'private_window_summary',{window,deals,tampering:plotted,resources:{...s.resources}});
  if (window==='W2') s.watched=undefined;
  consequence(s,summary,window==='W1'?{kind:'stage',stage:'watch'}:{kind:'round'});
}
function resolveActions(s: State,p: Pack,now: number) {
  // Actions and Guardian application have separate keys. All eight defaults are frozen here.
  markResolved(s); const actions=s.players.map(player=>({player,action:s.inputs[player.id]?.choice || 'Shield'}));
  const threatened=s.round===1?['pathfinder']:s.round===2?['mechanics']:squads;
  s.losses={pathfinder:0,mechanics:0};
  for (const squad of threatened as Squad[]) { const need=2+(s.round===2&&squad==='mechanics'&&s.flags.family_aboard?1:0); const count=actions.filter(x=>x.player.squad===squad&&x.action==='Shield').length+s.shields[squad]; s.losses[squad]=count>=need?0:1; }
  s.pendingPower=actions.filter(x=>x.action==='Supply').length>=3; s.pendingRepel=actions.filter(x=>x.action==='Repel').length>=3;
  event(s,'storm_actions',{round:s.round,actions:actions.map(x=>({seat:x.player.id,action:x.action})),losses:{...s.losses}});
  resetInputs(s); s.phase='guardian'; s.deadline=now+10000;
  // No eligible Guardian means the full ordinary stage can be resolved immediately.
  if (!s.players.some(x=>x.role==='Guardian'&&x.ability&&s.losses[x.squad]>0)) finishStorm(s,p,now);
}
function finishStorm(s: State,p: Pack,now: number) {
  const key=`${stageKey(s)}:ordinary`; requireRule(!s.resolved.includes(key),'Ordinary round already resolved'); s.resolved.push(key);
  const before={...s.resources}; const guardians=priorityPlayers(s).filter(x=>x.role==='Guardian'&&x.ability&&s.inputs[x.id]?.guardian);
  for (const squad of squads) { const defender=guardians.find(x=>x.squad===squad); if (s.losses[squad]&&defender) { s.losses[squad]=0; defender.ability=false; event(s,'guardian',{squad,round:s.round},defender.id); } }
  s.priority=(s.priority+1)%8;
  const lost=s.losses.pathfinder+s.losses.mechanics; change(s,'integrity',-lost);
  if (emergency(s,now)) return;
  if (s.pendingPower) { change(s,'supplies',1); s.power++; }
  if (lost) change(s,'alarm',1);
  if (s.pendingRepel) change(s,'alarm',-1);
  urgency(s);
  const summary=[`Round ${s.round}: ${lost} Integrity lost.`,s.pendingPower?'Power threshold met: +1 Supply and one power round.':'Power threshold not met.',s.pendingRepel?'Repel threshold met: −1 Alarm.':'Repel threshold not met.'];
  event(s,'ordinary_storm',{round:s.round,before,after:{...s.resources},power:s.power,urgent:s.urgent});
  let next: Next={kind:'round'};
  if (s.round===2&&s.mode==='intrigue') next={kind:'stage',stage:'W2'};
  if (s.round===3) {
    if (s.power<2) { s.flags.late=true; change(s,'alarm',2); urgency(s); summary.push('Fewer than two power rounds: +2 Alarm; late delivery recorded.'); }
    next=s.mode==='intrigue'?{kind:'discussion'}:{kind:'finish'};
  }
  consequence(s,summary,next);
}
function sharedDecision(s: State,p: Pack,choice: string,now: number) {
  markResolved(s); const stage=s.stage;
  if (stage==='watch') {
    s.nominated=identify(s.inputs,'choice',s.players);
    consequence(s,[s.nominated?`${s.players.find(x=>x.id===s.nominated)!.name} received five or more Watch votes. Confirm the 1 Supply cost next.`:'No seat received five Watch votes.'],s.nominated?{kind:'stage',stage:'watch_confirm'}:{kind:'scene',id:s.resumeScene!}); return;
  }
  if (stage==='watch_confirm') {
    const paid=choice==='yes'&&s.resources.supplies>=1; if (paid) {change(s,'supplies',-1);s.watched=s.nominated;}
    event(s,'watch',{seat:paid?s.watched:null,cost:paid?1:0}); consequence(s,[paid?'Watch purchased. This seat’s W2 arrangement will be Skip; all normal play remains available.':'No Watch purchased.'],{kind:'scene',id:s.resumeScene!}); return;
  }
  if (stage==='chest') {
    s.chest=choice==='yes'&&s.resources.supplies>=2; if (s.chest) change(s,'supplies',-2);
    event(s,'chest',{protected:s.chest,cost:s.chest?2:0}); consequence(s,[s.chest?'Seal chest protected for 2 Supplies.':'Seal chest remains unprotected.'],{kind:'stage',stage:'finale'}); return;
  }
  if (stage==='salvage') { s.flags[`salvage_${choice}`]=true; finish(s,p,choice); return; }
  if (stage==='purchase') {
    const quote=shieldQuote(s,choice); requireRule(quote.cost<=s.resources.supplies,'Purchase is no longer affordable');
    change(s,'supplies',-quote.cost); s.shields={pathfinder:0,mechanics:0}; quote.targets.forEach(x=>s.shields[x]=1); quote.uses.forEach(id=>s.players.find(x=>x.id===id)!.ability=false); if (quote.voucherUsed) s.flags.voucher_used=true;
    event(s,'shields',{round:s.round,squads:quote.targets,cost:quote.cost,engineers:quote.uses}); consequence(s,[quote.targets.length?`Purchased one Shield contribution in ${quote.targets.join(' and ')} for ${quote.cost} Supplies.`:'No Shields purchased.'],{kind:'stage',stage:'actions'}); return;
  }
  const scene=sceneOf(s,p);
  if (scene.family==='deduction') {
    if (choice==='request_hint') {
      const text=scene.puzzle!.hints[s.hints++]; change(s,'alarm',1); urgency(s);
      s.shared.push({id:`${s.instance}_hint_${s.hints}`,issuer:'Route registry',type:'authenticated',text,factRefs:['canonical_route']});
      event(s,'hint',{text,cost:1});consequence(s,[text,'+1 Alarm.'],{kind:'scene',id:scene.id});return;
    }
    const puzzle=scene.puzzle!; const correct=choice===puzzle.answer;
    if (!correct) {s.attempts++;change(s,'alarm',1);} urgency(s);
    const solved=correct||s.attempts>=puzzle.maxAttempts;
    event(s,'deduction',{choice,correct,attempts:s.attempts,resources:{...s.resources}});
    consequence(s,[correct?'The combined facts identify the correct bridge. No risk roll is required.':`Incorrect or absent answer: +1 Alarm (${s.attempts}/${puzzle.maxAttempts}).`,...(solved?[`Canonical answer: ${puzzle.answer}. It is open, supports the load and reaches ${puzzle.destination}.`]:[])],{kind:'scene',id:solved?scene.next!:scene.id}); return;
  }
  const o=scene.options.find(x=>x.id===choice); requireRule(o&&conditions(s,o),'Choice unavailable'); const cost=optionCost(s,o); requireRule(cost<=s.resources.supplies,'Insufficient Supplies');
  const before={...s.resources}; change(s,'supplies',-cost);
  if (o.engineer&&cost<o.cost) {const engineer=engineers(s)[0]; engineer.ability=false; event(s,'engineer',{cost,option:o.id},engineer.id);}
  for (const effect of o.effects) {
    switch (effect.op) {
      case 'resource': change(s,effect.key,effect.delta); break;
      case 'flag': s.flags[effect.key]=effect.value; break;
      case 'repair': change(s,'integrity',1); break;
      case 'risk': {
        const contributors=priorityPlayers(s).filter(x=>x.effort&&s.inputs[x.id]?.effort).slice(0,4); const raw=randomInt(1,21); const total=raw+contributors.length;
        s.lastRoll={raw,dc:effect.dc,total,contributors:contributors.map(x=>x.id),success:total>=effect.dc}; contributors.forEach(x=>x.effort=false); s.priority=(s.priority+1)%8;
        if (total<effect.dc) change(s,'integrity',-effect.failureIntegrity); event(s,'risk',s.lastRoll); break;
      }
    }
  }
  urgency(s); event(s,'choice',{option:o.id,before,after:{...s.resources},flags:{...s.flags}});
  if (emergency(s,now)) return;
  s.resumeScene=o.next;
  const next: Next=scene.checkpoint==='rest'&&s.mode==='intrigue'?{kind:'stage',stage:'W1'}:{kind:'scene',id:o.next};
  consequence(s,[o.consequence,`Applied: Supplies ${s.resources.supplies-before.supplies}; Integrity ${s.resources.integrity-before.integrity}; Alarm ${s.resources.alarm-before.alarm}.`,...(s.lastRoll&&o.effects.some(e=>e.op==='risk')?[`d20 ${s.lastRoll.raw} + ${s.lastRoll.contributors.length} Effort = ${s.lastRoll.total} vs DC ${s.lastRoll.dc}.`]:[])],next);
}
export function resolve(s: State,p: Pack,now: number,timeout=false) {
  requireRule(!s.paused,'Room is paused');
  if (s.phase==='guardian') {requireRule(timeout,'Guardian responses remain open for ten seconds');finishStorm(s,p,now);return;}
  if (s.phase==='discussion') {select(s,'chest',60,now);return;}
  if (s.phase==='tie') {requireRule(timeout,'The designated seat has twenty seconds'); const choice=s.tie!.options[0];s.phase='selection';s.tie=undefined;sharedDecision(s,p,choice,now);return;}
  requireRule(s.phase==='selection','Input is closed');
  requireRule(timeout||s.players.every(x=>s.inputs[x.id]?.ready),'All eight players must be Ready');
  if (s.stage==='W1'||s.stage==='W2') {privateWindow(s,p,now);return;}
  if (s.stage==='actions') {resolveActions(s,p,now);return;}
  if (s.stage==='finale') {markResolved(s);finish(s,p);return;}
  if (s.stage==='watch') {sharedDecision(s,p,'abstain',now);return;}
  const choice=plurality(s,p,now); if (choice!==null) sharedDecision(s,p,choice,now);
}
function input(s: State,p: Pack,player: Seat,payload: Record<string,unknown>) {
  requireRule(s.phase==='selection'&&!s.paused,'Input is closed or paused');
  const keys=['choice','ready','effort','engineer','accusation','theft']; requireRule(Object.keys(payload).every(x=>keys.includes(x)),'Invalid input fields');
  for (const key of ['ready','effort','engineer','theft']) requireRule(payload[key]===undefined||typeof payload[key]==='boolean','Invalid input value');
  requireRule(payload.choice===undefined||typeof payload.choice==='string','Invalid choice');
  const next: Input={...s.inputs[player.id],...payload};
  if (next.choice && next.choice!=='abstain') requireRule(choices(s,p,player).some(o=>o.id===next.choice&&o.available),'Choice unavailable');
  if (next.accusation!==undefined) requireRule(s.stage==='finale'&&(next.accusation==='abstain'||s.players.some(x=>x.id===next.accusation)),'Invalid accusation');
  if (next.theft) requireRule(s.stage==='finale'&&player.agenda==='Saboteur','Theft is unavailable');
  if (next.effort) requireRule(s.stage==='scene'&&sceneOf(s,p).options.some(o=>o.effects.some(e=>e.op==='risk'))&&player.effort,'Effort unavailable');
  if (next.engineer) requireRule(['scene','purchase'].includes(s.stage)&&player.role==='Engineer'&&player.ability,'Engineer consent unavailable');
  s.inputs[player.id]=next;
}
export function command(s: State,p: Pack,actor: Actor,cmd: Command,now=Date.now()) {
  requireRule(cmd.instance===s.instance,'This screen belongs to an earlier scene. Refresh.');
  requireRule(cmd.stageKey===stageKey(s),'This choice belongs to an earlier round or stage. Refresh.');
  const payload=cmd.payload;
  if (actor.kind==='gm') {
    switch (cmd.type) {
      case 'configure': {
        requireRule(s.phase==='lobby','Roster and mode lock at departure');
        requireRule(Object.keys(payload).every(x=>['players','mode','gmName'].includes(x)),'Invalid configuration');
        if (payload.mode!==undefined) {requireRule(p.mission.allowedModes.includes(payload.mode as Mode),'Pack does not support this mode');s.mode=payload.mode as Mode;}
        if (payload.gmName!==undefined) {requireRule(typeof payload.gmName==='string'&&payload.gmName.trim().length>0&&payload.gmName.length<=60,'Invalid GM name');s.gm.name=payload.gmName.trim();}
        if (payload.players!==undefined) {
          requireRule(Array.isArray(payload.players)&&payload.players.length===8,'Eight seats required');
          const seen=new Set<string>();
          for (const raw of payload.players) {requireRule(raw&&typeof raw==='object','Invalid player');const row=raw as any; requireRule(typeof row.id==='string'&&!seen.has(row.id),'Duplicate seat');seen.add(row.id);const seat=s.players.find(x=>x.id===row.id);requireRule(seat&&typeof row.name==='string'&&row.name.trim().length>0&&row.name.length<=60&&squads.includes(row.squad)&&roles.includes(row.role),'Invalid profile');seat.name=row.name.trim();seat.squad=row.squad;seat.role=row.role;}
          requireRule(squads.every(squad=>s.players.filter(x=>x.squad===squad).length===4),'Each squad needs four players');
        }
        break;
      }
      case 'start': {
        requireRule(s.phase==='lobby'&&s.players.every(x=>x.token),'Join all eight phones before departure');
        if (s.players.some(x=>x.preference==='cooperative')) s.mode='cooperative';
        const agendas: Agenda[]=s.mode==='intrigue'?shuffle(['Loyal Crew','Loyal Crew','Loyal Crew','Loyal Crew','Loyal Crew','Loyal Crew','Saboteur','Independent Broker'] as Agenda[]):Array(8).fill('Loyal Crew');
        s.players.forEach((x,i)=>{x.agenda=agendas[i];x.intrigue=x.agenda==='Saboteur'?2:0;x.preference=null;});
        event(s,'departure',{mode:s.mode,agendaCounts:s.mode==='intrigue'?[6,1,1]:[8,0,0]});enter(s,p.mission.entryScene,p);break;
      }
      case 'begin': requireRule(s.phase==='reading'&&!s.paused,'Reading is not open');select(s,sceneOf(s,p).family==='allocation'?'purchase':'scene',sceneOf(s,p).seconds,now);break;
      case 'resolve': resolve(s,p,now);break;
      case 'continue': {
        requireRule(s.phase==='consequences'&&!s.paused&&s.next,'No consequence to continue');const next=s.next;s.next=undefined;
        if (next.kind==='scene') {
          if (sceneOf(s,p).family==='deduction'&&next.id===s.scene) {resetInputs(s);s.phase='reading';s.stage='scene';} // bounded retries retain attempts/hints and instance
          else if (p.scenes.find(x=>x.id===next.id)?.family==='ending') finish(s,p); else enter(s,next.id,p);
        } else if (next.kind==='stage') select(s,next.stage,60,now);
        else if (next.kind==='round') {s.round++;s.shields={pathfinder:0,mechanics:0};select(s,'purchase',60,now);}
        else if (next.kind==='discussion') {resetInputs(s);s.phase='discussion';s.deadline=now+90000;s.stage='chest';}
        else finish(s,p);
        break;
      }
      case 'pause': requireRule(s.phase!=='ended','Mission has ended'); if (s.paused) {s.paused=false;s.deadline=s.remaining===null?null:now+s.remaining;s.remaining=null;} else {s.paused=true;s.remaining=s.deadline===null?null:Math.max(0,s.deadline-now);s.deadline=null;} break;
      case 'extend': {const seconds=payload.seconds??30;requireRule(Number.isInteger(seconds)&&Number(seconds)>=10&&Number(seconds)<=300,'Extension must be 10–300 seconds');requireRule(s.deadline!==null||s.remaining!==null,'No active timer');if(s.paused)s.remaining!+=Number(seconds)*1000;else s.deadline!+=Number(seconds)*1000;break;}
      case 'reassign': {const seat=s.players.find(x=>x.id===payload.seat);requireRule(seat,'Invalid seat');seat.token=null;seat.invite=secret();event(s,'device_reassignment',{seat:seat.id},'gm','gm');break;}
      case 'interrupt': requireRule(s.phase!=='ended','Already ended');finish(s,p,undefined,true);break;
      default: throw new RuleError('GM command is unavailable');
    }
  } else {
    const player=s.players.find(x=>x.id===actor.id);requireRule(player,'Seat missing');
    switch(cmd.type) {
      case 'input': input(s,p,player,payload); break;
      case 'role': requireRule(s.phase==='lobby'&&roles.includes(payload.role as any),'Choose a public role in the lobby');player.role=payload.role as Seat['role'];event(s,'public_role',{role:player.role},player.id);break;
      case 'preference': requireRule(s.phase==='lobby'&&['cooperative','intrigue'].includes(String(payload.mode)),'Preference unavailable');player.preference=payload.mode as Mode;break;
      case 'tie': requireRule(s.phase==='tie'&&!s.paused&&s.tie?.seat===player.id&&s.tie.options.includes(String(payload.choice)),'Tie decision unavailable'); {const choice=String(payload.choice);s.phase='selection';s.tie=undefined;sharedDecision(s,p,choice,now);} break;
      case 'guardian': requireRule(s.phase==='guardian'&&!s.paused&&player.role==='Guardian'&&player.ability&&s.losses[player.squad]>0,'Guardian unavailable');requireRule(typeof payload.use==='boolean','Guardian response required');s.inputs[player.id]={guardian:payload.use};break;
      case 'share': {
        requireRule(s.phase!=='lobby'&&s.phase!=='ended'&&!s.paused,'Sharing unavailable');const card=sceneOf(s,p).cards[s.players.indexOf(player)];requireRule(card&&payload.card===card.id,'This evidence does not belong to your seat');
        if (!s.shared.some(x=>x.id===card.id)) {s.shared.push(structuredClone(card));event(s,'shared_evidence',{card,author:player.name},player.id);} break;
      }
      case 'claim': requireRule(s.phase!=='lobby'&&s.phase!=='ended'&&!s.paused&&typeof payload.text==='string'&&payload.text.trim().length>0&&payload.text.length<=280&&s.claims.length<64,'Claim unavailable');s.claims.push({author:player.name,text:payload.text.trim(),type:'unverified claim'});event(s,'claim',s.claims.at(-1),player.id);break;
      case 'hint': {
        const scene=sceneOf(s,p);requireRule(s.phase==='selection'&&s.stage==='scene'&&!s.paused&&scene.puzzle&&s.hints<scene.puzzle.hints.length,'Hint unavailable');
        const free=s.hints===0&&player.role==='Scout'&&player.ability;
        requireRule(free,'A Scout can open the first hint here. For later hints, use the shared hint vote.');
        player.ability=false;const text=scene.puzzle.hints[s.hints++];s.shared.push({id:`${s.instance}_hint_${s.hints}`,issuer:'Route registry',type:'authenticated',text,factRefs:['canonical_route']});event(s,'hint',{text,cost:0},player.id);break;
      }
      default: throw new RuleError('Player command is unavailable');
    }
  }
  s.revision++;
}
export function expire(s: State,p: Pack,now=Date.now()) {
  if (s.paused||s.deadline===null||now<s.deadline) return false;
  resolve(s,p,now,true);s.revision++;return true;
}
export function restorePaused(s: State,now=Date.now()) {
  if(s.phase!=='ended'&&s.phase!=='lobby'&&!s.paused) {s.remaining=s.deadline===null?null:Math.max(0,s.deadline-now);s.deadline=null;s.paused=true;s.revision++;}
}
