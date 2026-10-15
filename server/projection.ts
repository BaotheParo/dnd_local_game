import { choices, defaultChoice, sceneOf, stageKey } from './engine.ts';
import type { Pack, Seat, State } from './model.ts';

export function publicView(s: State,p: Pack,connected: (seat: Seat)=>boolean) {
  const scene=sceneOf(s,p); const privateStage=['W1','W2','finale'].includes(s.stage);
  return {
    session:s.id,revision:s.revision,instance:s.instance,pack:{id:p.id,version:p.version,title:p.title},gmName:s.gm.name,
    mode:s.mode,agendaCounts:s.mode==='intrigue'?{loyal:6,saboteur:1,broker:1}:{loyal:8,saboteur:0,broker:0},
    phase:s.phase,stage:s.stage,round:s.round,deadline:s.deadline,paused:s.paused,remaining:s.remaining,
    scene:{id:scene.id,family:scene.family,title:scene.title,text:scene.text,practice:scene.practice},
    players:s.players.map(x=>({id:x.id,name:x.name,squad:x.squad,role:x.role,joined:Boolean(x.token),connected:connected(x)})),
    resources:{...s.resources},urgent:s.urgent,power:s.power,flags:{...s.flags},
    readyCount:privateStage?null:s.players.filter(x=>s.inputs[x.id]?.ready).length,
    // No input choices, ready seats, spending, individual timing or private explanations.
    choices:privateStage?[]:choices(s,p),optionPriority:privateStage?[]:choices(s,p).map(x=>x.id),
    defaultChoice:defaultChoice(s,p),
    shared:s.shared,claims:s.claims,traces:s.traces,summary:s.summary,
    tie:s.phase==='tie'?s.tie:null,watched:s.watched||null,chest:s.chest,losses:s.phase==='guardian'?s.losses:null,
    lastRoll:s.lastRoll||null,outcome:s.outcome||null,
    journal:s.journal,guardianSeconds:10,stageKey:stageKey(s),
  };
}
export function playerView(s: State,p: Pack,seat: Seat,connected: (seat: Seat)=>boolean) {
  const scene=sceneOf(s,p);
  return {...publicView(s,p,connected),choices:choices(s,p,seat),own:{id:seat.id,name:seat.name,preference:s.phase==='lobby'?seat.preference:null,agenda:s.phase==='lobby'?null:seat.agenda,effort:seat.effort,ability:seat.ability,coins:seat.coins,intrigue:seat.intrigue,plots:seat.plots,notice:seat.notice,input:s.inputs[seat.id]||{},cards:scene.cards[s.players.indexOf(seat)]?[scene.cards[s.players.indexOf(seat)]]:[]}};
}
export function gmView(s: State,p: Pack,connected: (seat: Seat)=>boolean) {
  return {...publicView(s,p,connected),private:{players:s.players.map(({token,preference,...x})=>({...x,joined:Boolean(token)})),inputs:s.inputs,answer:sceneOf(s,p).puzzle?.answer||null,timeline:s.events,packDigest:s.pack.digest,seed:s.seed}};
}
